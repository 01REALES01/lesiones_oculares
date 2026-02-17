"""
Explicabilidad (XAI) para el clasificador de glaucoma.

Por ahora: heatmap de atención sintético (centrado en la imagen / disco óptico)
para fijar el contrato de la API. Cuando tengas un modelo PyTorch, puedes
sustituir por Grad-CAM real en este mismo módulo o en gradcam_pytorch.py.

El médico puede ver "dónde miró el modelo" para dar el diagnóstico.
"""

import base64
import io
from typing import Optional

import cv2
import numpy as np


def _overlay_heatmap_on_image(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    """Superpone heatmap (0-255) sobre la imagen. Todo en BGR para OpenCV."""
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    heatmap_uint8 = np.clip(heatmap, 0, 255).astype(np.uint8)
    heatmap_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(image, 1 - alpha, heatmap_bgr, alpha, 0)
    return overlay


def generate_attention_heatmap(
    image: np.ndarray,
    glaucoma_probability: float = 0.0,
    disc_center_xy: Optional[tuple[float, float]] = None,
) -> np.ndarray:
    """
    Genera un heatmap de "atención" para explicar la decisión del modelo.

    Stub: simula atención en la zona del disco óptico (centro o disc_center_xy).
    Con un modelo real, sustituir por Grad-CAM usando la última capa conv.

    Args:
        image: imagen en escala de grises o BGR.
        glaucoma_probability: probabilidad predicha (para intensidad del heatmap).
        disc_center_xy: (x, y) del centro del disco; si None, se usa el centro de la imagen.

    Returns:
        Imagen BGR con el heatmap superpuesto (para guardar o codificar en base64).
    """
    h, w = image.shape[:2]
    if disc_center_xy is not None:
        cx, cy = int(disc_center_xy[0]), int(disc_center_xy[1])
    else:
        cx, cy = w // 2, h // 2

    # Radio de "atención" proporcional a probabilidad (más riesgo = zona más concentrada)
    radius = max(20, int(min(h, w) * (0.4 - 0.15 * glaucoma_probability)))

    y, x = np.ogrid[:h, :w]
    dist_sq = (x - cx) ** 2 + (y - cy) ** 2
    # Gaussiana: máxima en el centro, decae con la distancia
    sigma = radius / 1.5
    heatmap = 255 * np.exp(-dist_sq / (2 * sigma ** 2))
    heatmap = np.clip(heatmap, 0, 255).astype(np.uint8)

    # Intensidad global según probabilidad (más probabilidad = más visible)
    strength = 0.3 + 0.7 * glaucoma_probability
    heatmap = (heatmap * strength).astype(np.uint8)

    if image.ndim == 2:
        img_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    else:
        img_bgr = image.copy() if image.shape[2] == 3 else image

    overlay = _overlay_heatmap_on_image(img_bgr, heatmap, alpha=0.45)
    return overlay


def heatmap_to_base64_png(image_bgr: np.ndarray) -> str:
    """Codifica la imagen BGR como PNG en base64."""
    success, buf = cv2.imencode(".png", image_bgr)
    if not success:
        raise ValueError("No se pudo codificar la imagen como PNG")
    return base64.b64encode(buf.tobytes()).decode("ascii")


def get_explanation_image_base64(
    image: np.ndarray,
    glaucoma_probability: float,
    disc_mask: Optional[np.ndarray] = None,
) -> str:
    """
    Obtiene la imagen de explicación (heatmap sobre la imagen) en base64.

    Si se pasa disc_mask, el centro del disco se calcula como centroide
    para centrar el heatmap en la zona relevante.
    """
    center = None
    if disc_mask is not None and np.any(disc_mask > 0):
        ys, xs = np.where(disc_mask > 0)
        center = (float(np.mean(xs)), float(np.mean(ys)))

    overlay = generate_attention_heatmap(
        image,
        glaucoma_probability=glaucoma_probability,
        disc_center_xy=center,
    )
    return heatmap_to_base64_png(overlay)
