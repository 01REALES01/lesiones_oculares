# 🏥 Arquitectura Completa del Sistema - Análisis de Lesiones Oculares

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Partes Principales del Sistema](#partes-principales-del-sistema)
3. [Tecnologías por Componente](#tecnologías-por-componente)
4. [Flujo Detallado del Sistema](#flujo-detallado-del-sistema)
5. [Flujo Técnico por Capas](#flujo-técnico-por-capas)
6. [Archivos Clave Involucrados](#archivos-clave-involucrados)

---

## 📌 Descripción General

**Plataforma de Análisis de Retinografías** es un sistema de apoyo clínico y educativo que permite:
- Cargar fotografías de fondo de ojo (retinografías)
- Seleccionar entre 3 modelos de IA
- Obtener resultados de detección/segmentación y clasificación de lesiones
- Visualizar métricas de desempeño y trazabilidad de cada inferencia

**Propósito**: Apoyo clínico/educativo (NO diagnóstico definitivo)

---

## 🧩 Partes Principales del Sistema

### 1️⃣ **Frontend Web (React + Vite)**
- **Ubicación**: `/frontend/` (legacy) y `/new_frontend/` (actual)
- **Responsabilidad**: Interfaz de usuario, carga de imágenes, visualización de resultados
- **Usuarios finales**: Profesionales de salud, estudiantes

### 2️⃣ **Backend API (FastAPI + Python)**
- **Ubicación**: `/backend/`
- **Responsabilidad**: Orquestación de modelos ML, preprocesamiento, postprocesamiento, trazabilidad
- **Tecnología**: FastAPI (async), Python 3.10+

### 3️⃣ **Modelos de Machine Learning**
- **Ubicación**: `/backend/models/`
- **3 Modelos principales**:
  - **Modelo A**: Segmentación disco/copa óptica + CDR
  - **Modelo B**: Clasificación de riesgo de glaucoma
  - **Modelo C**: Detección/clasificación de lesiones (Retinopatía Diabética)

### 4️⃣ **Preprocesamiento**
- **Ubicación**: `/backend/preprocessing/fundus.py`
- **Pipeline**: Canal verde → CLAHE → Normalización Ben Graham

### 5️⃣ **Postprocesamiento**
- **Ubicación**: `/backend/postprocessing/report.py`
- **Función**: Etiquetado, probabilidades, datos para gráficas

### 6️⃣ **Almacenamiento de Trazabilidad**
- **Ubicación**: `/backend/store.py`
- **Datos guardados**: ID inferencia, timestamps, modelos usados, tiempos, imágenes

### 7️⃣ **Autenticación**
- **Ubicación**: `/backend/auth.py`
- **Método**: JWT (OAuth2)

### 8️⃣ **Agente Cerebro (Opcional - LLM)**
- **Ubicación**: `/backend/agents/brain_agent.py`
- **Tecnología**: Claude API (Anthropic)
- **Función**: Orquestación automática de modelos según solicitud en lenguaje natural

---

## 🛠️ Tecnologías por Componente

### **Frontend**
| Componente | Tecnología | Ubicación |
|-----------|-----------|----------|
| Framework UI | React 18 | `/new_frontend/src/App.jsx` |
| Bundler | Vite | `/new_frontend/vite.config.js` |
| Estilos | Tailwind CSS | `/new_frontend/tailwind.config.js` |
| Animaciones | Framer Motion | `/new_frontend/src/components/` |
| HTTP Client | Fetch API | `/new_frontend/src/services/api.js` |
| Autenticación | LocalStorage + JWT | `/new_frontend/src/context/AuthContext.jsx` |

### **Backend**
| Componente | Tecnología | Ubicación |
|-----------|-----------|----------|
| Framework | FastAPI | `/backend/main.py` |
| Server | Uvicorn | `requirements.txt` |
| Async | asyncio | `/backend/main.py` |
| Seguridad | OAuth2 + JWT | `/backend/auth.py` |
| CORS | FastAPI Middleware | `/backend/main.py` |
| Base de datos | JSON file (store) | `/data/inferences.json` |
| Imágenes | Sistema de archivos | `/data/images/` |

### **Machine Learning**
| Modelo | Tecnología | Archivo | Entrada | Salida |
|--------|-----------|---------|---------|--------|
| **Modelo A** (Segmentación) | V-Net | `/backend/models/segmentation_vnet.py` | Imagen 512x512 | CDR, área disco, área copa |
| **Modelo B** (Glaucoma) | Red neuronal | `/backend/models/glaucoma_classifier.py` | Imagen 224x224 | Probabilidad 0-1 |
| **Modelo C** (Lesiones/DR) | ResNet50/DenseNet169/Xception/MobileNetV3 | `/backend/models/lesion_detector.py` + `ml_manager.py` | Imagen 224x224 | Grado DR (0-4), probabilidades |

### **Preprocesamiento**
| Técnica | Tecnología | Ubicación |
|---------|-----------|----------|
| Lectura de imagen | OpenCV (cv2) | `/backend/preprocessing/fundus.py` |
| Extracción canal verde | NumPy + OpenCV | `extract_green_channel()` |
| CLAHE | OpenCV CLAHE | `apply_clahe()` |
| Normalización Ben Graham | NumPy + OpenCV | `ben_graham_normalize()` |

### **Almacenamiento & Serialización**
| Componente | Tecnología | Ubicación |
|-----------|-----------|----------|
| Historial de inferencias | JSON | `/data/inferences.json` |
| Imágenes procesadas | PNG/JPG | `/data/images/` |
| Configuración | Python Pydantic | `/backend/config.py` |

### **Orquestación (Opcional)**
| Componente | Tecnología | Ubicación |
|-----------|-----------|----------|
| Agente cerebro | Claude API (Anthropic) | `/backend/agents/brain_agent.py` |
| Evaluación | Python + scikit-learn | `/evaluation/run_evaluation.py` |

### **Containerización & Deployment**
| Componente | Tecnología | Archivo |
|-----------|-----------|---------|
| Backend container | Docker + Python | `/Dockerfile` |
| Frontend container | Docker + Node.js + Nginx | `/frontend/Dockerfile` |
| Orquestación | Docker Compose | `/docker-compose.yml` |
| Scripts de inicio | PowerShell/Bash | `/start.ps1`, `/start.sh` |

---

## 🔄 Flujo Detallado del Sistema

### **Vista de Alto Nivel**

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │────────▶│   FastAPI    │────────▶│  Modelos ML │
│   (React)   │◀────────│   Backend    │◀────────│   (3 tipos) │
│             │  JSON   │              │ Tensors │             │
└─────────────┘         └──────────────┘         └─────────────┘
      ▲                        ▲                        ▲
      │                        │                        │
      │ Upload Image           │ Preprocesamiento       │ Inferencia
      │ Selecciona Modelos     │ Almacena Trazabilidad  │ Batching
      │                        │                        │
      └────────────────────────────────────────────────┘
```

### **Flujo Completo (Paso a Paso)**

#### **PASO 1: Usuario interactúa con Frontend**

**Archivo**: `/new_frontend/src/App.jsx`

1. Usuario accede a la interfaz
2. Se autentica (Login.jsx)
3. Token JWT guardado en localStorage
4. Navega a Dashboard → Pestaña "Upload"
5. Selecciona imagen(s) (carga local o arrastrar-soltar)
6. Selecciona qué modelos ejecutar (checkboxes A/B/C)
7. Presiona "Analizar"

```javascript
// new_frontend/src/App.jsx (líneas ~45-100)
const handleAnalyze = async () => {
  if (files.length === 0) return;
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  
  // POST a /api/analyze-retina/
  const response = await fetch(`${API}/analyze-retina/?models=A,B,C`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form, 
  });
};
```

---

#### **PASO 2: Autenticación en Backend**

**Archivo**: `/backend/auth.py`

1. Frontend envía credenciales a `/token` (OAuth2PasswordRequestForm)
2. Backend valida usuario/contraseña contra base de datos local (`users.json`)
3. Backend genera JWT token con expiración
4. Token se devuelve al frontend y se guarda en localStorage

```python
# backend/auth.py
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}
```

**Flujo en el header**:
```
Frontend: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Backend: Valida JWT → Extrae usuario de claims → Permite acceso
```

---

#### **PASO 3: Upload y Lectura de Imagen**

**Archivo**: `/backend/main.py` (líneas ~900-920)

1. Frontend envía archivo(s) en `multipart/form-data`
2. FastAPI recibe `UploadFile`
3. Backend lee bytes de imagen

```python
# backend/main.py
def _read_image_from_upload(file: UploadFile) -> np.ndarray:
    import cv2
    contents = file.file.read()
    arr = np.frombuffer(contents, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)  # BGR format
    return img
```

**Formato esperado**: PNG, JPG, hasta ~512x512 píxeles

---

#### **PASO 4: Almacenamiento Temporal de Imagen**

**Archivo**: `/backend/store.py`

1. Imagen se guarda a disco en `/data/images/`
2. Se genera ID único (UUID)
3. URL para acceso posterior: `/images/{image_id}`

```python
# backend/store.py
def save_image_to_disk(image_bytes: bytes, filename: str) -> str:
    image_id = str(uuid.uuid4())
    image_path = IMAGES_DIR / f"{image_id}.png"
    with open(image_path, "wb") as f:
        f.write(image_bytes)
    return image_id
```

---

#### **PASO 5: Preprocesamiento**

**Archivo**: `/backend/preprocessing/fundus.py`

El preprocesamiento sigue este pipeline:

1. **Extracción canal verde**: En fundus (fondo de ojo), el canal verde tiene mejor contraste
2. **CLAHE**: Realza bordes del disco óptico sin amplificar ruido
3. **Normalización Ben Graham**: Resta desenfoque local para resaltar estructuras

```python
# backend/preprocessing/fundus.py
def preprocess_fundus(image_input, use_green=True, use_clahe=True, use_ben_graham=True):
    img = cv2.imread(image_input) if isinstance(image_input, str) else image_input
    
    # 1. Asegurar escala de grises
    if img.ndim == 3:
        img = _ensure_grayscale(img)
    
    # 2. Extraer canal verde (mejor contraste)
    if use_green and img.ndim == 3:
        out = extract_green_channel(img)  # img[:, :, 1]
    
    # 3. Aplicar CLAHE (realza bordes)
    if use_clahe:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        out = clahe.apply(out)
    
    # 4. Normalización Ben Graham (elimina fondo)
    if use_ben_graham:
        blurred = cv2.GaussianBlur(out.astype(np.float32), (0, 0), sigma=30)
        out = out.astype(np.float32) - blurred
        out = np.clip(out, 0, 255).astype(np.uint8)
    
    return out
```

**Resultado**: Imagen 1 canal, 8-bit, optimizada para modelos ML

---

#### **PASO 6: Carga de Modelos (Startup)**

**Archivo**: `/backend/main.py` (líneas ~1-100, función `lifespan`)

En el startup de la aplicación FastAPI, se cargan los modelos disponibles:

```python
# backend/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cargar modelo DenseNet169 para Retinopatía Diabética (Modelo C)
    _load_first_available_model("lesiones_densenet", [
        {"filename": "densenet_169_aptos_fine.h5", "model_type": "densenet169"},
    ])
    
    # Cargar modelo ResNet50 (fallback principal para Modelo C)
    _load_first_available_model("lesiones_priority", [
        {"filename": "resnet50_model_fine.h5", "model_type": "resnet50"},
        {"filename": "mobilenetv3_model_fine.keras", "model_type": "mobilenetv3"},
    ])
    
    # Cargar modelo Xception
    _load_first_available_model("lesiones_xception", [
        {"filename": "xception_aptos_fine2.h5", "model_type": "xception"},
    ])
    
    yield  # App está corriendo
    
app = FastAPI(lifespan=lifespan)
```

**Modelos cargados en**: `/backend/models/` (archivos .h5 y .keras)

---

#### **PASO 7: Inferencia - Batching para Modelo C (Lesiones)**

**Archivo**: `/backend/main.py` (líneas ~900-970) + `/backend/ml_manager.py`

Si se selecciona el **Modelo C**, se puede procesar múltiples imágenes en **un solo pase**:

```python
# backend/main.py - endpoint /analyze-retina/
if "C" in models_used and c_model_key in ml_manager.models:
    # Preparar lista de bytes de todas las imágenes
    valid_bytes_list = []
    for file in files:
        file.file.seek(0)
        valid_bytes_list.append(file.file.read())
    
    # ⚡ BATCH INFERENCE (mucho más rápido)
    t0_batch = time.perf_counter()
    dr_batch_results = await loop.run_in_executor(
        None, 
        lambda: ml_manager.predict_batch(
            model_key=c_model_key, 
            images_bytes_list=valid_bytes_list,
            model_type=model_c_type  # "resnet50" | "densenet169" | "xception"
        )
    )
    c_inference_time_total = (time.perf_counter() - t0_batch) * 1000
```

**En `ml_manager.predict_batch()`**:

```python
# backend/ml_manager.py
def predict_batch(self, model_key, images_bytes_list, model_type="resnet50"):
    # 1. Preprocesar cada imagen
    preprocessed_images = []
    for img_bytes in images_bytes_list:
        array = self.preprocess_image(img_bytes, target_size=(224, 224), 
                                      model_type=model_type)
        preprocessed_images.append(array)
    
    # 2. Stack en tensor batch (shape: [N, 224, 224, 3])
    batch_tensor = np.stack(preprocessed_images)
    
    # 3. ⚡ UNA SOLA LLAMADA AL MODELO
    predictions = self.models[model_key].predict(batch_tensor, verbose=0)
    
    # 4. Post-processing: convertir logits a clases + probabilidades
    results = []
    for idx, probs in enumerate(predictions):
        predicted_class = int(np.argmax(probs))
        confidence = float(np.max(probs)) * 100
        
        results.append({
            "model_used": model_key,
            "predicted_class": predicted_class,  # 0-4 (grado DR)
            "confidence_percent": round(confidence, 2),
            "diagnosis": f"Retinopatía Diabética Grado {predicted_class}",
            "clinical_description": self.class_descriptions.get(predicted_class),
            "raw_probabilities": [round(float(p), 2) for p in probs],
        })
    
    return results
```

**Salida del Modelo C**:
```json
{
  "model_used": "lesiones_resnet50",
  "predicted_class": 2,
  "confidence_percent": 85.5,
  "diagnosis": "Retinopatía Diabética Grado 2",
  "clinical_description": "Microaneurismas, exudados...",
  "raw_probabilities": [0.02, 0.08, 0.85, 0.04, 0.01]
}
```

---

#### **PASO 8: Inferencia - Modelos A y B (Secuencial)**

**Modelo A - Segmentación Disco/Copa**:

```python
# backend/models/segmentation_vnet.py
def segment_optic_disc(image: np.ndarray) -> dict:
    # Stub: En producción, carga modelo V-Net entrenado
    # Por ahora: heurística simple
    h, w = image.shape
    cdr = 0.45  # Cup-to-Disc Ratio (0 a 1)
    
    disc_area = (np.pi * (w * 0.3) ** 2) / 1000  # Aproximado
    cup_area = disc_area * cdr
    
    return {
        "cdr": cdr,
        "disc_area": disc_area,
        "cup_area": cup_area,
    }
```

**Modelo B - Clasificación Glaucoma**:

```python
# backend/models/glaucoma_classifier.py
def predict_glaucoma(image: np.ndarray) -> float:
    # Stub: En producción, modelo real
    # Por ahora: heurística
    intensity = np.mean(image)
    prob = 0.5 - (intensity - 128) / 256  # Normalizar a [0, 1]
    return np.clip(prob, 0, 1)
```

**Flujo en `/analyze-retina/`**:

```python
# backend/main.py (líneas 920-950)
for idx, file in enumerate(files):
    # ...
    if "A" in models_used:
        t0 = time.perf_counter()
        seg = await loop.run_in_executor(None, lambda: segment_optic_disc(image))
        inference_times_ms["A"] = (time.perf_counter() - t0) * 1000
        results_by_model["A"] = seg
    
    if "B" in models_used:
        t0 = time.perf_counter()
        prob = await loop.run_in_executor(None, lambda: predict_glaucoma(image))
        inference_times_ms["B"] = (time.perf_counter() - t0) * 1000
        results_by_model["B"] = float(prob)
```

---

#### **PASO 9: Postprocesamiento**

**Archivo**: `/backend/postprocessing/report.py`

Una vez que los 3 modelos han ejecutado, se consolida todo en un **reporte legible**:

```python
# backend/postprocessing/report.py
def build_report(model_a_result, model_b_result, model_c_result, models_used):
    labels = []
    probabilities = {}
    segmentation_summary = {}
    detection_summary = []
    
    # A: Segmentación
    if "A" in models_used and model_a_result:
        cdr = model_a_result.get("cdr", 0)
        labels.append(f"CDR: {cdr:.2f}")
        segmentation_summary = {
            "cdr": cdr,
            "disc_area": model_a_result.get("disc_area"),
            "cup_area": model_a_result.get("cup_area"),
        }
    
    # B: Glaucoma
    if "B" in models_used and model_b_result:
        prob = float(model_b_result)
        probabilities["glaucoma"] = prob
        labels.append(f"Probabilidad glaucoma: {prob*100:.1f}%")
    
    # C: Lesiones/DR
    if "C" in models_used and model_c_result:
        label = f"Grado {model_c_result['predicted_class']}: {model_c_result['diagnosis']}"
        detection_summary = [{"label": label, "confidence": model_c_result['confidence_percent']/100}]
    
    return {
        "labels": labels,
        "probabilities": probabilities,
        "segmentation": segmentation_summary,
        "detection": detection_summary,
        "models_used": models_used,
    }
```

**Función para gráficas**:

```python
def graph_data_for_frontend(probabilities, inference_times_ms):
    return {
        "probability_bars": [
            {"name": k, "value": v, "percent": v*100} 
            for k, v in probabilities.items()
        ],
        "inference_time_bars": [
            {"model": m, "ms": t} 
            for m, t in inference_times_ms.items()
        ],
    }
```

---

#### **PASO 10: Construcción de Resultado Final**

**Archivo**: `/backend/main.py` (función `_build_full_result`, líneas ~300-380)

```python
def _build_full_result(results_by_model, models_used, inference_times_ms, img):
    # Extraer valores
    cdr = results_by_model.get("A", {}).get("cdr", 0)
    prob = results_by_model.get("B", 0)
    dr_class = results_by_model.get("C", {}).get("predicted_class", 0)
    
    # Determinar nivel de riesgo
    risk_level = "high" if (prob >= 0.6 or cdr > 0.6 or dr_class >= 3) \
                else "medium" if (prob >= 0.4 or cdr > 0.5 or dr_class > 0) \
                else "low"
    
    # Recomendación clínica
    recommendation_short = {
        "high": "Evaluación oftalmológica urgente.",
        "medium": "Evaluación recomendada.",
        "low": "Seguimiento habitual."
    }[risk_level]
    
    # Construir reporte de postprocesamiento
    report = build_report(
        model_a_result=results_by_model.get("A"),
        model_b_result=results_by_model.get("B"),
        model_c_result=results_by_model.get("C"),
        models_used=models_used,
    )
    
    # Datos para gráficas en frontend
    graph_data = graph_data_for_frontend(
        report.get("probabilities", {}),
        inference_times_ms
    )
    
    return {
        "glaucoma_probability": round(prob, 4),
        "cup_to_disc_ratio": cdr,
        "disc_area": results_by_model.get("A", {}).get("disc_area"),
        "cup_area": results_by_model.get("A", {}).get("cup_area"),
        "lesions_found": [
            {"label": f"Grado {dr_class}", "confidence": dr_class/5}
        ] if dr_class > 0 else [],
        "recommendation": f"CDR: {cdr:.2f}. Glaucoma: {prob*100:.1f}%. DR Grado: {dr_class}.",
        "explanation": {
            "cdr_interpretation": "..." if cdr > 0.6 else "...",
            "glaucoma_risk_level": risk_level,
            "glaucoma_probability_percent": prob * 100,
            "dr_grade": dr_class,
            "dr_diagnosis": f"Grado {dr_class}",
            "recommendation_short": recommendation_short,
        },
        "postprocessing": {
            "report": report,
            "graph_data": graph_data,
        },
        "disclaimer": DISCLAIMER,
    }
```

---

#### **PASO 11: Trazabilidad - Guardar en Store**

**Archivo**: `/backend/store.py` + `/backend/main.py` (líneas ~960-980)

```python
# backend/main.py
inference_id = save_inference(
    models_used=models_used,  # ["A", "B", "C"]
    inference_times_ms=inference_times_ms,  # {"A": 45.2, "B": 32.1, "C": 120.5}
    result=result,  # Resultado completo con recomendaciones
    image_size=(img.shape[1], img.shape[0]),
    batch_id=batch_id,  # UUID para agrupar múltiples análisis
)
```

**Función en store**:

```python
# backend/store.py
def save_inference(models_used, inference_times_ms, result, image_size, batch_id=None):
    inference_id = str(uuid.uuid4())
    record = {
        "inference_id": inference_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "batch_id": batch_id,
        "models_used": models_used,
        "inference_times_ms": inference_times_ms,
        "result": result,
        "image_size": image_size,
    }
    
    # Guardar en JSON
    inferences = _load_inferences()
    inferences.append(record)
    with open(INFERENCES_FILE, "w") as f:
        json.dump(inferences, f, indent=2)
    
    return inference_id
```

**Archivo generado**: `/data/inferences.json`

```json
[
  {
    "inference_id": "abc-123-def-456",
    "timestamp": "2026-05-09T14:30:45.123456+00:00",
    "batch_id": "batch-xyz-789",
    "models_used": ["A", "B", "C"],
    "inference_times_ms": {
      "A": 45.2,
      "B": 32.1,
      "C": 120.5
    },
    "result": {
      "glaucoma_probability": 0.35,
      "cup_to_disc_ratio": 0.52,
      "explanation": { ... }
    },
    "image_size": [768, 768]
  }
]
```

---

#### **PASO 12: Respuesta al Frontend**

**Archivo**: `/backend/main.py` (línea ~980, return statement)

```python
# backend/main.py - endpoint /analyze-retina/
return final_results  # Lista de resultados por imagen

# Estructura de cada resultado:
{
    "filename": "retina_patient_001.jpg",
    "inference_id": "abc-123-def-456",
    "success": true,
    "traceability": {
        "inference_id": "abc-123-def-456",
        "models_used": ["A", "B", "C"],
        "inference_times_ms": {
            "A": 45.2,
            "B": 32.1,
            "C": 120.5
        }
    },
    "glaucoma_probability": 0.35,
    "cup_to_disc_ratio": 0.52,
    "lesions_found": [
        {
            "label": "Grado 2: Retinopatía Diabética Moderada",
            "confidence": 0.855,
            "x_min": 0, "y_min": 0, "x_max": 0, "y_max": 0
        }
    ],
    "recommendation": "CDR: 0.52. Glaucoma: 35.0%. DR Grado: 2.",
    "explanation": {
        "cdr_interpretation": "CDR en rango límite; seguimiento recomendado.",
        "glaucoma_risk_level": "medium",
        "glaucoma_probability_percent": 35.0,
        "dr_grade": 2,
        "dr_diagnosis": "Retinopatía Diabética Grado 2",
        "recommendation_short": "Evaluación recomendada."
    },
    "postprocessing": {
        "report": {
            "labels": ["CDR: 0.52", "Probabilidad glaucoma: 35.0%", "Retinopatía: Grado 2: ..."],
            "probabilities": {"glaucoma": 0.35},
            "segmentation": {"cdr": 0.52, "disc_area": 2.12, "cup_area": 1.10},
            "detection": [{"label": "Grado 2: ...", "confidence": 0.855}]
        },
        "graph_data": {
            "probability_bars": [
                {"name": "glaucoma", "value": 0.35, "percent": 35.0}
            ],
            "inference_time_bars": [
                {"model": "A", "ms": 45.2},
                {"model": "B", "ms": 32.1},
                {"model": "C", "ms": 120.5}
            ]
        }
    },
    "uploaded_image_preview": "/images/image-uuid-001",
    "disclaimer": "Este sistema es de apoyo clínico..."
}
```

---

#### **PASO 13: Frontend Recibe y Visualiza Resultados**

**Archivo**: `/new_frontend/src/pages/Dashboard.jsx` + `/new_frontend/src/pages/Details.jsx`

```javascript
// new_frontend/src/App.jsx (líneas ~65-90)
const handleAnalyze = async () => {
  setLoading(true);
  
  const response = await fetch(`${API}/analyze-retina/?models=A,B,C`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: form,
  });
  
  const data = await response.json();
  setResults(data);  // Guardar resultados
  setView("result-detail");  // Cambiar a vista de detalles
  setLoading(false);
};
```

**Visualización en Dashboard**:

```jsx
// new_frontend/src/pages/Details.jsx
<div className="grid grid-cols-3 gap-4">
  <Card>
    <h3>CDR (Cup-to-Disc Ratio)</h3>
    <p className="text-2xl">{result.cup_to_disc_ratio.toFixed(2)}</p>
    <p className="text-sm text-gray-600">{result.explanation.cdr_interpretation}</p>
  </Card>
  
  <Card>
    <h3>Riesgo de Glaucoma</h3>
    <ProgressBar value={result.glaucoma_probability * 100} />
    <p className="text-sm">{result.explanation.glaucoma_probability_percent.toFixed(1)}%</p>
  </Card>
  
  <Card>
    <h3>Retinopatía Diabética</h3>
    <Badge>{result.explanation.dr_diagnosis}</Badge>
    <p className="text-sm text-{riskColor}">{result.explanation.recommendation_short}</p>
  </Card>
</div>

{/* Gráficas de postprocesamiento */}
<BarChart data={result.postprocessing.graph_data.probability_bars} />
<BarChart data={result.postprocessing.graph_data.inference_time_bars} />

{/* Imagen uploadada */}
<img src={result.uploaded_image_preview} alt="Preview" />

{/* Trazabilidad */}
<Details>
  <p>ID Inferencia: {result.inference_id}</p>
  <p>Modelos usados: {result.traceability.models_used.join(", ")}</p>
  <p>Tiempos: {JSON.stringify(result.traceability.inference_times_ms)}</p>
</Details>
```

---

#### **PASO 14: Historial y Trazabilidad**

**Archivos**: `/backend/main.py` (endpoint `/history`), `/new_frontend/src/pages/History.jsx`

**Backend - GET /history**:

```python
# backend/main.py
@app.get("/history")
async def history(limit: int = Query(50), offset: int = Query(0)):
    return {"inferences": list_inferences(limit=limit, offset=offset)}
```

**Frontend - Visualizar Historial**:

```jsx
// new_frontend/src/pages/History.jsx
const [history, setHistory] = useState([]);

useEffect(() => {
  const fetchHistory = async () => {
    const r = await fetch(`${API}/history?limit=20`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await r.json();
    setHistory(data.inferences);
  };
  fetchHistory();
}, []);

return (
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Modelos</th>
        <th>Probabilidad Glaucoma</th>
        <th>CDR</th>
        <th>Grado DR</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {history.map(inf => (
        <tr key={inf.inference_id}>
          <td>{new Date(inf.timestamp).toLocaleDateString()}</td>
          <td>{inf.models_used.join(", ")}</td>
          <td>{(inf.result.glaucoma_probability * 100).toFixed(1)}%</td>
          <td>{inf.result.cup_to_disc_ratio.toFixed(2)}</td>
          <td>{inf.result.explanation.dr_grade}</td>
          <td>
            <Button onClick={() => fetchInference(inf.inference_id)}>Ver</Button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
```

---

## 📁 Flujo Técnico por Capas

### **Capa 1: Presentación (Frontend)**

```
/new_frontend/
├── src/
│   ├── App.jsx                          # Componente raíz, enrutamiento
│   ├── main.jsx                         # Entry point
│   ├── index.css                        # Estilos globales
│   ├── context/
│   │   └── AuthContext.jsx              # Contexto de autenticación (token)
│   ├── services/
│   │   └── api.js                       # Funciones fetch para llamadas HTTP
│   ├── pages/
│   │   ├── Landing.jsx                  # Página de bienvenida
│   │   ├── Login.jsx                    # Formulario de login (POST /token)
│   │   ├── Dashboard.jsx                # Panel principal con tabs
│   │   ├── Details.jsx                  # Visualización detallada de resultado
│   │   ├── History.jsx                  # Tabla histórica de análisis
│   │   ├── Demo.jsx                     # Modo demo
│   │   └── Analysis.jsx                 # (Opcional) análisis avanzado
│   ├── components/
│   │   ├── landing/
│   │   │   └── EyeScene.jsx             # Animación 3D de ojo
│   │   ├── ui/
│   │   │   ├── GlassCard.jsx            # Card con efecto vidrio
│   │   │   ├── Sidebar.jsx              # Barra lateral de navegación
│   │   │   └── SwitchToggle.jsx         # Toggle de tema
│   │   ├── InfiniteSlider.jsx           # Carrusel de features
│   │   ├── BentoGrid.jsx                # Grid de características
│   │   ├── LogoCloud.jsx                # Logos de tecnologías
│   │   └── TubelightNavbar.jsx          # Barra de navegación
│   ├── hooks/
│   │   └── useAnalysis.js               # Hook personalizado para análisis
│   └── utils.js                         # Funciones utilidad (formatos, etc)
├── index.html                           # HTML principal
├── vite.config.js                       # Configuración Vite
├── tailwind.config.js                   # Configuración Tailwind CSS
├── postcss.config.js                    # Configuración PostCSS
├── nginx.conf                           # Configuración Nginx (prod)
└── package.json                         # Dependencias Node.js
```

**Flujo en Frontend**:
```
Landing.jsx → Login.jsx → [get token] → Dashboard.jsx
                                       ├─ Upload tab
                                       │  └─ Seleccionar imágenes
                                       │  └─ Seleccionar modelos
                                       │  └─ POST /analyze-retina/
                                       │  └─ Details.jsx [visualizar resultado]
                                       │
                                       └─ History tab
                                          └─ GET /history
                                          └─ Tabla con análisis previos
                                          └─ GET /inferences/{id}
```

---

### **Capa 2: Aplicación (Backend API)**

```
/backend/
├── main.py                              # FastAPI app, endpoints HTTP
│   ├── @app.post("/token")              # Login (OAuth2)
│   ├── @app.post("/analyze-retina/")    # Análisis principal (A+B+C)
│   ├── @app.post("/analyze-densenet/")  # Demo con DenseNet solamente
│   ├── @app.post("/analyze-rd-comparison/") # Comparar modelos de lesiones
│   ├── @app.post("/analyze-agent/")     # Agente cerebro (LLM)
│   ├── @app.get("/history")             # Obtener historial
│   ├── @app.get("/inferences/{id}")     # Obtener inferencia por ID
│   ├── @app.get("/stats")               # Estadísticas globales
│   └── @app.delete("/history")          # Limpiar historial
│
├── config.py                            # Configuración (settings Pydantic)
├── auth.py                              # Autenticación (JWT, OAuth2)
│   ├── Token                            # Modelo de token
│   ├── User                             # Modelo de usuario
│   ├── get_current_user()               # Dependencia FastAPI para validar JWT
│   ├── create_access_token()            # Generar JWT
│   └── verify_password()                # Validar contraseña (hash)
│
├── store.py                             # Persistencia (JSON)
│   ├── save_inference()                 # Guardar resultado en JSON
│   ├── get_inference()                  # Obtener por ID
│   ├── list_inferences()                # Listar con limit/offset
│   ├── save_image_to_disk()             # Guardar imagen
│   ├── get_global_stats()               # Estadísticas
│   └── INFERENCES_FILE = /data/inferences.json
│
├── preprocessing/
│   └── fundus.py                        # Pipeline de preprocesamiento
│       ├── extract_green_channel()      # Canal 1 (verde)
│       ├── apply_clahe()                # CLAHE para realce
│       ├── ben_graham_normalize()       # Normalización Ben Graham
│       └── preprocess_fundus()          # Función principal
│
├── models/
│   ├── segmentation_vnet.py             # Modelo A: Segmentación disco/copa
│   │   └── segment_optic_disc()         # Retorna CDR, disc_area, cup_area
│   ├── glaucoma_classifier.py           # Modelo B: Clasificación glaucoma
│   │   └── predict_glaucoma()           # Retorna probabilidad [0, 1]
│   ├── lesion_detector.py               # Modelo C: Detector de lesiones
│   │   └── detect_hemorrhages()         # Retorna lista de bboxes
│   ├── cdr.py                           # Cálculo de CDR
│   ├── *.h5, *.keras                    # Archivos de modelos entrenados
│   │   ├── densenet_169_aptos_fine.h5
│   │   ├── resnet50_model_fine.h5
│   │   ├── xception_aptos_fine2.h5
│   │   └── mobilenetv3_model_fine.keras
│   └── __init__.py
│
├── ml_manager.py                        # Gestor de modelos (singleton)
│   ├── MLManager                        # Clase que carga y ejecuta modelos
│   │   ├── load_model()                 # Cargar modelo a memoria
│   │   ├── preprocess_image()           # Preprocesar imagen para ML
│   │   ├── predict_single()             # Inferencia 1 imagen
│   │   ├── predict_batch()              # ⚡ Inferencia N imágenes
│   │   ├── _resolve_target_size()       # Resolver tamaño de entrada
│   │   └── class_descriptions           # Mapeo grado → descripción clínica
│   └── ml_manager = MLManager()         # Singleton global
│
├── postprocessing/
│   └── report.py                        # Postprocesamiento de resultados
│       ├── build_report()               # Consolidar resultados en reporte
│       └── graph_data_for_frontend()    # Datos para gráficas
│
├── agents/
│   ├── __init__.py
│   ├── brain_agent.py                   # Agente LLM (Claude)
│   │   ├── AgentAnalysisResponse        # Modelo de respuesta
│   │   └── run()                        # Orquestar análisis automático
│   └── data/
│       └── images/                      # Imágenes para análisis del agente
│
├── __init__.py
└── data/
    ├── images/                          # Imágenes uploadadas
    └── inferences.json                  # Historial de inferencias
```

**Flujo de Inferencia en Backend**:

```
POST /analyze-retina/ [imagen1.jpg, imagen2.jpg, ...]
  ↓
Autenticación (get_current_user via JWT)
  ↓
Para cada imagen:
  ├─ Leer bytes de archivo
  ├─ Guardar en /data/images/
  ├─ Convertir a ndarray con OpenCV
  ├─ PREPROCESAMIENTO:
  │   ├─ extract_green_channel()
  │   ├─ apply_clahe()
  │   └─ ben_graham_normalize()
  │
  ├─ MODELO A (si seleccionado):
  │   └─ segment_optic_disc() → {"cdr": 0.52, "disc_area": 2.1, "cup_area": 1.1}
  │
  ├─ MODELO B (si seleccionado):
  │   └─ predict_glaucoma() → 0.35 (probabilidad)
  │
  ├─ MODELO C (si seleccionado):
  │   ├─ [BATCH] ml_manager.predict_batch([img1, img2, ...])
  │   │   ├─ Preprocesar cada imagen (224x224)
  │   │   ├─ Stack en tensor batch (N, 224, 224, 3)
  │   │   ├─ model.predict(batch_tensor)
  │   │   └─ Post-procesar → [result1, result2, ...]
  │   └─ [FALLBACK] detect_hemorrhages() → lista de bboxes
  │
  ├─ POSTPROCESAMIENTO:
  │   ├─ build_report() → reporte consolidado
  │   └─ graph_data_for_frontend() → datos para gráficas
  │
  ├─ RESULTADO FINAL:
  │   ├─ _build_full_result()
  │   ├─ Generar recomendaciones clínicas
  │   └─ Generar explicación de riesgo
  │
  └─ TRAZABILIDAD:
      ├─ save_inference() → guardar en /data/inferences.json
      ├─ UUID para inference_id
      ├─ Timestamps
      ├─ Tiempos de inferencia por modelo
      └─ Batch ID para agrupar múltiples análisis

  ↓
RESPUESTA HTTP 200 OK:
[
  {
    "success": true,
    "filename": "imagen1.jpg",
    "inference_id": "uuid-123",
    "glaucoma_probability": 0.35,
    "cup_to_disc_ratio": 0.52,
    "lesions_found": [...],
    "recommendation": "...",
    "explanation": {...},
    "postprocessing": {
      "report": {...},
      "graph_data": {...}
    },
    "traceability": {...},
    "uploaded_image_preview": "/images/uuid-123"
  }
]
```

---

### **Capa 3: Modelos de Machine Learning**

```
Backend ML Pipeline (Simplificado):

INPUT: Imagen 512x512 (fundus fotografía)
  ↓
PREPROCESAMIENTO:
  ├─ Extraer canal verde (mejor contraste)
  ├─ CLAHE (realce local)
  └─ Ben Graham (elimina fondo)
  ↓
OUTPUT: Imagen 512x512, 1 canal, uint8 (optimizada)

  ↓
  ├─────────────────────────────────────────────┐
  │                                             │
  ▼                ▼                            ▼
MODELO A        MODELO B                   MODELO C
(V-Net)         (Red simple)           (ResNet50/DenseNet169/Xception/MobileNetV3)
  │                │                            │
  └─────────────┬──┴────────────────────────────┘
                │
Resize 512→512  Resize 512→224    Resize 512→224
  │                │                   │
  ▼                ▼                   ▼
Segmentación    Clasificación      Clasificación
  │                │                   │
  ├─ Máscara      ├─ Probabilidad     ├─ Clase (0-4)
  ├─ Disc         ├─ Score glaucoma   ├─ Confianza
  └─ Cup          └─ [0, 1]           └─ Probabilities [5]

  ↓                ↓                   ↓
  └─────────────┬──────────────────────┘
                │
        POSTPROCESAMIENTO
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      CDR   Riesgo  Grado DR
      │       │       │
      └───────┴───────┘
        REPORTE CONSOLIDADO
              │
         RECOMENDACIÓN CLÍNICA
```

---

## 📂 Archivos Clave Involucrados

### **Por Funcionalidad**

#### **Autenticación & Seguridad**
| Archivo | Función |
|---------|---------|
| `/backend/auth.py` | JWT, OAuth2, hash de contraseñas |
| `/backend/config.py` | Variables de configuración (SECRET_KEY, etc) |
| `/new_frontend/src/context/AuthContext.jsx` | Contexto de auth en frontend |
| `/data/users.json` | Base de datos de usuarios (local) |

#### **Carga & Almacenamiento**
| Archivo | Función |
|---------|---------|
| `/backend/store.py` | Guardar/obtener inferencias, imágenes |
| `/data/inferences.json` | Historial de análisis (trazabilidad) |
| `/data/images/` | Carpeta de imágenes uploadadas |
| `/backend/main.py` (líneas 100-150) | Endpoints de archivo estático |

#### **Preprocesamiento**
| Archivo | Función |
|---------|---------|
| `/backend/preprocessing/fundus.py` | Pipeline: canal verde, CLAHE, Ben Graham |
| `/backend/main.py` (línea 920) | Llamada a preprocess_fundus() |

#### **Inferencia (Modelo A)**
| Archivo | Función |
|---------|---------|
| `/backend/models/segmentation_vnet.py` | Segmentación disco/copa |
| `/backend/models/cdr.py` | Cálculo de CDR (Cup-to-Disc Ratio) |
| `/backend/main.py` (línea 935) | Ejecución: `segment_optic_disc()` |

#### **Inferencia (Modelo B)**
| Archivo | Función |
|---------|---------|
| `/backend/models/glaucoma_classifier.py` | Clasificación glaucoma |
| `/backend/main.py` (línea 942) | Ejecución: `predict_glaucoma()` |

#### **Inferencia (Modelo C)**
| Archivo | Función |
|---------|---------|
| `/backend/models/lesion_detector.py` | Detector de lesiones (fallback) |
| `/backend/ml_manager.py` | Gestor de modelos TensorFlow/Keras |
| `/backend/models/*.h5`, `*.keras` | Archivos de modelos entrenados |
| `/backend/main.py` (línea 900-970) | Orquestación de batching |

#### **Postprocesamiento**
| Archivo | Función |
|---------|---------|
| `/backend/postprocessing/report.py` | Consolidación de resultados |
| `/backend/main.py` (función `_build_full_result`) | Construcción de respuesta final |

#### **API Endpoints**
| Archivo | Líneas | Endpoint |
|---------|--------|----------|
| `/backend/main.py` | ~130 | `POST /token` |
| `/backend/main.py` | ~420 | `GET /history` |
| `/backend/main.py` | ~845 | `POST /analyze-retina/` |
| `/backend/main.py` | ~459 | `POST /analyze-densenet/` |
| `/backend/main.py` | ~628 | `POST /analyze-rd-comparison/` |
| `/backend/main.py` | ~1015 | `POST /analyze-agent/` |

#### **Frontend - Componentes**
| Archivo | Función |
|---------|---------|
| `/new_frontend/src/App.jsx` | Enrutador principal, lógica de flujo |
| `/new_frontend/src/pages/Login.jsx` | Formulario de login |
| `/new_frontend/src/pages/Dashboard.jsx` | Panel principal (tabs: upload, history) |
| `/new_frontend/src/pages/Details.jsx` | Visualización de resultado con gráficas |
| `/new_frontend/src/pages/History.jsx` | Tabla histórica |
| `/new_frontend/src/services/api.js` | Funciones fetch (POST, GET) |

#### **Orquestación (Opcional)**
| Archivo | Función |
|---------|---------|
| `/backend/agents/brain_agent.py` | Agente LLM (Claude API) |
| `/backend/main.py` (línea 1015) | Endpoint `/analyze-agent/` |

---

### **Resumen Visual del Flujo de Archivos**

```
USUARIO (Frontend)
    ↓
[1] new_frontend/src/App.jsx (carga, navega, autenticación)
    ↓
[2] new_frontend/src/pages/Login.jsx (POST /token)
    ↓
backend/auth.py (valida usuario, genera JWT)
    ↓
[3] new_frontend/src/pages/Dashboard.jsx (upload & análisis)
    ↓
[4] new_frontend/src/services/api.js (POST /analyze-retina/)
    ↓
backend/main.py (endpoint @app.post("/analyze-retina/"))
    ├─ auth.py (get_current_user - valida JWT)
    ├─ store.py (save_image_to_disk)
    ├─ preprocessing/fundus.py (preprocess_fundus)
    │
    ├─ [MODELO A] models/segmentation_vnet.py (segment_optic_disc)
    ├─ [MODELO B] models/glaucoma_classifier.py (predict_glaucoma)
    ├─ [MODELO C] ml_manager.py (predict_batch) + models/*.h5
    │
    ├─ postprocessing/report.py (build_report)
    ├─ main.py (_build_full_result)
    └─ store.py (save_inference → /data/inferences.json)
    ↓
backend/main.py (retorna JSON con resultados)
    ↓
[5] new_frontend/src/pages/Details.jsx (visualiza gráficas)
    ↓
[6] new_frontend/src/pages/History.jsx (GET /history + tabla)
    ↓
[7] backend/main.py (/inferences/{id} para detalles)
```

---

## 🎯 Conclusión

**Este sistema implementa un pipeline completo**:

1. **Frontend**: Carga intuitiva + visualización de resultados
2. **Backend**: Orquestación de 3 modelos ML + postprocesamiento
3. **Modelos ML**: Segmentación + Clasificación + Detección
4. **Preprocesamiento**: Optimización de imágenes de retina
5. **Trazabilidad**: Cada análisis se guarda con ID único + timestamps
6. **Seguridad**: Autenticación JWT + almacenamiento local

**Arquitectura escalable**: Soporta batching, múltiples modelos, fallbacks y es fácil agregar nuevos modelos sin cambiar el core.
