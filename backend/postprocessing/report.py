"""
Módulo de postprocesamiento: etiquetas, probabilidades y datos para gráficas.

Consolida las salidas de los modelos (A: segmentación, B: clasificación, C: detección)
en un reporte estructurado para la interfaz: etiquetas legibles, probabilidades
y estructuras para que el frontend dibuje gráficas (barras de probabilidad, tiempos de inferencia).
"""

from typing import Any, Dict, List, Optional


def build_report(
    model_a_result: Optional[Dict[str, Any]],
    model_b_result: Optional[Any],
    model_c_result: Optional[List[Dict[str, Any]]],
    models_used: List[str],
) -> Dict[str, Any]:
    """
    Construye el reporte de postprocesamiento: etiquetas, probabilidades y resumen.
    Los resultados de modelos no usados pueden ser None.
    """
    labels: List[str] = []
    probabilities: Dict[str, float] = {}
    segmentation_summary: Dict[str, Any] = {}
    detection_summary: List[Dict[str, Any]] = []

    if "A" in models_used and model_a_result:
        cdr = model_a_result.get("cdr", 0)
        labels.append(f"CDR (Cup-to-Disc Ratio): {cdr:.2f}")
        segmentation_summary = {
            "cdr": cdr,
            "disc_area": model_a_result.get("disc_area"),
            "cup_area": model_a_result.get("cup_area"),
        }

    if "B" in models_used and model_b_result is not None:
        prob = float(model_b_result)
        probabilities["glaucoma"] = prob
        labels.append(f"Probabilidad glaucoma: {prob * 100:.1f}%")

    if "C" in models_used and model_c_result:
        if isinstance(model_c_result, dict):
            # Formato de ML Manager de clasificación (ResNet, DenseNet, etc)
            label = f"Grado {model_c_result.get('predicted_class', 0)}: {model_c_result.get('diagnosis', 'Normal')}"
            conf = model_c_result.get('confidence_percent', 0.0) / 100.0
            detection_summary = [{"label": label, "confidence": conf}]
            if model_c_result.get('predicted_class', 0) > 0:
                labels.append(f"Retinopatía: {label}")
        elif isinstance(model_c_result, list):
            # Formato antiguo (Lista de bounding boxes)
            detection_summary = [
                {"label": b.get("label", "lesion"), "confidence": b.get("confidence", 0)}
                for b in model_c_result if isinstance(b, dict)
            ]
            if detection_summary:
                labels.append(f"Lesiones detectadas: {len(detection_summary)}")

    return {
        "labels": labels,
        "probabilities": probabilities,
        "segmentation": segmentation_summary,
        "detection": detection_summary,
        "models_used": models_used,
    }


def graph_data_for_frontend(
    probabilities: Dict[str, float],
    inference_times_ms: Dict[str, float],
) -> Dict[str, Any]:
    """
    Devuelve datos listos para que el frontend dibuje gráficas:
    - probability_bars: [{ "name": "glaucoma", "value": 0.35 }] para barras.
    - inference_time_bars: [{ "model": "A", "ms": 120 }] para comparar tiempos.
    """
    probability_bars = [
        {"name": k, "value": round(v, 4), "percent": round(v * 100, 1)}
        for k, v in probabilities.items()
    ]
    inference_time_bars = [
        {"model": m, "ms": round(t, 0)}
        for m, t in inference_times_ms.items()
    ]
    return {
        "probability_bars": probability_bars,
        "inference_time_bars": inference_time_bars,
    }
