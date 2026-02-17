# Preprocesamiento de Imágenes de Retina

## Explicación del tema

Las imágenes de fondo de ojo suelen presentar **iluminación desigual**, **reflejos** y **bajo contraste** en algunas zonas. Un preprocesamiento adecuado mejora el rendimiento de los modelos de segmentación y clasificación. En este proyecto se utilizan tres técnicas estándar:

1. **Extracción del canal verde**  
   En imágenes RGB de retina, el canal verde ofrece mejor contraste para vasos sanguíneos, disco óptico y lesiones.

2. **CLAHE (Contrast Limited Adaptive Histogram Equalization)**  
   Ecualización adaptativa que realza bordes (disco, copa, vasos) sin amplificar tanto el ruido. Muy usada en análisis de retina.

3. **Normalización de Ben Graham**  
   Se resta un desenfoque local (Gaussian blur) a la imagen para eliminar variaciones de iluminación de fondo y resaltar estructuras. Muy utilizada en competencias de Kaggle y en pipelines médicos.

## Enlaces relevantes

- [CLAHE - OpenCV documentation](https://docs.opencv.org/4.x/d5/daf/tutorial_py_histogram_equalization.html)
- [Ben Graham's preprocessing for diabetic retinopathy (Kaggle)](https://www.kaggle.com/c/diabetic-retinopathy-detection/discussion/15801)
- [Image preprocessing in retinal imaging - revisión](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4939933/)

## Códigos de prueba (si aplica)

El preprocesamiento está implementado en `backend/preprocessing/fundus.py`. Ejemplo de uso:

```python
from backend.preprocessing.fundus import preprocess_fundus, apply_clahe, extract_green_channel
import cv2

img = cv2.imread("fundus.jpg")
# Pipeline completo: verde + CLAHE + Ben Graham
preprocesada = preprocess_fundus(img, use_green=True, use_clahe=True, use_ben_graham=True)
# Solo CLAHE sobre canal verde
verde = extract_green_channel(img)
clahe = apply_clahe(verde, clip_limit=2.0)
```
