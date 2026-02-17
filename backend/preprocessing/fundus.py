"""
Preprocesamiento para fotografía de fondo de ojo (fundus).

Incluye:
- Extracción del canal verde (mejor contraste para vasos y nervio óptico).
- CLAHE (Contrast Limited Adaptive Histogram Equalization).
- Normalización de Ben Graham (resta desenfoque local).
"""

import cv2
import numpy as np
from typing import Union

# Tipo: path o array
ImageInput = Union[str, np.ndarray]


def _ensure_grayscale(img: np.ndarray) -> np.ndarray:
    """Convierte a escala de grises si es color (BGR/RGB)."""
    if img.ndim == 3:
        return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return img


def extract_green_channel(img: np.ndarray) -> np.ndarray:
    """
    Extrae el canal verde. En fundus es el de mejor contraste
    para vasos, disco óptico y lesiones.
    """
    if img.ndim == 2:
        return img.copy()
    # Asumir BGR (OpenCV)
    return img[:, :, 1].astype(np.uint8)


def apply_clahe(
    img: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: tuple[int, int] = (8, 8),
) -> np.ndarray:
    """
    CLAHE: realza bordes del disco y excavación sin amplificar ruido.
    Estándar en análisis de retina.
    """
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(img)


def ben_graham_normalize(img: np.ndarray, sigma: int = 30) -> np.ndarray:
    """
    Normalización de Ben Graham: resta el desenfoque local (fondo)
    para resaltar estructuras (vasos, lesiones). Muy usada en Kaggle/medicina.
    """
    blurred = cv2.GaussianBlur(img.astype(np.float32), (0, 0), sigma)
    normalized = img.astype(np.float32) - blurred
    normalized = np.clip(normalized, 0, 255).astype(np.uint8)
    return normalized


def preprocess_fundus(
    image_input: ImageInput,
    *,
    use_green: bool = True,
    use_clahe: bool = True,
    use_ben_graham: bool = True,
    clahe_clip: float = 2.0,
    ben_graham_sigma: int = 30,
) -> np.ndarray:
    """
    Pipeline de preprocesamiento para fondo de ojo.

    Args:
        image_input: ruta a imagen o array numpy (BGR o escala de grises).
        use_green: extraer canal verde si la imagen es color.
        use_clahe: aplicar CLAHE.
        use_ben_graham: aplicar normalización Ben Graham.
        clahe_clip: clip limit para CLAHE.
        ben_graham_sigma: sigma del blur para Ben Graham.

    Returns:
        Imagen preprocesada (uint8, un canal).
    """
    if isinstance(image_input, str):
        img = cv2.imread(image_input)
        if img is None:
            raise FileNotFoundError(f"No se pudo cargar la imagen: {image_input}")
    else:
        img = np.asarray(image_input)
        if img.ndim == 3 and img.shape[2] == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR) if img.dtype == np.uint8 else img

    out = _ensure_grayscale(img)
    if use_green and img.ndim == 3:
        out = extract_green_channel(img)

    if use_clahe:
        out = apply_clahe(out, clip_limit=clahe_clip)

    if use_ben_graham:
        out = ben_graham_normalize(out, sigma=ben_graham_sigma)

    return out
