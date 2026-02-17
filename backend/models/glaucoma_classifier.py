"""
Modelo B: Clasificación Glaucoma / Patologías.

Arquitectura objetivo: EfficientNet-B4 o Vision Transformer (ViT).
Salida: probabilidad (0–1) de glaucoma o retinopatía.

Stub: devuelve valor fijo hasta conectar el modelo real (ONNX/Triton).
"""

import numpy as np


def predict_glaucoma(image: np.ndarray) -> float:
    """
    Predice probabilidad de glaucoma (0.0 a 1.0).

    Args:
        image: imagen preprocesada o RGB.

    Returns:
        Probabilidad entre 0 y 1.
    """
    # Stub
    return 0.0
