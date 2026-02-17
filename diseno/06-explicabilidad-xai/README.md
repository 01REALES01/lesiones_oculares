# Explicabilidad (XAI) en Modelos de Diagnóstico

## Explicación del tema

En entornos médicos es importante que el profesional entienda **por qué** el modelo da un resultado. La **explicabilidad (XAI, eXplainable AI)** ayuda a:

- Aumentar la confianza del médico en la herramienta.
- Detectar si el modelo se fija en regiones irrelevantes (artefactos, marcas de agua).
- Cumplir con expectativas éticas y de auditoría.

Técnicas habituales:

- **Grad-CAM (Gradient-weighted Class Activation Mapping):** usa los gradientes de la última capa convolutiva para generar un mapa de calor que indica qué zonas de la imagen influyeron más en la decisión. Muy usada en clasificación de imágenes médicas.
- **Heatmaps sintéticos / atención estimada:** mientras no se tenga el modelo entrenado, se puede devolver un heatmap centrado en la región de interés (p. ej. disco óptico) para mantener el mismo contrato de API y que el frontend ya muestre “dónde miró el modelo”.

En este proyecto se devuelve un **heatmap** (por ahora sintético, centrado en el disco) como imagen en base64 en la respuesta de `POST /analyze-retina/`, con el objetivo de sustituirlo por **Grad-CAM** cuando el clasificador sea un modelo PyTorch disponible.

## Enlaces relevantes

- [Grad-CAM: Visual Explanations from Deep Networks (Selvaraju et al.)](https://arxiv.org/abs/1610.02391)
- [Grad-CAM en PyTorch - implementación](https://github.com/jacobgil/pytorch-grad-cam)
- [Explainable AI in healthcare - revisión](https://www.nature.com/articles/s41746-021-00438-z)

## Códigos de prueba (si aplica)

- Módulo de explicabilidad: `backend/models/explainability.py`
  - `generate_attention_heatmap()` — heatmap sintético centrado en disco/centro.
  - `get_explanation_image_base64()` — devuelve la imagen con heatmap en base64 PNG.

La API incluye el parámetro `include_heatmap=true` (por defecto) y el campo `heatmap_image_base64` en la respuesta. Ejemplo de decodificación en frontend:

```javascript
const img = document.createElement('img');
img.src = `data:image/png;base64,${response.heatmap_image_base64}`;
```
