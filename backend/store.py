"""
Almacenamiento de inferencias para trazabilidad e historial básico.

Cada análisis queda registrado con: id, timestamp, modelos usados,
tiempos de inferencia y resultados. Persistencia opcional en JSON
para no perder historial al reiniciar (prototipo).
"""

import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import shutil

# En memoria; clave = inference_id, valor = registro completo
_inference_store: Dict[str, Dict[str, Any]] = {}
# Orden cronológico de IDs (para listar "últimos N")
_inference_ids_order: List[str] = []
_MAX_IN_MEMORY = 500  # límite de registros en memoria
_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "inferences.json"
_IMAGES_DIR = Path(__file__).resolve().parent.parent / "data" / "images_braham"
# Misma ruta que usa save_image_to_disk; expuesta para StaticFiles en main
IMAGES_DIR = _IMAGES_DIR


def _ensure_data_dir() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    _IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
def save_image_to_disk(img_bytes: bytes, filename: str) -> str:
    _ensure_data_dir()
    safe_name = Path(filename).name
    file_id = f"{uuid.uuid4().hex}_original_{safe_name}"
    file_path = _IMAGES_DIR / file_id
    file_path.write_bytes(img_bytes)
    return file_id

def save_image_to_disk2(img_bytes: bytes, filename: str) -> str:
    _ensure_data_dir()
    safe_name = Path(filename).name
    file_id = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = _IMAGES_DIR / file_id
    file_path.write_bytes(img_bytes)
    return file_id


def clear_images_dir() -> None:
    _ensure_data_dir()
    for item in _IMAGES_DIR.iterdir():
        if item.is_file():
            item.unlink()
        elif item.is_dir():
            shutil.rmtree(item)


