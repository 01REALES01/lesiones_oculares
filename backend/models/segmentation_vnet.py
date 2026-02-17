"""
Modelo A: Segmentación de Disco Óptico y Copa Óptica.

Arquitectura objetivo: U-Net++ o DeepLabV3+.
Salida: máscaras de disco y copa para calcular CDR.

Por ahora es un stub que devuelve máscaras dummy (círculos) para integrar
el flujo. Sustituir por inferencia real (ONNX/Triton) cuando el modelo exista.
"""

import numpy as np
from typing import TypedDict

# Cuando tengas el modelo real:
# import onnxruntime as ort
# session = ort.InferenceSession("path/to/segment.onnx")


class SegmentationResult(TypedDict):
    disc_mask: np.ndarray
    cup_mask: np.ndarray
    cdr: float
    disc_area: float
    cup_area: float


def _dummy_masks(h: int, w: int) -> tuple[np.ndarray, np.ndarray]:
    """Genera máscaras dummy: disco = círculo grande, copa = círculo interior."""
    y, x = np.ogrid[:h, :w]
    cy, cx = h // 2, w // 2
    r_disc = min(h, w) // 3
    r_cup = int(r_disc * 0.55)  # CDR ~0.3 en área (radio 0.55 -> área ratio ~0.3)
    disc = ((y - cy) ** 2 + (x - cx) ** 2) <= r_disc**2
    cup = ((y - cy) ** 2 + (x - cx) ** 2) <= r_cup**2
    return disc.astype(np.uint8), cup.astype(np.uint8)


def segment_optic_disc(image: np.ndarray) -> SegmentationResult:
    """
    Segmenta disco óptico y copa óptica.

    Args:
        image: imagen preprocesada (un canal) o RGB del mismo tamaño esperado por el modelo.

    Returns:
        disc_mask, cup_mask y CDR calculado.
    """
    if image.ndim == 3:
        h, w = image.shape[:2]
    else:
        h, w = image.shape[:2]

    # Stub: máscaras dummy
    disc_mask, cup_mask = _dummy_masks(h, w)

    from .cdr import compute_cdr_from_masks

    cdr_result = compute_cdr_from_masks(disc_mask, cup_mask)

    return SegmentationResult(
        disc_mask=disc_mask,
        cup_mask=cup_mask,
        cdr=cdr_result["cdr"],
        disc_area=cdr_result["disc_area"],
        cup_area=cdr_result["cup_area"],
    )
