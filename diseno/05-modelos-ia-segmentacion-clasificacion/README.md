# Modelos de IA: Segmentación, Clasificación y Detección

## Explicación del tema

En el proyecto se plantean tres tipos de modelo:

| Modelo | Tarea | Arquitecturas objetivo | Salida |
|--------|--------|------------------------|--------|
| **A** | Segmentación disco y copa óptica | U-Net++, DeepLabV3+ | Máscaras → CDR |
| **B** | Clasificación (glaucoma / patologías) | EfficientNet-B4, Vision Transformer (ViT) | Probabilidad 0–1 |
| **C** | Detección de lesiones (exudados, hemorragias) | YOLOv10, Faster R-CNN | Bounding boxes + etiquetas |

- **Segmentación:** redes encoder-decoder que predicen una máscara por píxel.
- **Clasificación:** redes que asignan una etiqueta (o probabilidad) a la imagen completa.
- **Detección:** redes que localizan objetos con cajas y clases (útil para “dónde está la lesión”).

La inferencia se plantea con **ONNX Runtime** (CPU/GPU) o **NVIDIA Triton** en entornos con más carga. Los módulos actuales son stubs que devuelven resultados de prueba hasta conectar los modelos exportados.

## Enlaces relevantes

- [U-Net (Ronneberger et al.)](https://arxiv.org/abs/1505.04597)
- [EfficientNet - Rethinking Model Scaling](https://arxiv.org/abs/1905.11946)
- [Vision Transformer (ViT)](https://arxiv.org/abs/2010.11929)
- [YOLOv10](https://arxiv.org/abs/2405.14458) / [Faster R-CNN](https://arxiv.org/abs/1506.01497)
- [ONNX Runtime](https://onnxruntime.ai/) | [NVIDIA Triton](https://github.com/triton-inference-server/server)

## Códigos de prueba (si aplica)

- Segmentación: `backend/models/segmentation_vnet.py`
- Clasificación: `backend/models/glaucoma_classifier.py`
- Detección: `backend/models/lesion_detector.py`

Ejemplo de llamada al orquestador (los tres se ejecutan en paralelo):

```python
# En backend/main.py, los tres modelos se invocan con asyncio.gather:
results = await asyncio.gather(
    predict_glaucoma(image),
    segment_optic_disc(image),
    detect_hemorrhages(image),
)
```