def _load_from_file() -> None:
    """Carga historial desde JSON si existe (al arrancar)."""
    global _inference_store, _inference_ids_order
    if not _DATA_FILE.exists():
        return
    try:
        with open(_DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        _inference_store = data.get("store", {})
        _inference_ids_order = data.get("order", [])
    except Exception:
        _inference_store = {}
        _inference_ids_order = []


def _save_to_file() -> None:
    """Persiste store y orden a JSON (prototipo; opcional)."""
    _ensure_data_dir()
    try:
        with open(_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(
                {"store": _inference_store, "order": _inference_ids_order},
                f,
                ensure_ascii=False,
                indent=0,
            )
    except Exception:
        pass

def save_inferences_batch(records: List[Dict[str, Any]]) -> List[str]:
    """Guarda múltiples registros de una vez para optimizar rendimiento."""
    _ensure_data_dir()
    ids = []
    for r in records:
        iid = r.get("inference_id") or str(uuid.uuid4())
        r["inference_id"] = iid
        if "timestamp" not in r:
            r["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        _inference_store[iid] = r
        if iid not in _inference_ids_order:
            _inference_ids_order.append(iid)
        ids.append(iid)
        
    # Mantener límite
    while len(_inference_ids_order) > _MAX_IN_MEMORY:
        old_id = _inference_ids_order.pop(0)
        _inference_store.pop(old_id, None)
        
    _save_to_file()
    return ids


def save_inference(
    models_used: List[str],
    inference_times_ms: Dict[str, float],
    result: Dict[str, Any],
    image_size: Optional[tuple] = None,
    batch_id: Optional[str] = None,
    user_email: Optional[str] = None,
    roble_user_id: Optional[str] = None,
) -> str:
    """
    Guarda un registro de inferencia y devuelve su ID.
    """
    inference_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "inference_id": inference_id,
        "timestamp": now,
        "models_used": models_used,
        "inference_times_ms": inference_times_ms,
        "result": result,
        "image_size": list(image_size) if image_size else None,
        "batch_id": batch_id,
        "user_email": user_email,
        "roble_user_id": roble_user_id,
    }
    _inference_store[inference_id] = record
    _inference_ids_order.append(inference_id)
    # Mantener límite
    while len(_inference_ids_order) > _MAX_IN_MEMORY:
        old_id = _inference_ids_order.pop(0)
        _inference_store.pop(old_id, None)
    _save_to_file()
    return inference_id


def get_inference(inference_id: str) -> Optional[Dict[str, Any]]:
    """Devuelve el registro de una inferencia por ID."""
    return _inference_store.get(inference_id)


def list_inferences(limit: int = 50,offset: int = 0,user_email: Optional[str] = None,) -> List[Dict[str, Any]]:
    """
    Lista las últimas inferencias agrupadas por lote.
    """
    groups = []
    seen_batches = set()
    
    for iid in reversed(_inference_ids_order):
        r = _inference_store.get(iid)
        if not r:
            continue
        
        if user_email and r.get("user_email") != user_email:
            continue
        
        batch_id = r.get("batch_id")
        if batch_id:
            if batch_id not in seen_batches:
                seen_batches.add(batch_id)
                groups.append({"batch_id": batch_id, "items": [r]})
            else:
                for g in groups:
                    if g["batch_id"] == batch_id:
                        g["items"].append(r)
                        break
        else:
            groups.append({"batch_id": None, "items": [r]})
            
    selected_groups = groups[offset : offset + limit]
    
    out = []
    for g in selected_groups:
        items = g["items"]
        rep = items[0]
        res = rep.get("result", {})

        risk_rank = {"low": 0, "medium": 1, "high": 2}

        def _safe_int(value: Any, default: int = 0) -> int:
            try:
                return int(value)
            except Exception:
                return default

        def _risk_label_es(risk_value: str) -> str:
            if risk_value == "high":
                return "prioridad alta"
            if risk_value == "medium":
                return "monitoreo"
            return "estable"

        # Build aggregate risk stats for the whole group (single or batch)
        group_risk_counts = {"high": 0, "medium": 0, "low": 0}
        group_grades: List[int] = []
        for item in items:
            item_res = item.get("result", {})
            item_primary = item_res.get("primary_result") or {}
            item_summary = item_res.get("comparison_summary") or {}

            item_risk = item_summary.get("risk_level") or item_res.get("risk_level") or "low"
            if item_risk not in group_risk_counts:
                item_risk = "low"
            group_risk_counts[item_risk] += 1

            grade_value = item_primary.get("predicted_class", item_res.get("predicted_class", 0))
            group_grades.append(_safe_int(grade_value, 0))

        present_risks = [k for k, count in group_risk_counts.items() if count > 0]
        highest_risk = "low"
        if present_risks:
            highest_risk = max(present_risks, key=lambda risk: risk_rank[risk])

        is_mixed_risk = len(present_risks) > 1
        
        primary_result = res.get("primary_result") or {}
        comparison_summary = res.get("comparison_summary") or {}

        summary_risk_level = "mixed" if is_mixed_risk else highest_risk

        if len(items) > 1:
            summary_headline = (
                f"Lote mixto: {group_risk_counts['high']} altos, "
                f"{group_risk_counts['medium']} medios, {group_risk_counts['low']} bajos"
                if is_mixed_risk
                else f"Lote homogéneo: {_risk_label_es(highest_risk)}"
            )
        else:
            summary_headline = comparison_summary.get("headline") or res.get("diagnosis")
        
        out.append({
            "inference_id": rep["inference_id"],
            "batch_id": g["batch_id"],
            "is_batch": len(items) > 1,
            "batch_size": len(items),
            "timestamp": rep["timestamp"],
            "models_used": rep["models_used"],
            "inference_times_ms": rep["inference_times_ms"],
            "summary": {
                "headline": summary_headline,
                "risk_level": summary_risk_level,
                "risk_max_level": highest_risk,
                "is_mixed_risk": is_mixed_risk,
                "risk_counts": group_risk_counts,
                "positive_models": comparison_summary.get("positive_models"),
                "total_models": comparison_summary.get("total_models") or len(rep.get("models_used", [])),
                "primary_grade": max(group_grades) if group_grades else primary_result.get("predicted_class", res.get("predicted_class")),
                "primary_confidence": primary_result.get("confidence_percent", res.get("confidence_percent")),
                "primary_diagnosis": primary_result.get("diagnosis", res.get("diagnosis")),
                "recommendation_short": comparison_summary.get("recommendation_short") or res.get("recommendation_short") or res.get("explanation", {}).get("recommendation_short"),
                "filename": res.get("filename") if len(items) == 1 else f"Lote de {len(items)} imágenes",
                "batch_filenames": [item.get("result", {}).get("filename") for item in items if item.get("result", {}).get("filename")],
            },
        })
    return out


def get_batch(batch_id: str) -> List[Dict[str, Any]]:
    """Obtiene todos los registros pertenecientes a un mismo batch."""
    return [
        _inference_store[iid]
        for iid in _inference_ids_order
        if _inference_store.get(iid) and _inference_store[iid].get("batch_id") == batch_id
    ]


def clear_history(delete_images: bool = False) -> Dict[str, Any]:
    """Limpia historial completo y opcionalmente borra imágenes guardadas."""
    global _inference_store, _inference_ids_order

    deleted_records = len(_inference_ids_order)
    _inference_store = {}
    _inference_ids_order = []

    deleted_images = 0
    if delete_images:
        _ensure_data_dir()
        for image_path in _IMAGES_DIR.glob("*"):
            if image_path.is_file():
                try:
                    image_path.unlink()
                    deleted_images += 1
                except Exception:
                    pass

    _save_to_file()
    return {
        "deleted_records": deleted_records,
        "deleted_images": deleted_images,
    }


def delete_inference(inference_id: str) -> bool:
    """Elimina un análisis específico."""
    global _inference_store, _inference_ids_order
    
    if inference_id not in _inference_store:
        return False
        
    # Eliminar imagen si existe
    record = _inference_store.get(inference_id)
    img_preview = record.get("result", {}).get("uploaded_image_preview")
    if img_preview and img_preview.startswith("/images/"):
        filename = img_preview.replace("/images/", "")
        img_path = _IMAGES_DIR / filename
        if img_path.exists():
            try: img_path.unlink()
            except: pass

    # Quitar del store y orden
    _inference_store.pop(inference_id, None)
    if inference_id in _inference_ids_order:
        _inference_ids_order.remove(inference_id)
        
    _save_to_file()
    return True


def delete_batch(batch_id: str) -> int:
    """Elimina todas las inferencias que pertenecen a un mismo lote."""
    global _inference_store, _inference_ids_order
    
    ids_to_delete = [
        iid for iid, record in _inference_store.items()
        if record.get("batch_id") == batch_id
    ]
    
    count = 0
    for iid in ids_to_delete:
        if delete_inference(iid):
            count += 1
            
    return count


def get_global_stats() -> Dict[str, Any]:
    """
    Calcula métricas globales para el Dashboard:
    - total_analyses: total de inferencias en la historia.
    - rd_detected_rate: porcentaje de análisis con alguna detección de Retinopatía (riesgo medio o alto) / grados > 0.
    - avg_confidence: confianza/probabilidad promedio entre todas las inferencias.
    - avg_latency_ms: latencia promedio total reportada en inferencias.
    """
    total = len(_inference_ids_order)
    if total == 0:
        return {
            "total_analyses": 0,
            "rd_detected_rate": 0.0,
            "avg_confidence": 0.0,
            "avg_latency_ms": 0.0
        }

    detected_count = 0
    sum_confidence = 0.0
    sum_latency = 0.0
    valid_latency_count = 0

    for iid in _inference_ids_order:
        r = _inference_store.get(iid)
        if not r:
            continue
        
        res = r.get("result", {})
        primary_result = res.get("primary_result") or {}
        # Determining if it was detected (grade > 0 or risk non-low)
        grade = primary_result.get("predicted_class", res.get("predicted_class"))
        risk = res.get("comparison_summary", {}).get("risk_level") or res.get("risk_level")

        if grade and int(grade) > 0:
            detected_count += 1
        elif risk in ["medium", "high"]:
            detected_count += 1

        confidence = primary_result.get("confidence_percent", res.get("confidence_percent", 0.0))
        sum_confidence += float(confidence)

        times = r.get("inference_times_ms", {})
        if times:
            avg_time_for_infer = sum(times.values()) / len(times)
            sum_latency += float(avg_time_for_infer)
            valid_latency_count += 1

    return {
        "total_analyses": total,
        "rd_detected_rate": round(detected_count / total * 100, 1),
        "avg_confidence": round(sum_confidence / total, 1),
        "avg_latency_ms": round(sum_latency / valid_latency_count, 1) if valid_latency_count > 0 else 0.0
    }

# Cargar al importar (si hay archivo previo)
_load_from_file()
