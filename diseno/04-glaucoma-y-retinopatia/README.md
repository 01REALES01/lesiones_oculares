# Glaucoma y Retinopatía Diabética

## Explicación del tema

- **Glaucoma**  
  Enfermedad del nervio óptico que puede llevar a pérdida de visión. En fondo de ojo se observa un **aumento de la excavación** del disco óptico (CDR elevado). El cribado con imágenes de fundus permite identificar casos sospechosos para derivación al especialista.

- **Retinopatía diabética (RD)**  
  Complicación de la diabetes que afecta los vasos de la retina. En las imágenes se buscan **microaneurismas**, **hemorragias**, **exudados duros** y otras lesiones. La detección temprana reduce el riesgo de ceguera.

Ambas patologías son abordables con **clasificación** (glaucoma sí/no, grado de RD) y **detección de objetos** (lesiones con bounding boxes). El sistema de este proyecto contempla:
- Un **clasificador** de glaucoma (probabilidad).
- Un **detector de lesiones** (bboxes) para apoyar al médico en el barrido de la imagen.

## Enlaces relevantes

- [Glaucoma - WHO](https://www.who.int/news-room/fact-sheets/detail/glaucoma)
- [Diabetic retinopathy - NIH](https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/diabetic-retinopathy)
- [International Clinical Diabetic Retinopathy Scale](https://www.icoph.org/dynamic/attachments/resources/diabetic-retinopathy-detail.pdf)
- [Optic disc and glaucoma - AAO](https://www.aao.org/education/image/optic-disc-glaucoma)

## Códigos de prueba (si aplica)

- Clasificación: `backend/models/glaucoma_classifier.py` (stub; sustituir por modelo EfficientNet/ViT u otro).
- Detección de lesiones: `backend/models/lesion_detector.py` (stub; sustituir por YOLO/Faster R-CNN).
- La recomendación clínica y el nivel de riesgo se generan en `backend/main.py` a partir de CDR y probabilidad de glaucoma.
