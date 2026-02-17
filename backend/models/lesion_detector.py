"""
Modelo C: Detección de lesiones (microaneurismas, hemorragias, exudados).

Arquitectura objetivo: YOLOv10 o Faster R-CNN.
Salida: lista de bounding boxes + etiquetas.

Stub: devuelve lista vacía hasta conectar el modelo real.
"""

import numpy as np
from typing import TypedDict


class BoundingBox(TypedDict):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    label: str  # "microaneurysm", "hemorrhage", "exudate", etc.
    confidence: float


def detect_hemorrhages(image: np.ndarray) -> list[BoundingBox]:
    """
    Detecta lesiones y devuelve bounding boxes.

    Args:
        image: imagen preprocesada o RGB.

    Returns:
        Lista de detecciones con bbox y confianza.
    """
    # Stub
    return []
