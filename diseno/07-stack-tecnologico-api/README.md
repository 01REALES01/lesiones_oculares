# Stack Tecnológico y API

## Explicación del tema

El proyecto utiliza un stack pensado para integración con modelos de IA y uso en entorno clínico:

- **Backend:** **FastAPI** (Python 3.9+). Permite endpoints asíncronos, documentación OpenAPI automática y ejecución en paralelo de los tres modelos (segmentación, clasificación, detección) con `asyncio.gather`.
- **Inferencia:** **ONNX Runtime** (recomendado para empezar) o **NVIDIA Triton** si se requiere servir varios modelos con batching en GPU.
- **Base de datos (futuro):** **PostgreSQL** + extensión **pgvector** para almacenar casos y permitir búsqueda de “casos similares” por embeddings.
- **Frontend (futuro):** **React** + **Konva.js** para visualizar la imagen de fundus, el heatmap, las máscaras y las anotaciones del médico.

La API expone:
- `GET /health` — estado del servicio.
- `POST /analyze-retina/` — recibe una imagen, devuelve CDR, probabilidad de glaucoma, lesiones, recomendación y heatmap (explicabilidad).

## Enlaces relevantes

- [FastAPI - Documentación oficial](https://fastapi.tiangolo.com/)
- [ONNX Runtime](https://onnxruntime.ai/docs/)
- [NVIDIA Triton Inference Server](https://github.com/triton-inference-server/server)
- [pgvector - Embeddings en PostgreSQL](https://github.com/pgvector/pgvector)
- [Konva.js - Canvas 2D](https://konvajs.org/)

## Códigos de prueba (si aplica)

- Punto de entrada: `backend/main.py`
- Configuración: `backend/config.py` y `.env` (ver `.env.example`)
- Ejecución local:

```bash
pip install -r requirements.txt
PYTHONPATH=. uvicorn backend.main:app --reload
```

Documentación interactiva: **http://127.0.0.1:8000/docs**
