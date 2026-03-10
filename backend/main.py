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
from datetime import timedelta

import numpy as np
from fastapi import FastAPI, File, Query, UploadFile, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from backend.config import settings
from backend.preprocessing.fundus import preprocess_fundus
from backend.models.segmentation_vnet import segment_optic_disc
from backend.models.glaucoma_classifier import predict_glaucoma
from backend.models.lesion_detector import detect_hemorrhages
from backend.models.explainability import get_explanation_image_base64
from backend.postprocessing.report import build_report, graph_data_for_frontend
from backend.store import save_inference, get_inference, list_inferences
from backend.ml_manager import ml_manager
from contextlib import asynccontextmanager
# Auth imports
from backend.auth import (
    Token, User, get_current_user, create_access_token, 
    get_user, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Disclaimer fijo (apoyo/tamizaje, no diagnóstico)
DISCLAIMER = (
    "Este sistema es de apoyo clínico y educativo. No constituye diagnóstico médico. "
    "Los resultados deben ser interpretados por un profesional de la salud. "
    "No usar como único criterio para decisiones clínicas."
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the real trained models for lesions (DR classification)
    try:
        ml_manager.load_model("lesiones_resnet", "resnet50_model_fine.h5")
        print("Model 'lesiones_resnet' loaded successfully on startup.")
    except Exception as e:
        print(f"Warning: Could not load model 'lesiones_resnet' on startup: {e}")

    try:
        ml_manager.load_model("lesiones_mobilenet", "mobilenetv3_model_fine.h5")
        print("Model 'lesiones_mobilenet' loaded successfully on startup.")
    except Exception as e:
        print(f"Warning: Could not load model 'lesiones_mobilenet' on startup: {e}")
    yield

app = FastAPI(title=settings.app_name, version="0.3.0", lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = get_user(form_data.username)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = user_dict
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


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
    
    # model_c is now a classification dict from ml_manager (or None)
    dr_class = model_c["predicted_class"] if model_c else 0
    dr_conf = model_c["confidence_percent"] if model_c else 0.0
    dr_diag = model_c["diagnosis"] if model_c else "Normal"
    
    risk_level = "high" if (prob >= 0.6 or cdr > 0.6 or dr_class >= 3) else "medium" if (prob >= 0.4 or cdr > 0.5 or dr_class > 0) else "low"
    recommendation_short = "Evaluación oftalmológica urgente." if risk_level == "high" else "Evaluación recomendada." if risk_level != "low" else "Seguimiento habitual."

    recommendation = f"CDR: {cdr:.2f}. {_cdr_interpretation(cdr)} Probabilidad glaucoma: {prob * 100:.1f}%."
    if model_c and dr_class > 0:
        recommendation += f" Retinopatía Diabética (Grado {dr_class} - {dr_conf:.1f}%)."
    elif "C" in models_used:
        recommendation += " Sin signos de retinopatía detectados."

    explanation = {
        "cdr_interpretation": _cdr_interpretation(cdr),
        "glaucoma_risk_level": risk_level,
        "glaucoma_probability_percent": round(prob * 100, 1),
        "dr_grade": dr_class,
        "dr_diagnosis": dr_diag,
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
    # If using the ML manager classification, we won't have bounding boxes, 
    # but we can return the overall classification result for the UI table
    if model_c:
        lesions_found.append({
            "x_min": 0, "y_min": 0, "x_max": 0, "y_max": 0,
            "label": f"Grado {model_c['predicted_class']}: {model_c['diagnosis']}", 
            "confidence": model_c['confidence_percent']/100.0,
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
    files: List[UploadFile] = File(...),
    models: str = Query(
        "A,B,C",
        description="Modelos a ejecutar: A (segmentación disco/copa), B (clasificación glaucoma), C (detección lesiones). Ej: A,B o B,C",
    ),
    model_c_type: str = Query(
        "resnet50v2",
        description="Tipo de modelo de IA a correr para las lesiones: 'resnet50v2' o 'mobilenetv3'"
    ),
    include_heatmap: bool = True,
    current_user: User = Depends(get_current_user),
):
    """
    Analiza una o más retinografías con los modelos seleccionados.

    - **files**: lista de archivos de imagen.
    - **models**: lista separada por comas. A = segmentación + CDR, B = clasificador glaucoma, C = detector de lesiones.
    - Devuelve una LISTA de resultados (uno por imagen).
    """
    models_used = [m.strip().upper() for m in models.split(",") if m.strip()]
    if not models_used:
        models_used = ["A", "B", "C"]
    
    # Validar modelos una sola vez
    for m in models_used:
        if m not in ("A", "B", "C"):
            return JSONResponse(
                status_code=400,
                content={"detail": f"Modelo inválido: {m}. Use A, B y/o C."},
            )

    loop = asyncio.get_event_loop()
    final_results = []
    
    # 1. Pre-process and Batch Infer for Model C (Lesions/DR) if selected
    dr_batch_results = []
    c_inference_time_total = 0
    t0_batch = time.perf_counter()
    
    c_model_key = "lesiones_mobilenet" if model_c_type == "mobilenetv3" else "lesiones_resnet"
    
    if "C" in models_used and c_model_key in ml_manager.models:
        valid_bytes_list = []
        for file in files:
            file.file.seek(0)
            valid_bytes_list.append(file.file.read())
            file.file.seek(0) # reset for cv2 read later
        
        # Run real model batch inference
        dr_batch_results = await loop.run_in_executor(
            None, 
            lambda: ml_manager.predict_batch(
                model_key=c_model_key, 
                images_bytes_list=valid_bytes_list, 
                model_type=model_c_type
            )
        )
        c_inference_time_total = (time.perf_counter() - t0_batch) * 1000

    for idx, file in enumerate(files):
        # Procesar cada imagen de forma independiente
        try:
            # 1. Leer imagen
            try:
                img = _read_image_from_upload(file)
            except Exception as e:
                final_results.append({
                    "filename": file.filename,
                    "error": str(e),
                    "success": False
                })
                continue

            # 2. Preprocesar
            image = preprocess_fundus(img)

            # 3. Ejecutar modelos
            results_by_model = {}
            inference_times_ms = {}

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
                if dr_batch_results and len(dr_batch_results) > idx:
                    results_by_model["C"] = dr_batch_results[idx]
                    # distribute time evenly
                    inference_times_ms["C"] = c_inference_time_total / len(files)
                else:
                    # Fallback to dummy if real model was not loaded
                    t0 = time.perf_counter()
                    lesions = await loop.run_in_executor(None, lambda: detect_hemorrhages(image))
                    inference_times_ms["C"] = (time.perf_counter() - t0) * 1000
                    # format dummy detector output to match ml manager dict roughly
                    dummy_label = lesions[0]['label'] if lesions else 'Normal'
                    results_by_model["C"] = {
                        "predicted_class": 1 if lesions else 0,
                        "confidence_percent": lesions[0]['confidence']*100 if lesions else 100.0,
                        "diagnosis": dummy_label,
                        "clinical_description": "Mocked detector",
                        "raw_probabilities": [10.0]*5
                    }

            # Defaults
            if "A" not in results_by_model: results_by_model["A"] = None
            if "B" not in results_by_model: results_by_model["B"] = None
            if "C" not in results_by_model: results_by_model["C"] = None

            # 4. Construir resultado
            result = _build_full_result(
                results_by_model,
                models_used,
                inference_times_ms,
                include_heatmap,
                img,
            )

            # 5. Guardar trazabilidad
            inference_id = save_inference(
                models_used=models_used,
                inference_times_ms=inference_times_ms,
                result=result,
                image_size=(img.shape[1], img.shape[0]),
            )

            result["inference_id"] = inference_id
            result["filename"] = file.filename
            result["success"] = True
            result["traceability"] = {
                "inference_id": inference_id,
                "models_used": models_used,
                "inference_times_ms": inference_times_ms,
            }
            
            final_results.append(result)

        except Exception as e:
            final_results.append({
                "filename": file.filename,
                "error": f"Error interno procesando archivo: {str(e)}",
                "success": False
            })

    return final_results

