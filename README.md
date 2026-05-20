# Plataforma de análisis de retinografías

**Objetivo del proyecto:** En este proyecto diseñamos e implementamos una plataforma de software que permite **cargar retinografías**, **seleccionar entre tres modelos de IA** y obtener resultados de **detección/segmentación y/o clasificación de lesiones**, con **métricas de desempeño**, **trazabilidad de inferencias** y una **interfaz usable** orientada a **apoyo clínico/educativo** (no diagnóstico).

---

## Alcance

### Incluido

1. **Requerimientos** — Levantamiento de requerimientos funcionales y no funcionales (seguridad, usabilidad, rendimiento). Ver `docs/REQUERIMIENTOS.md`.
2. **Front-end (web)** — Carga de imagen, selección de modelo (A / B / C), visualización de resultados, historial básico. Carpeta `new_frontend/`.
3. **Back-end / API** — Orquestación de inferencias, trazabilidad (ID, timestamp, modelos usados, tiempos) y registros (historial). Gestión de usuarios opcional.
4. **Tres modelos** — (i) Segmentación disco/copa + CDR (Modelo A), (ii) Clasificador de severidad/glaucoma (Modelo B), (iii) Detector de lesiones (Modelo C), empaquetados para inferencia (Docker/servicio).
5. **Postprocesamiento** — Etiquetas, probabilidades y datos para gráficas (barras de probabilidad y tiempos de inferencia).
6. **Evaluación** — Script con dataset público o provisto: métricas (accuracy, F1, AUC, sensibilidad, especificidad, tiempos de inferencia) y comparación entre modelos. Carpeta `evaluation/`.
7. **Prototipo desplegable** — Local o nube (Docker/docker-compose) + documentación técnica y manual de usuario (`docs/MANUAL_USUARIO.md`).

### No incluido (para acotar)

- Certificación como dispositivo médico.
- Integración con historia clínica real.
- Diagnóstico automático definitivo.
- Uso en entornos clínicos reales sin supervisión y aprobación ética.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| **Datos/IA:** Calidad variable de imágenes (iluminación, desenfoque, artefactos) reduce desempeño. | Implementamos preprocesamiento (canal verde, CLAHE, Ben Graham); documentamos limitaciones. |
| **Datos/IA:** Desbalance de clases y sesgos de dataset afectan generalización. | Realizamos evaluación con dataset público/provisto; reportamos métricas en script de evaluación. |
| **Datos/IA:** Explicabilidad limitada. | Incluimos heatmap/mapa de relevancia en resultados; nuestro objetivo es Grad-CAM con modelo real. |
| **Datos/IA:** Diferencias de resolución/cámaras (dominio) degradan precisión. | Documentamos tipo de imágenes soportadas; evaluamos en condiciones controladas. |
| **Software:** Latencia y consumo en inferencia. | Medimos y exponemos tiempos; ofrecemos opción GPU (ONNX); acotamos historial. |
| **Software:** Seguridad y privacidad de imágenes médicas. | Implementamos cifrado en tránsito (HTTPS en despliegue), control de acceso, retención mínima, anonimización (ver `docs/REQUERIMIENTOS.md`). |
| **Legal/ético:** Uso indebido como diagnóstico. | Incluimos disclaimers en API e interfaz; enfocamos en “apoyo/tamizaje”; trazabilidad de cada inferencia. |
| **Proyecto:** Alcance excesivo. | Definimos claramente salidas por modelo (A: CDR; B: probabilidad; C: bboxes) y lesiones consideradas. |

---

## Informe 1 — Introducción, problema, restricciones, alcance

### Introducción

La fotografía de fondo de ojo (retinografía) permite capturar la retina, el nervio óptico y la vasculatura. Nuestra plataforma integra **tres modelos de IA**: (A) segmentación del disco y la copa óptica con **CDR**, (B) clasificación de probabilidad de **glaucoma**, (C) **detección de lesiones** (microaneurismas, hemorragias, exudados). El usuario puede **elegir qué modelos ejecutar**, obtener resultados con **métricas y trazabilidad** y consultar un **historial** de análisis. Nuestra interfaz y API están orientadas a **apoyo clínico y educativo**, no a diagnóstico definitivo.

