"""
API principal: plataforma de análisis de retinografías.

- Carga de imagen y selección de modelos (A: segmentación, B: clasificación, C: detección).
- Trazabilidad de inferencias e historial básico.
- Postprocesamiento: etiquetas, probabilidades, datos para gráficas.
- Uso orientado a apoyo clínico/educativo (no diagnóstico).
"""

import asyncio
import time
from typing import Any, List, Optional

import numpy as np
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.preprocessing.fundus import preprocess_fundus
from backend.models.segmentation_vnet import segment_optic_disc
from backend.models.glaucoma_classifier import predict_glaucoma
from backend.models.lesion_detector import detect_hemorrhages
from backend.models.explainability import get_explanation_image_base64
from backend.postprocessing.report import build_report, graph_data_for_frontend
from backend.store import save_inference, get_inference, list_inferences

# Disclaimer fijo (apoyo/tamizaje, no diagnóstico)
DISCLAIMER = (
    "Este sistema es de apoyo clínico y educativo. No constituye diagnóstico médico. "
    "Los resultados deben ser interpretados por un profesional de la salud. "
    "No usar como único criterio para decisiones clínicas."
)

app = FastAPI(title=settings.app_name, version="0.3.0")


def _read_image_from_upload(file: UploadFile) -> np.ndarray:
    import cv2
    contents = file.file.read()
    arr = np.frombuffer(contents, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("El archivo no es una imagen válida o no pudo decodificarse.")
    return img


def _cdr_interpretation(cdr: float) -> str:
    if cdr > 0.6:
        return "CDR elevado; considerar evaluación de glaucoma."
    if cdr > 0.5:
        return "CDR en rango límite; seguimiento recomendado."
    return "CDR dentro de rango habitual."


def _build_full_result(
    results_by_model: dict,
    models_used: List[str],
    inference_times_ms: dict,
    include_heatmap: bool,
    img: np.ndarray,
) -> dict:
    """Construye respuesta completa: recomendación, explicación, postprocesamiento, gráficas."""
    model_a = results_by_model.get("A")
    model_b = results_by_model.get("B")
    model_c = results_by_model.get("C")

    # Recomendación y explicación (compatibles con 1, 2 o 3 modelos)
    cdr = model_a["cdr"] if model_a else 0.0
    prob = model_b if model_b is not None else 0.0
    lesions = model_c if model_c else []
    risk_level = "high" if (prob >= 0.6 or cdr > 0.6) else "medium" if (prob >= 0.4 or cdr > 0.5) else "low"
    recommendation_short = "Evaluación oftalmológica recomendada." if risk_level != "low" else "Seguimiento habitual."

    recommendation = f"CDR: {cdr:.2f}. {_cdr_interpretation(cdr)} Probabilidad glaucoma: {prob * 100:.1f}%."
    if lesions:
        recommendation += f" Lesiones detectadas: {len(lesions)}."
    elif "C" in models_used:
        recommendation += " Sin lesiones detectadas."

    explanation = {
        "cdr_interpretation": _cdr_interpretation(cdr),
        "glaucoma_risk_level": risk_level,
        "glaucoma_probability_percent": round(prob * 100, 1),
        "lesions_count": len(lesions),
        "recommendation_short": recommendation_short,
    }

    # Postprocesamiento: reporte con etiquetas y probabilidades
    report = build_report(
        model_a_result=model_a,
        model_b_result=model_b,
        model_c_result=model_c,
        models_used=models_used,
    )
    probabilities = report.get("probabilities", {})
    if "glaucoma" not in probabilities and "B" in models_used:
        probabilities["glaucoma"] = prob
    graph_data = graph_data_for_frontend(probabilities, inference_times_ms)

    heatmap_base64 = None
    if include_heatmap and (model_a or model_b is not None):
        try:
            heatmap_base64 = get_explanation_image_base64(
                img,
                prob,
                model_a.get("disc_mask") if model_a else None,
            )
        except Exception:
            pass

    lesions_found = []
    if model_c:
        for b in model_c:
            lesions_found.append({
                "x_min": b["x_min"], "y_min": b["y_min"],
                "x_max": b["x_max"], "y_max": b["y_max"],
                "label": b["label"], "confidence": b["confidence"],
            })

    return {
        "glaucoma_probability": round(prob, 4),
        "cup_to_disc_ratio": cdr,
        "disc_area": model_a.get("disc_area") if model_a else None,
        "cup_area": model_a.get("cup_area") if model_a else None,
        "lesions_found": lesions_found,
        "recommendation": recommendation,
        "explanation": explanation,
        "heatmap_image_base64": heatmap_base64,
        "postprocessing": {
            "report": report,
            "graph_data": graph_data,
        },
        "disclaimer": DISCLAIMER,
    }


@app.get("/")
async def root():
    return {"service": settings.app_name, "docs": "/docs", "disclaimer": DISCLAIMER}


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name, "version": "0.3.0"}


