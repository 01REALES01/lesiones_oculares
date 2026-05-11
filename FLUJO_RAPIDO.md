# 📑 Guía Rápida - Flujo del Sistema

## ⚡ TL;DR (Resumen en 2 minutos)

### **¿Qué es el sistema?**
Plataforma web para **análisis de fotografías de fondo de ojo (retinografías)** usando 3 modelos de IA que detectan:
- **Modelo A**: Segmentación disco/copa + CDR
- **Modelo B**: Riesgo de glaucoma
- **Modelo C**: Grado de retinopatía diabética

### **¿Cómo funciona?**
1. Usuario sube imagen → 2. Selecciona modelos → 3. Backend procesa → 4. Retorna resultados + gráficas → 5. Guarda en historial

### **Stack tecnológico**
- **Frontend**: React + Vite + Tailwind
- **Backend**: FastAPI + Python
- **ML**: TensorFlow/Keras (ResNet50, DenseNet169, Xception, MobileNetV3)
- **Almacenamiento**: JSON + Sistema de archivos
- **Deployment**: Docker + Docker Compose

---

## 🎯 Partes Principales (5 capas)

| Capa | Componente | Tecnología | Ubicación |
|------|-----------|-----------|----------|
| **1. Interfaz** | Frontend React | Vite + Tailwind | `/new_frontend/src/` |
| **2. API** | FastAPI REST | Async Python | `/backend/main.py` |
| **3. Procesamiento** | Preprocesamiento | OpenCV + NumPy | `/backend/preprocessing/` |
| **4. IA** | 3 Modelos ML | TensorFlow/Keras | `/backend/models/` + `ml_manager.py` |
| **5. Datos** | Almacenamiento | JSON + Archivos | `/data/inferences.json` |

---

## 🔄 Flujo Usuario → Backend → Respuesta (Paso a Paso)

### **PASO 1: Autenticación** 
```
Usuario → Login Form → POST /token → JWT generado → localStorage
```

### **PASO 2: Upload** 
```
Dashboard → Upload Imagen → Selecciona Modelos A/B/C → Presiona "Analizar"
```

### **PASO 3: Envío al Backend**
```
Frontend → POST /analyze-retina/?models=A,B,C
          con: archivo imagen + JWT token en header
```

### **PASO 4: Lectura & Almacenamiento**
```
Backend → Lee bytes → Guarda en /data/images/{uuid}
```

### **PASO 5: Preprocesamiento** 
```
Imagen Original → Canal Verde → CLAHE → Ben Graham → Imagen Optimizada
```

### **PASO 6: Inferencia (Paralelo)**
```
┌─ Modelo A (sync) → segment_optic_disc() → CDR, áreas
├─ Modelo B (sync) → predict_glaucoma() → Probabilidad
└─ Modelo C (batch) → ml_manager.predict_batch() → Grado DR
```

### **PASO 7: Postprocesamiento**
```
Results → build_report() → graph_data_for_frontend() → _build_full_result()
         ↓
Reporte: etiquetas, probabilidades, gráficas
```

### **PASO 8: Trazabilidad**
```
Resultado → save_inference() → /data/inferences.json
           + ID único
           + Timestamp
           + Modelos usados
           + Tiempos de inferencia
```

### **PASO 9: Respuesta**
```
Backend → JSON con resultado → Frontend
```

### **PASO 10: Visualización**
```
Frontend → Details.jsx → Renderiza:
                        - Gráficas de probabilidades
                        - Tiempos de inferencia
                        - Recomendaciones clínicas
                        - Imagen uploadada
```

### **PASO 11: Historial**
```
Dashboard → History tab → GET /history → Tabla de análisis previos
           → Clic en fila → GET /inferences/{id} → Ver detalles
```

---

## 📂 Archivos Clave por Función

### **Entrada del Usuario (Frontend)**
```
/new_frontend/src/
├── pages/
│   ├── Login.jsx              ← Formulario login
│   ├── Dashboard.jsx          ← Panel principal (upload + history)
│   ├── Details.jsx            ← Visualización de resultado
│   └── History.jsx            ← Tabla histórica
├── services/
│   └── api.js                 ← Funciones fetch para API
└── context/
    └── AuthContext.jsx        ← Contexto JWT
```

### **Procesamiento (Backend)**
```
/backend/
├── main.py                    ← FastAPI app + endpoints
├── auth.py                    ← Validación JWT
├── preprocessing/fundus.py    ← Preprocesamiento
├── models/
│   ├── segmentation_vnet.py   ← Modelo A
│   ├── glaucoma_classifier.py ← Modelo B
│   └── lesion_detector.py     ← Modelo C (fallback)
├── ml_manager.py              ← Gestor de modelos
├── postprocessing/report.py   ← Postprocesamiento
└── store.py                   ← Trazabilidad
```