### Planteamiento del problema

La interpretación de retinografías requiere tiempo y experiencia. Hemos desarrollado una plataforma que permite cargar imágenes, seleccionar modelos y obtener resultados de segmentación/clasificación/detección con trazabilidad y métricas de desempeño para apoyar la formación y el tamizaje, siempre bajo supervisión profesional.

### Restricciones y supuestos

- Trabajamos con imágenes de fondo de ojo (fundus), formatos estándar (jpg, png). Implementamos preprocesamiento para atenuar variaciones de iluminación.
- Nuestros modelos están actualmente como stubs; el diseño está listo para sustituir por modelos reales (ONNX/Triton).
- Nuestro sistema es de apoyo; no reemplaza el criterio clínico. Incluimos disclaimers en API e interfaz.

### Alcance (resumen)

Incluimos: requerimientos, front-end, back-end, tres modelos, postprocesamiento, evaluación con métricas, prototipo desplegable (Docker) y documentación (manual de usuario y técnica). No incluimos: certificación como dispositivo médico, integración con historia clínica real ni uso clínico real sin supervisión y aprobación ética.

---

## Cómo ejecutar

### Todo junto (API + `new_frontend`)

**Primera vez** (raíz del repo): instalar dependencias del orquestador, del backend y del front.

```bash
cd Proyecto_final
npm install
pip install -r requirements.txt
cd new_frontend && npm install && cd ..
```

**Cada vez que trabajes**, un solo comando en la raíz:

```bash
npm run dev
```

- Activa `.venv` automáticamente si existe en la raíz del proyecto.
- API: **http://127.0.0.1:8000/docs** · Interfaz Vite: la URL que muestre la terminal (suele ser **http://127.0.0.1:5173**).
- **Ctrl+C** detiene API y frontend a la vez.
- En Windows hace falta **Git Bash** o WSL para el script `scripts/run-backend.sh`.

### Backend (API)

```bash
cd Proyecto_final
pip install -r requirements.txt
PYTHONPATH=. uvicorn backend.main:app --reload
```

Documentación interactiva: **http://127.0.0.1:8000/docs**

### Frontend (interfaz web)

```bash
cd new_frontend
npm install
npm run dev
```

Interfaz: **http://127.0.0.1:5173** (en dev, las peticiones a la API van a `127.0.0.1:8000` y `/images` se proxifica con Vite; ver `new_frontend/src/services/api.js`).

### Docker (API + `new_frontend`)

