# Fotografía de Fondo de Ojo (Fundus Photography)

## Explicación del tema

La **fotografía de fondo de ojo** (o *fundus photography*) es una técnica de imagen médica que captura la superficie interna del ojo: la **retina**, el **nervio óptico (disco óptico)**, la **copa óptica** y la **vasculatura**. A diferencia de la fotografía del iris (parte coloreada externa), aquí se observan estructuras clave para diagnosticar:

- **Glaucoma** (relación copa/disco, CDR)
- **Retinopatía diabética** (hemorragias, microaneurismas, exudados)
- **Degeneración macular**

Las imágenes se obtienen con **oftalmoscopios** o **retinógrafos** (a veces con dilatación pupilar). El resultado es una imagen 2D en color (típicamente RGB) donde el canal verde suele aportar mejor contraste para vasos y lesiones.

## Enlaces relevantes

- [Fundus photography - Wikipedia (EN)](https://en.wikipedia.org/wiki/Fundus_photography)
- [Retinal imaging - NIH](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/retinal-imaging)
- [REFUGE Challenge - Retinal Fundus Glaucoma Challenge](https://refuge.grand-challenge.org/) (datasets y referencias)
- [RIM-ONE - Retinal Image database for Optic Nerve Evaluation](https://rimone.med.gla.ac.uk/)

## Códigos de prueba (si aplica)

En este proyecto, la carga y el preprocesamiento de imágenes de fundus se realizan en:

- `backend/preprocessing/fundus.py` — extracción de canal verde, CLAHE y normalización.
- `backend/main.py` — lectura de la imagen subida en `POST /analyze-retina/`.

Ejemplo de carga de una imagen de fundus con OpenCV (Python):

```python
import cv2
img = cv2.imread("ruta/a/fundus.jpg")
# Canal verde (mejor contraste en retina)
verde = img[:, :, 1]
```