### **Almacenamiento**
```
/data/
├── inferences.json            ← Historial de análisis
├── images/                    ← Imágenes uploadadas
└── users.json                 ← Base de datos de usuarios
```

---

## 🧠 Los 3 Modelos

### **Modelo A - Segmentación Disco/Copa**
| Aspecto | Detalle |
|--------|---------|
| **Archivo** | `/backend/models/segmentation_vnet.py` |
| **Tecnología** | V-Net (red de segmentación) |
| **Entrada** | Imagen 512×512 |
| **Salida** | CDR (Cup-to-Disc Ratio), disc_area, cup_area |
| **Uso** | Detectar glaucoma por agrandamiento de copa |

### **Modelo B - Clasificación Glaucoma**
| Aspecto | Detalle |
|--------|---------|
| **Archivo** | `/backend/models/glaucoma_classifier.py` |
| **Tecnología** | Red neuronal simple |
| **Entrada** | Imagen 224×224 |
| **Salida** | Probabilidad [0, 1] |
| **Uso** | Predecir riesgo de glaucoma |

### **Modelo C - Detección de Lesiones (DR)**
| Aspecto | Detalle |
|--------|---------|
| **Archivo** | `/backend/ml_manager.py` |
| **Tecnología** | ResNet50 / DenseNet169 / Xception / MobileNetV3 |
| **Entrada** | Imagen 224×224 |
| **Salida** | Grado DR (0-4), confianza, probabilidades por clase |
| **Soporta** | **Batching** (varias imágenes en 1 pase) |
| **Archivo modelos** | `*.h5` o `*.keras` en `/backend/models/` |

---

## 📊 Estructura de Respuesta JSON

```json
{
  "success": true,
  "filename": "retina.jpg",
  "inference_id": "uuid-123",
  
  "glaucoma_probability": 0.35,
  "cup_to_disc_ratio": 0.52,
  "lesions_found": [{"label": "Grado 2", "confidence": 0.85}],
  
  "recommendation": "CDR: 0.52. Glaucoma: 35.0%. DR: Grado 2.",
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
      "labels": ["CDR: 0.52", "Probabilidad glaucoma: 35.0%", ...],
      "probabilities": {"glaucoma": 0.35},
      "segmentation": {"cdr": 0.52, "disc_area": 2.1, "cup_area": 1.1},
      "detection": [{"label": "Grado 2", "confidence": 0.85}]
    },
    "graph_data": {
      "probability_bars": [{"name": "glaucoma", "value": 0.35, "percent": 35.0}],
      "inference_time_bars": [
        {"model": "A", "ms": 45.2},
        {"model": "B", "ms": 32.1},
        {"model": "C", "ms": 120.5}
      ]
    }
  },
  
  "traceability": {
    "inference_id": "uuid-123",
    "models_used": ["A", "B", "C"],
    "inference_times_ms": {"A": 45.2, "B": 32.1, "C": 120.5}
  },
  
  "uploaded_image_preview": "/images/uuid-123",
  "disclaimer": "Este sistema es de apoyo clínico..."
}
```

---

## 🔌 Endpoints API (Resumen)

### **Autenticación**
```
POST /token
  → Input: username, password (OAuth2)
  → Output: access_token, token_type
  → Usada en: Login
```

### **Análisis Principal**
```
POST /analyze-retina/
  → Input: files (multipart), models (A,B,C), token (JWT)
  → Output: Array de resultados (uno por imagen)
  → Usada en: Dashboard upload
```

### **Historial**
```
GET /history?limit=20&offset=0
  → Output: Array de últimas inferencias
  → Usada en: History tab
```

### **Detalles**
```
GET /inferences/{inference_id}
  → Output: Objeto completo de inferencia
  → Usada en: Click en historial para ver detalles
```

### **Alternativas (Demo)**
```
POST /analyze-densenet/    ← Solo DenseNet
POST /analyze-rd-comparison/  ← Comparar modelos
POST /analyze-agent/       ← Agente LLM orquesta
```

---

## 📈 Flujo de Batching (Optimización)

### **Sin Batching (Lento)** ❌
```
Imagen 1 → Modelo → Resultado 1
Imagen 2 → Modelo → Resultado 2  (3 llamadas al GPU)
Imagen 3 → Modelo → Resultado 3
Tiempo total: ~350ms
```

