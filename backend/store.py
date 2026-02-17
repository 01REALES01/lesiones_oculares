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

# En memoria; clave = inference_id, valor = registro completo
_inference_store: Dict[str, Dict[str, Any]] = {}
# Orden cronológico de IDs (para listar "últimos N")
_inference_ids_order: List[str] = []
_MAX_IN_MEMORY = 500  # límite de registros en memoria
_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "inferences.json"


def _ensure_data_dir() -> None:
    _DATA_FILE.parent.mkdir(parents=True, exist_ok=True)


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


def save_inference(
    models_used: List[str],
    inference_times_ms: Dict[str, float],
    result: Dict[str, Any],
    image_size: Optional[tuple] = None,
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


def list_inferences(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """
    Lista las últimas inferencias (más recientes primero).
    Cada elemento incluye: inference_id, timestamp, models_used, inference_times_ms,
    y un resumen del result (sin imágenes base64 para no pesar).
    """
    ids = list(reversed(_inference_ids_order))[offset : offset + limit]
    out = []
    for iid in ids:
        r = _inference_store.get(iid)
        if not r:
            continue
        # Resumen sin heatmap/base64
        res = r.get("result", {})
        summary = {
            "glaucoma_probability": res.get("glaucoma_probability"),
            "cup_to_disc_ratio": res.get("cup_to_disc_ratio"),
            "lesions_count": len(res.get("lesions_found", [])),
            "recommendation_short": res.get("explanation", {}).get("recommendation_short"),
        }
        out.append({
            "inference_id": r["inference_id"],
            "timestamp": r["timestamp"],
            "models_used": r["models_used"],
            "inference_times_ms": r["inference_times_ms"],
            "summary": summary,
        })
    return out


# Cargar al importar (si hay archivo previo)
_load_from_file()
