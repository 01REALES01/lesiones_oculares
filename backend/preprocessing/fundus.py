"""
Preprocesamiento para fotografía de fondo de ojo (fundus).

Incluye:
- Recorte de bordes negros (Cropping).
- Normalización de Ben Graham (resta desenfoque local) en espacio RGB.
- Redimensionamiento estándar.
"""

import cv2
import numpy as np
from typing import Union

# Tipo: path o array
ImageInput = Union[str, np.ndarray]

def crop_img(img: np.ndarray) -> np.ndarray:
    """
    Recorte (CROPPING) de bordes negros innecesarios.
    Deja la imagen cuadrada y centrada en la zona de interés (retina).
    """
    # Convertir a escala de grises para detectar la máscara
    img_gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    
    # Aplicar threshold para obtener la máscara binaria de la retina
    (t, thres) = cv2.threshold(img_gray, 10, 255, cv2.THRESH_BINARY)
    mask = cv2.medianBlur(thres, 5)

    # Detectar el círculo principal usando Hough Circles
    # param1=50, param2=30 son valores estándar; minRadius y maxRadius ajustados para fundus
    circ = cv2.HoughCircles(mask, cv2.HOUGH_GRADIENT, 3, 40, param1=50, param2=30, minRadius=200, maxRadius=2000)
    
    if circ is not None:
        c = circ[0][0]  # El mejor círculo detectado
        rad = int(c[2])
        cx = int(c[0])
        cy = int(c[1])
        
        # Recortar la imagen usando el radio detectado
        y_min, y_max = max(0, cy - rad), min(img.shape[0], cy + rad)
        x_min, x_max = max(0, cx - rad), min(img.shape[1], cx + rad)
        img_crop = img[y_min:y_max, x_min:x_max]
        return img_crop
    
    # Si no detecta círculo, devolvemos la imagen original (o podrías intentar un recorte por contornos)
    return img

def apply_ben_graham_rgb(image: np.ndarray, sigmaX: float = 10.1) -> np.ndarray:
    """
    Aplica el preprocesado de Ben Graham sobre una imagen RGB.
    Fórmula: image * 4.12 + GaussianBlur(image) * -4 + 128
    """
    blurred = cv2.GaussianBlur(image, (0, 0), sigmaX)
    image_processed = cv2.addWeighted(image, 4.12, blurred, -4, 128)
    return image_processed

def preprocess_fundus_full(img: np.ndarray, target_size: tuple = (224, 224)) -> np.ndarray:
    """
    Pipeline completo solicitado por el usuario:
    1. Recorte de bordes.
    2. Redimensionamiento a target_size.
    3. Normalización de Ben Graham (RGB).
    
    Entrada: Imagen en formato BGR (OpenCV estándar).
    Salida: Imagen preprocesada en formato RGB.
    """
    # 1. Pasar de BGR a RGB
    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # 2. Cropping
    image_cropped = crop_img(image_rgb)
    
    # 3. Resize
    image_resized = cv2.resize(image_cropped, target_size, interpolation=cv2.INTER_CUBIC)
    
    # 4. Ben Graham
    image_final = apply_ben_graham_rgb(image_resized)
    
    return image_final

# Mantenemos la función anterior por compatibilidad si es necesario, 
# pero la marcamos como legado o la actualizamos para usar la nueva lógica.
def preprocess_fundus(image_input: ImageInput) -> np.ndarray:
    """
    Función de compatibilidad que envuelve el nuevo pipeline.
    """
    if isinstance(image_input, str):
        img = cv2.imread(image_input)
        if img is None:
            raise FileNotFoundError(f"No se pudo cargar la imagen: {image_input}")
    else:
        img = np.asarray(image_input)

    # Aplicamos el nuevo pipeline completo
    return preprocess_fundus_full(img)