### **Con Batching (Rápido)** ✅
```
[Imagen 1, Imagen 2, Imagen 3] → Stack Tensor (3, 224, 224, 3)
                                 ↓
                            1 llamada al GPU
                                 ↓
                        [Resultado 1, Resultado 2, Resultado 3]
Tiempo total: ~120ms  (3× más rápido)
```

**Implementación**:
```python
# backend/main.py (línea ~910)
dr_batch_results = await loop.run_in_executor(
    None, 
    lambda: ml_manager.predict_batch(
        model_key="lesiones_densenet", 
        images_bytes_list=valid_bytes_list,  # Múltiples imágenes
        model_type="densenet169"
    )
)
```

---

## 🗂️ Estructura de Directorio Importante

```
proyecto/
├── frontend/                       ← Legacy (no usar)
├── new_frontend/                   ← Actual ✅
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       ├── services/api.js
│       └── context/
│
├── backend/
│   ├── main.py                     ← Endpoints API
│   ├── auth.py                     ← JWT
│   ├── preprocessing/fundus.py     ← Preprocesamiento
│   ├── models/
│   │   ├── *.h5                    ← Modelos entrenados
│   │   ├── ml_manager.py           ← Gestor
│   │   ├── segmentation_vnet.py    ← Modelo A
│   │   ├── glaucoma_classifier.py  ← Modelo B
│   │   └── lesion_detector.py      ← Modelo C
│   ├── postprocessing/report.py    ← Postproc
│   ├── store.py                    ← Trazabilidad
│   └── agents/brain_agent.py       ← (Opcional) IA
│
├── data/
│   ├── inferences.json             ← Historial
│   ├── images/                     ← Uploadadas
│   └── users.json                  ← Usuarios
│
├── evaluation/
│   └── run_evaluation.py           ← Métricas
│
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── package.json
├── start.ps1                       ← Script inicio (Windows)
└── start.sh                        ← Script inicio (Linux)
```

---

## 🚀 Ejecución Rápida

### **Primera vez (Setup)**
```bash
cd proyecto
npm install
pip install -r requirements.txt
cd new_frontend && npm install && cd ..
```

### **Cada vez que trabajas**
```bash
npm run dev
# Abre: http://localhost:5173
```

### **O por componentes**
```bash
# Terminal 1: Backend
PYTHONPATH=. uvicorn backend.main:app --reload

# Terminal 2: Frontend
cd new_frontend
npm run dev
```

---

## 📝 Checklist de Flujo (Verificación)

- [ ] **Usuario autenticado**: Login exitoso → JWT en localStorage
- [ ] **Imagen uploaded**: Guardada en `/data/images/{uuid}`
- [ ] **Preprocesamiento**: Canal verde → CLAHE → Ben Graham
- [ ] **Modelo A ejecutado**: CDR, disc_area, cup_area generados
- [ ] **Modelo B ejecutado**: Probabilidad glaucoma [0, 1]
- [ ] **Modelo C ejecutado**: Grado DR [0-4] con confianza
- [ ] **Postprocesamiento**: Reporte consolidado + gráficas
- [ ] **Trazabilidad guardada**: `/data/inferences.json` actualizado
- [ ] **Respuesta retorna**: JSON con todos los campos
- [ ] **Frontend visualiza**: Detalles, gráficas, recomendación
- [ ] **Historial funciona**: GET /history lista análisis
- [ ] **Detalles previos**: GET /inferences/{id} retorna completo

---

## 🔍 Debugging Rápido

### **"Modelo no carga"**
```python
# Verificar en /backend/models/
# Debe existir: densenet_169_aptos_fine.h5 o similar
# Ver ml_manager.py línea ~50 para fallbacks
```

### **"Autenticación falla"**
```python
# Verificar JWT_SECRET en backend/config.py
# Token expira en 30 min (ACCESS_TOKEN_EXPIRE_MINUTES)
# localStorage guarda token
```

### **"Imagen no se guarda"**
```python
# Verificar permisos en /data/images/
# store.py llama a save_image_to_disk()
```

### **"Batching lento"**
```python
# Revisar ml_manager.predict_batch()
# Asegurarse que todas las imágenes se preprocesen
```

---

## 📚 Documentos Completos

Para más detalles, ver:
- **[ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)** - Todos los detalles técnicos
- **[DIAGRAMAS_VISUALES.md](DIAGRAMAS_VISUALES.md)** - Diagramas Mermaid
- **[README.md](README.md)** - Instrucciones de ejecución
- **[docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md)** - Requerimientos del sistema
- **[docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md)** - Manual para usuarios