Requisito: [Docker](https://docs.docker.com/get-docker/) y **Docker Compose v2** (comando `docker compose`).

```bash
docker compose up --build
```

- **Aplicación web (Nginx):** **http://localhost** (puerto 80). El cliente usa la base **`/api`**; Nginx hace *proxy* al contenedor `backend:8000` (sin el prefijo `/api`, igual que en el [nginx.conf](new_frontend/nginx.conf) del `new_frontend`).
- **Rutas auxiliares:** las miniaturas bajo **`/images/...`** se proxifican al mismo API para que coincidan con el upload y con [store](backend/store.py) (`data/images` en la raíz del repo, montado en `/app/data` dentro del contenedor).
- **API directa (depuración):** **http://localhost:8000** (también expuesta en [docker-compose.yml](docker-compose.yml)).

**Persistencia (no se pierde al recrear contenedores):** el volumen monta el directorio **`./data` del host** en **`/app/data`** (historial `inferences.json` e imágenes almacenadas). Crear `data` antes o dejar que la aplicación la cree; no versionar datos sensibles.

**Modelos (`.keras` / `.h5`):** suelen estar en [`.gitignore`](.gitignore) por tamaño. Opciones:

1. Construir la imagen con los ficheros ya presentes en **`backend/models/`** (el `Dockerfile` hace `COPY backend`; no se excluyen `*.keras` en [`.dockerignore`](.dockerignore)).  
2. O montar solo lectura, descomentando en `docker-compose` la línea `backend/models` (si en el host la carpeta queda **vacía**, anula los modelos embebidos en la imagen; conviene rellenar con los pesos o no usar ese montaje).

Variables opcionales: **`ANTHROPIC_API_KEY`** (agente) se puede exportar o pasar en un `.env` (descomentar `env_file` en `docker-compose` si aplica; no subir secretos a git).

La primera build puede ser **lenta** (TensorFlow y dependencias vía `pip`).

---

## API — Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Estado del servicio |
| POST | /analyze-retina/ | Analizar imagen. Parámetros: `file`, `models=A,B,C`, `include_heatmap`. Devuelve resultados, inference_id, traceability, postprocessing, disclaimer |
| GET | /history | Historial de inferencias (limit, offset) |
| GET | /inferences/{id} | Detalle de una inferencia (trazabilidad) |

---

## Evaluación de modelos

```bash
PYTHONPATH=. python evaluation/run_evaluation.py --images evaluation/data/images [--labels evaluation/data/labels.csv] [--output evaluation/reports] [--limit N]
```

Con `--labels` (CSV con columnas `image_name`, `glaucoma` 0/1) se calculan accuracy, F1, AUC, sensibilidad y especificidad del clasificador. Sin etiquetas se reportan solo tiempos de inferencia y comparación entre modelos. Ver `evaluation/README.md`.

---

## Estructura del repositorio

```
Proyecto_final/
├── diseno/                    # Temas de diseño (README por tema)
│   ├── 01-fotografia-fondo-ojo/
│   ├── 02-preprocesamiento-retina/
│   ├── 03-segmentacion-disco-copa-cdr/
│   ├── 04-glaucoma-y-retinopatia/
│   ├── 05-modelos-ia-segmentacion-clasificacion/
│   ├── 06-explicabilidad-xai/
│   └── 07-stack-tecnologico-api/
├── backend/                   # API FastAPI, modelos, preprocesamiento, store
├── new_frontend/              # Interfaz web actual (Vite; desplegada con Docker)
├── evaluation/                # Script de evaluación y métricas
├── docs/
│   ├── MANUAL_USUARIO.md      # Manual de usuario
│   └── REQUERIMIENTOS.md      # Requerimientos funcionales y no funcionales
├── data/                      # Persistencia de historial (inferences.json)
├── Dockerfile                 # Imagen del backend
├── docker-compose.yml         # Backend + frontend (nginx)
├── FICHA_PROYECTO.md
├── requirements.txt
└── README.md
```

---

## Documentación

- **Manual de usuario:** `docs/MANUAL_USUARIO.md`  
- **Requerimientos (funcionales y no funcionales):** `docs/REQUERIMIENTOS.md`  
- **Evaluación de modelos:** `evaluation/README.md`  
- **Diseño por temas:** carpeta `diseno/` (cada subcarpeta tiene su README).

---

## Repositorio y colaboradores

Mantenemos un repositorio público en **GitHub**. Todos los integrantes de nuestro grupo, el tutor y el profesor están agregados como colaboradores. El enlace al repositorio está consignado en el Excel de grupos de trabajo en la columna correspondiente.

# Diagramas
## Diagrama de Arquitectura

<img width="856" height="620" alt="arquitectura" src="https://github.com/user-attachments/assets/9bb0e69b-0625-4000-afdd-319f12781fc4" />

## Diagrama de Interacción de Modulos

<img width="1733" height="857" alt="interaccion" src="https://github.com/user-attachments/assets/6f127ab3-cb5f-4f55-9de0-5ab2b3ee3097" />

## Secuencia Login

<img width="694" height="424" alt="secuencia_login" src="https://github.com/user-attachments/assets/f5c90f79-7a33-46d5-beb3-81fb5cab137d" />

## Secuencia Core

<img width="1001" height="754" alt="secuencia_co" src="https://github.com/user-attachments/assets/84d8a49d-b949-43e4-adf8-ee45e2af90eb" />