@app.get("/history")
async def history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Historial básico de inferencias (trazabilidad).
    Devuelve lista de análisis recientes con ID, timestamp, modelos usados y resumen.
    """
    return {"inferences": list_inferences(limit=limit, offset=offset)}


@app.get("/inferences/{inference_id}")
async def get_inference_by_id(inference_id: str):
    """Obtiene el registro completo de una inferencia por ID (trazabilidad)."""
    record = get_inference(inference_id)
    if not record:
        return JSONResponse(status_code=404, content={"detail": "Inference not found"})
    return record


@app.post("/analyze-retina/")
async def analyze_retina(
    file: UploadFile = File(...),
    models: str = Query(
        "A,B,C",
        description="Modelos a ejecutar: A (segmentación disco/copa), B (clasificación glaucoma), C (detección lesiones). Ej: A,B o B,C",
    ),
    include_heatmap: bool = True,
):
    """
    Analiza una retinografía con los modelos seleccionados.

    - **models**: lista separada por comas. A = segmentación + CDR, B = clasificador glaucoma, C = detector de lesiones.
    - Resultado incluye trazabilidad (inference_id), métricas de tiempo, postprocesamiento (etiquetas, gráficas) y disclaimer.
    """
    try:
        img = _read_image_from_upload(file)
    except Exception as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})

    models_used = [m.strip().upper() for m in models.split(",") if m.strip()]
    if not models_used:
        models_used = ["A", "B", "C"]
    for m in models_used:
        if m not in ("A", "B", "C"):
            return JSONResponse(
                status_code=400,
                content={"detail": f"Modelo inválido: {m}. Use A, B y/o C."},
            )

    image = preprocess_fundus(img)
    loop = asyncio.get_event_loop()
    results_by_model = {}
    inference_times_ms = {}

    # Ejecutar solo los modelos seleccionados y medir tiempo
    if "A" in models_used:
        t0 = time.perf_counter()
        seg = await loop.run_in_executor(None, lambda: segment_optic_disc(image))
        inference_times_ms["A"] = (time.perf_counter() - t0) * 1000
        results_by_model["A"] = seg

    if "B" in models_used:
        t0 = time.perf_counter()
        prob = await loop.run_in_executor(None, lambda: predict_glaucoma(image))
        inference_times_ms["B"] = (time.perf_counter() - t0) * 1000
        results_by_model["B"] = float(prob)

    if "C" in models_used:
        t0 = time.perf_counter()
        lesions = await loop.run_in_executor(None, lambda: detect_hemorrhages(image))
        inference_times_ms["C"] = (time.perf_counter() - t0) * 1000
        results_by_model["C"] = lesions

    # Valores por defecto para modelos no elegidos (para recomendación unificada)
    if "A" not in results_by_model:
        results_by_model["A"] = None
    if "B" not in results_by_model:
        results_by_model["B"] = None
    if "C" not in results_by_model:
        results_by_model["C"] = None

    result = _build_full_result(
        results_by_model,
        models_used,
        inference_times_ms,
        include_heatmap,
        img,
    )

    # Trazabilidad: guardar y devolver ID
    inference_id = save_inference(
        models_used=models_used,
        inference_times_ms=inference_times_ms,
        result=result,
        image_size=(img.shape[1], img.shape[0]),
    )

    result["inference_id"] = inference_id
    result["traceability"] = {
        "inference_id": inference_id,
        "models_used": models_used,
        "inference_times_ms": inference_times_ms,
    }

    return result
