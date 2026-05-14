# 🎯 Diagrama ASCII - Flujo Completo del Sistema

## Visión General Simplificada

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  PLATAFORMA DE ANÁLISIS DE RETINOGRAFÍAS               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                        ┌─────────────────────────┐
                        │   USUARIO / CLIENTE     │
                        │   (Navegador Web)       │
                        └────────────┬────────────┘
                                     │
                    ┌────────────────▼──────────────────┐
                    │   FRONTEND (React + Vite)         │
                    │   /new_frontend/src/              │
                    │                                   │
                    │  • App.jsx (Router)               │
                    │  • Login.jsx (Autenticación)      │
                    │  • Dashboard.jsx (Panel)          │
                    │  • Details.jsx (Resultados)       │
                    │  • History.jsx (Historial)        │
                    └────────────────┬──────────────────┘
                                     │
                         HTTP/JSON   │   JWT Token
                                     │
                    ┌────────────────▼──────────────────┐
                    │  BACKEND (FastAPI + Python)       │
                    │  /backend/main.py                 │
                    │                                   │
                    │  Endpoints:                       │
                    │  • POST /token (Auth)             │
                    │  • POST /analyze-retina/ (Main)   │
                    │  • GET /history (Historial)       │
                    │  • GET /inferences/{id} (Detalles)│
                    └────────────────┬──────────────────┘
                                     │
                    ┌────────────────▼──────────────────┐
                    │  CAPAS DE PROCESAMIENTO           │
                    │                                   │
                    │  1. store.py (Almacenamiento)     │
                    │     → /data/images/               │
                    │                                   │
                    │  2. fundus.py (Preprocesamiento)  │
                    │     → Canal verde → CLAHE         │
                    │     → Ben Graham                  │
                    │                                   │
                    │  3. models/ (Machine Learning)    │
                    │     → ml_manager.py               │
                    │     → segmentation_vnet.py (A)    │
                    │     → glaucoma_classifier.py (B)  │
                    │     → lesion_detector.py (C)      │
                    │                                   │
                    │  4. report.py (Postprocesamiento) │
                    │     → Consolidación               │
                    │     → Gráficas                    │
                    │                                   │
                    │  5. store.py (Trazabilidad)       │
                    │     → /data/inferences.json       │
                    └────────────────┬──────────────────┘
                                     │
                         JSON        │
                                     │
                    ┌────────────────▼──────────────────┐
                    │   RESPUESTA AL FRONTEND           │
                    │   {                               │
                    │    "inference_id": "uuid",        │
                    │    "glaucoma_probability": 0.35,  │
                    │    "cup_to_disc_ratio": 0.52,     │
                    │    "recommendation": "...",       │
                    │    "postprocessing": {...}        │
                    │   }                               │
                    └────────────────┬──────────────────┘
                                     │
                         HTTP/JSON   │
                                     │
                    ┌────────────────▼──────────────────┐
                    │   VISUALIZACIÓN (Details.jsx)     │
                    │                                   │
                    │  • Gráficas de probabilidades     │
                    │  • Tiempos de inferencia          │
                    │  • Recomendaciones clínicas       │
                    │  • Imagen uploadada               │
                    └────────────────────────────────────┘
```

---

## Flujo de Análisis Detallado (Paso 1-11)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 1: AUTENTICACIÓN                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (Login.jsx)                                                    │
│     ↓                                                                    │
│  Usuario ingresa username/password                                       │
│     ↓                                                                    │
│  POST /token {username, password}                                        │
│     ↓                                                                    │
│  Backend (auth.py)                                                       │
│     ├─ Busca usuario en /data/users.json                                │
│     ├─ Valida contraseña (bcrypt hash)                                  │
│     └─ Genera JWT token (exp: 30 min)                                   │
│     ↓                                                                    │
│  Retorna: {access_token, token_type: "bearer"}                          │
│     ↓                                                                    │
│  Frontend                                                                │
│     └─ localStorage.setItem("token", access_token)                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 2: UPLOAD DE IMAGEN                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (Dashboard.jsx)                                                │
│     ↓                                                                    │
│  Usuario carga imagen(s):                                                │
│     ├─ files = [imagen1.jpg, imagen2.jpg, ...]                          │
│     └─ models = "A,B,C" (selecciona cuáles ejecutar)                    │
│     ↓                                                                    │
│  (Preparar FormData con archivos)                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 3: ENVÍO AL BACKEND                                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (services/api.js)                                              │
│     ↓                                                                    │
│  POST /analyze-retina/                                                   │
│     ├─ Body: FormData(files)                                            │
│     ├─ Query: models=A,B,C                                              │
│     └─ Headers: Authorization: "Bearer {JWT}"                           │
│     ↓                                                                    │
│  Backend (main.py)                                                       │
│     └─ @app.post("/analyze-retina/")                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 4: AUTENTICACIÓN & LECTURA DE IMAGEN                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py)                                                       │
│     ↓                                                                    │
│  Validar JWT (auth.py: get_current_user)                                │
│     ├─ Decodificar JWT                                                  │
│     ├─ Verificar expiración                                             │
│     └─ ✅ Token válido → continuar                                       │
│     ↓                                                                    │
│  Para cada archivo UploadFile:                                           │
│     ├─ Leer bytes: cv2.imdecode()                                       │
│     ├─ Validar que es imagen: img is not None                           │
│     └─ numpy.ndarray shape: (altura, ancho, 3) BGR                      │
│     ↓                                                                    │
│  Guardar a disco (store.py)                                              │
│     ├─ image_id = uuid.uuid4()                                          │
│     ├─ Ruta: /data/images/{image_id}.png                                │
│     └─ file_size registrado para estadísticas                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 5: PREPROCESAMIENTO (fundus.py)                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py)                                                       │
│     ↓                                                                    │
│  image = preprocess_fundus(img)                                          │
│                                                                          │
│  Pasos:                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ 1. ASEGURAR ESCALA DE GRISES                               │        │
│  │    if img.ndim == 3:                                        │        │
│  │        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)         │        │
│  │    Resultado: Matriz (h, w) uint8                           │        │
│  │                                                             │        │
│  │ 2. EXTRAER CANAL VERDE (mejor contraste para fundus)       │        │
│  │    out = img[:, :, 1]  # En BGRnúmero=Verde/1              │        │
│  │    Resultado: Canal verde realzado                         │        │
│  │                                                             │        │
│  │ 3. APLICAR CLAHE (Contrast Limited Adaptive Histogram Eq.) │        │
│  │    clahe = cv2.createCLAHE(clipLimit=2.0,                 │        │
│  │                             tileGridSize=(8, 8))          │        │
│  │    out = clahe.apply(out)                                  │        │
│  │    Resultado: Bordes del disco óptico resaltados           │        │
│  │                                                             │        │
│  │ 4. NORMALIZACIÓN BEN GRAHAM (elimina fondo)               │        │
│  │    blurred = cv2.GaussianBlur(out, (0,0), sigma=30)       │        │
│  │    out = out - blurred                                     │        │
│  │    out = np.clip(out, 0, 255)                              │        │
│  │    Resultado: Estructuras resaltadas (vasos, lesiones)    │        │
│  └─────────────────────────────────────────────────────────────┘        │
│     ↓                                                                    │
│  Retorna: Imagen preprocesada (1 canal, uint8)                          │
│     Ready for ML models!                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 6A: MODELO A - SEGMENTACIÓN DISCO/COPA                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py)                                                       │
│     ↓                                                                    │
│  if "A" in models_used:                                                  │
│     ↓                                                                    │
│  t0 = time.perf_counter()                                                │
│     ↓                                                                    │
│  seg = segment_optic_disc(image)  # segmentation_vnet.py                │
│     ├─ Detecta borde del disco óptico (círculo)                         │
│     ├─ Detecta excavación de la copa                                    │
│     └─ Calcula CDR = cup_diameter / disc_diameter                       │
│     ↓                                                                    │
│  Retorna: {                                                              │
│      "cdr": 0.52,          # Cup-to-Disc Ratio [0, 1]                  │
│      "disc_area": 2.1,     # Área del disco                             │
│      "cup_area": 1.1       # Área de la copa                            │
│  }                                                                       │
│     ↓                                                                    │
│  inference_times_ms["A"] = (perf_counter() - t0) * 1000                 │
│     └─ Típico: 40-50ms                                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 6B: MODELO B - CLASIFICACIÓN GLAUCOMA                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py)                                                       │
│     ↓                                                                    │
│  if "B" in models_used:                                                  │
│     ↓                                                                    │
│  t0 = time.perf_counter()                                                │
│     ↓                                                                    │
│  prob = predict_glaucoma(image)  # glaucoma_classifier.py               │
│     ├─ Red neuronal simple                                              │
│     ├─ Input: imagen 224×224                                            │
│     └─ Output: probabilidad float [0, 1]                                │
│     ↓                                                                    │
│  Retorna: 0.35  (35% probabilidad de glaucoma)                          │
│     ↓                                                                    │
│  inference_times_ms["B"] = (perf_counter() - t0) * 1000                 │
│     └─ Típico: 30-40ms                                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 6C: MODELO C - DETECCIÓN DE LESIONES (BATCH)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py)                                                       │
│     ↓                                                                    │
│  if "C" in models_used:                                                  │
│     ↓                                                                    │
│  ⚡ BATCHING (si múltiples imágenes):                                     │
│     ├─ Recolectar bytes de TODAS las imágenes                           │
│     ├─ valid_bytes_list = [img1_bytes, img2_bytes, ...]                 │
│     └─ Pasar a ml_manager.predict_batch()                               │
│        ↓                                                                │
│        ml_manager.predict_batch():                                      │
│        ├─ Para cada imagen:                                             │
│        │   ├─ Leer con PIL.Image.open()                                 │
│        │   ├─ Redimensionar a 224×224                                   │
│        │   ├─ Convertir a float32                                       │
│        │   ├─ Aplicar preprocess_input() según modelo                   │
│        │   │  (ResNet50: resnet_v2.preprocess_input)                    │
│        │   │  (DenseNet: densenet.preprocess_input)                    │
│        │   │  (etc.)                                                    │
│        │   └─ Agregar a lista preprocessed_images                       │
│        ├─ np.stack(preprocessed_images)                                 │
│        │   └─ Tensor shape: (N, 224, 224, 3)  [batch]                  │
│        ├─ model.predict(batch_tensor, verbose=0)  ⚡ UNA LLAMADA        │
│        │   └─ GPU procesa N imágenes en 1 pase                          │
│        └─ Retorna predictions shape: (N, 5)  [5 clases DR]              │
│        ↓                                                                │
│        Post-procesar:                                                   │
│        ├─ predicted_class = argmax(predictions[i])                      │
│        ├─ confidence = max(predictions[i]) * 100                        │
│        ├─ diagnosis = class_descriptions[predicted_class]               │
│        └─ Generar clinical_description                                  │
│        ↓                                                                │
│     Retorna: [                                                           │
│        {                                                                │
│          "model_used": "lesiones_resnet50",                             │
│          "predicted_class": 2,  # Grado DR [0-4]                       │
│          "confidence_percent": 85.5,                                    │
│          "diagnosis": "Retinopatía Diabética Grado 2",                 │
│          "clinical_description": "Microaneurismas, exudados...",        │
│          "raw_probabilities": [0.02, 0.08, 0.85, 0.04, 0.01]           │
│        },                                                               │
│        ...  # Resultados para cada imagen                              │
│     ]                                                                    │
│                                                                          │
│  inference_times_ms["C"] = (perf_counter() - t0) * 1000 / len(files)    │
│     └─ Batching: ~120ms para 3 imágenes (~40ms c/u)                    │
│     └─ Sin batching: ~350ms para 3 imágenes                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 7: POSTPROCESAMIENTO (report.py)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (postprocessing/report.py)                                      │
│     ↓                                                                    │
│  report = build_report(model_a, model_b, model_c, models_used)          │
│     ├─ Consolidar etiquetas legibles                                    │
│     │   ├─ "CDR (Cup-to-Disc Ratio): 0.52"                              │
│     │   ├─ "Probabilidad glaucoma: 35.0%"                               │
│     │   └─ "Retinopatía: Grado 2: Moderada"                             │
│     ├─ Probabilidades en dict                                           │
│     │   └─ {"glaucoma": 0.35}                                           │
│     ├─ Segmentación summary                                             │
│     │   └─ {"cdr": 0.52, "disc_area": 2.1, "cup_area": 1.1}            │
│     └─ Detección summary                                                │
│         └─ [{"label": "Grado 2: Moderada", "confidence": 0.855}]       │
│     ↓                                                                    │
│  graph_data = graph_data_for_frontend(probabilities, times)             │
│     ├─ probability_bars: [{"name": "glaucoma", "value": 0.35}]         │
│     └─ inference_time_bars: [                                           │
│         {"model": "A", "ms": 45.2},                                     │
│         {"model": "B", "ms": 32.1},                                     │
│         {"model": "C", "ms": 120.5}                                     │
│     ]                                                                    │
│     ↓                                                                    │
│  result = _build_full_result(results_by_model, models_used, times, img) │
│     ├─ Determinar risk_level: high/medium/low                           │
│     ├─ Generar recommendation_short según risk                          │
│     ├─ Armar explanation detallada                                      │
│     ├─ Combinar report + graph_data                                     │
│     └─ Retorna JSON estruturado con TODOS los datos                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 8: TRAZABILIDAD (store.py)                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (store.py)                                                      │
│     ↓                                                                    │
│  inference_id = save_inference(                                          │
│      models_used=["A", "B", "C"],                                        │
│      inference_times_ms={"A": 45.2, "B": 32.1, "C": 120.5},            │
│      result={...},                                                       │
│      image_size=(768, 768),                                              │
│      batch_id="batch-uuid-123"                                           │
│  )                                                                       │
│     ↓                                                                    │
│  Internamente:                                                           │
│     ├─ inference_id = uuid.uuid4()  # nuevo ID único                    │
│     ├─ timestamp = datetime.now(timezone.utc).isoformat()               │
│     ├─ Construir record completo                                        │
│     ├─ Leer JSON actual de /data/inferences.json                        │
│     ├─ Agregar nuevo record                                             │
│     ├─ Guardar JSON actualizado                                         │
│     └─ Retorna: "abc-123-def-456"                                        │
│     ↓                                                                    │
│  Archivo /data/inferences.json actualizado:                              │
│  [                                                                       │
│    {                                                                    │
│      "inference_id": "abc-123-def-456",                                 │
│      "timestamp": "2026-05-09T14:30:45.123456+00:00",                   │
│      "batch_id": "batch-xyz-789",                                       │
│      "models_used": ["A", "B", "C"],                                    │
│      "inference_times_ms": {"A": 45.2, "B": 32.1, "C": 120.5},         │
│      "result": {...},                                                    │
│      "image_size": [768, 768]                                            │
│    }                                                                     │
│  ]                                                                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 9: CONSTRUCCIÓN DE RESPUESTA FINAL                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Backend (main.py, final_results.append(...))                            │
│     ↓                                                                    │
│  result["inference_id"] = inference_id                                   │
│  result["filename"] = file.filename                                      │
│  result["success"] = True                                                │
│  result["traceability"] = { ... }                                        │
│  result["uploaded_image_preview"] = f"/images/{image_id}"                │
│     ↓                                                                    │
│  final_results = [result1, result2, ...]                                 │
│     ↓                                                                    │
│  return final_results  # HTTP 200 OK                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 10: RECEPCIÓN EN FRONTEND                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (services/api.js)                                              │
│     ↓                                                                    │
│  const response = await fetch(...);                                      │
│  const data = await response.json();  // Parsear JSON                    │
│     ↓                                                                    │
│  Frontend (App.jsx)                                                      │
│     ├─ setResults(data)                                                  │
│     └─ setView("result-detail")  // Cambiar a visualización              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PASO 11: VISUALIZACIÓN EN FRONTEND (Details.jsx)                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (pages/Details.jsx)                                            │
│     ↓                                                                    │
│  Renderizar:                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ ┌────────────┬────────────┬────────────┐                        │   │
│  │ │ CDR: 0.52  │ Glaucoma   │ Retinopatía│                        │   │
│  │ │            │ 35%        │ Grado 2    │                        │   │
│  │ │ Seguimiento│ Medio Riesgo│ Moderada  │                        │   │
│  │ └────────────┴────────────┴────────────┘                        │   │
│  │                                                                  │   │
│  │  📊 GRÁFICAS:                                                   │   │
│  │  Probabilidades    │ Tiempos de Inferencia                     │   │
│  │  ████░░░ 35%       │ Modelo A: 45.2ms                          │   │
│  │                    │ Modelo B: 32.1ms                          │   │
│  │                    │ Modelo C: 120.5ms                         │   │
│  │                                                                  │   │
│  │  🖼️ IMAGEN UPLOADADA:                                           │   │
│  │  [Miniatura de retinografía]                                    │   │
│  │                                                                  │   │
│  │  💡 RECOMENDACIÓN:                                              │   │
│  │  "CDR: 0.52. Glaucoma: 35.0%. DR Grado: 2.                    │   │
│  │   Evaluación oftalmológica recomendada."                        │   │
│  │                                                                  │   │
│  │  🔍 TRAZABILIDAD:                                               │   │
│  │  ID: abc-123-def-456                                            │   │
│  │  Modelos: A, B, C                                               │   │
│  │  Timestamp: 2026-05-09 14:30:45                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Usuario puede:                                                         │
│  ├─ Ver gráficas interactivas                                           │
│  ├─ Descargar resultados (opcional)                                     │
│  ├─ Volver al dashboard                                                 │
│  └─ Ver historial de análisis previos                                   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Ciclo Completo - Vista Temporal

```
TIMELINE:

[T0]  Usuario abre navegador
        ↓
[T0+10ms]  Cargar Landing.jsx
        ↓
[T0+1s]  Ingresa credenciales
        ↓
[T0+2s]  Frontend: POST /token
        ↓
[T0+2.1s]  Backend: Validar usuario/contraseña
        ↓
[T0+2.2s]  Backend: Generar JWT
        ↓
[T0+2.3s]  Frontend: Guardar token en localStorage
        ↓
[T0+2.5s]  Redirigir a Dashboard.jsx
        ↓
[T0+3s]  Usuario sube imagen(s) + selecciona modelos
        ↓
[T0+4s]  Frontend: POST /analyze-retina/
        ↓
[T0+4.1s]  Backend: Validar JWT ✅
        ↓
[T0+4.2s]  Backend: Guardar imagen a /data/images/
        ↓
[T0+4.3s]  Backend: Preprocesar (canal verde, CLAHE, Ben Graham)
        ↓
[T0+4.4s]  Backend: Ejecutar Modelo A (45ms)
        ↓
[T0+4.45s]  Backend: Ejecutar Modelo B (32ms)
        ↓
[T0+4.48s]  Backend: Ejecutar Modelo C Batch (120ms)
        ↓
[T0+4.6s]  Backend: Postprocesar (consolidar reportes)
        ↓
[T0+4.65s]  Backend: Guardar trazabilidad en JSON
        ↓
[T0+4.67s]  Backend: Retorna JSON con resultados
        ↓
[T0+4.68s]  Frontend: Recibe respuesta
        ↓
[T0+4.69s]  Frontend: Renderiza Details.jsx con gráficas
        ↓
[T0+4.7s]  ✅ Usuario ve resultados + recomendación
        ↓
[T0+5s]  Usuario navega a History.jsx
        ↓
[T0+5.1s]  Frontend: GET /history?limit=20
        ↓
[T0+5.2s]  Backend: Lee /data/inferences.json
        ↓
[T0+5.3s]  Backend: Retorna últimas 20 inferencias
        ↓
[T0+5.4s]  Frontend: Renderiza tabla histórica
        ↓
[T0+5.5s]  Usuario ve análisis previos

TIEMPO TOTAL: ~5.5 segundos desde login hasta ver resultados
```

---

## Componentes Clave y Sus Responsabilidades

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENTE                     │ RESPONSABILIDAD                 │
├─────────────────────────────────────────────────────────────────┤
│ new_frontend/src/App.jsx        │ Router, lógica de flujo, tabs   │
│ new_frontend/src/pages/         │ Páginas: Login, Dashboard, etc  │
│ new_frontend/src/services/api.js│ HTTP client (fetch)             │
│ new_frontend/src/context/       │ Contexto JWT                    │
│                                 │                                 │
│ backend/main.py                 │ FastAPI app, endpoints, flujo   │
│ backend/auth.py                 │ JWT, OAuth2, contraseñas        │
│ backend/preprocessing/fundus.py │ Preprocesamiento (3 pasos)      │
│ backend/models/                 │ Módulos de modelos ML           │
│ backend/ml_manager.py           │ Cargador y ejecutor de modelos  │
│ backend/postprocessing/report.py│ Consolidación de resultados     │
│ backend/store.py                │ JSON, almacenamiento, trazabilidad
│ backend/agents/brain_agent.py   │ (Opcional) Agente LLM           │
│                                 │                                 │
│ /data/inferences.json           │ Base de datos historial         │
│ /data/images/                   │ Almacén de imágenes             │
│ /data/users.json                │ Base de datos de usuarios        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Matriz de Integración

```
FRONTEND                  ↔ BACKEND

App.jsx
    ├─ POST /token       ← → auth.py (JWT)
    ├─ POST /analyze-retina/  ← → main.py (pipeline)
    ├─ GET /history      ← → store.py (historial)
    └─ GET /inferences/{id}  ← → store.py (detalles)

Dashboard.jsx
    └─ Maneja estado: files, models, results

Details.jsx
    ├─ Visualiza: glaucoma_probability, cup_to_disc_ratio
    ├─ Renderiza gráficas: probability_bars, inference_time_bars
    ├─ Muestra recomendación: explanation, recommendation_short
    └─ Imagen preview: uploaded_image_preview

History.jsx
    ├─ Tabla con últimos análisis
    └─ Detalle de análisis al hacer clic
```

---

## Flujo de Datos (JSON)

```
REQUEST:
{
  method: "POST",
  url: "/analyze-retina/?models=A,B,C",
  headers: { Authorization: "Bearer {JWT}" },
  body: FormData (archivos imagen)
}

↓

RESPONSE (HTTP 200):
[
  {
    success: true,
    filename: "retina1.jpg",
    inference_id: "uuid-123",
    glaucoma_probability: 0.35,
    cup_to_disc_ratio: 0.52,
    lesions_found: [...],
    recommendation: "...",
    explanation: { ... },
    postprocessing: {
      report: { ... },
      graph_data: { ... }
    },
    traceability: { ... },
    uploaded_image_preview: "/images/uuid-123"
  }
]

↓

ALMACENADO EN:
/data/inferences.json
{
  inference_id: "uuid-123",
  timestamp: "2026-05-09...",
  result: { ... },
  inference_times_ms: { ... }
}
```

---

## Matriz de Modelos

```
MODELO A (Segmentación)
├─ Input: imagen 512×512 (escala grises)
├─ Arquitectura: V-Net
├─ Output: CDR [0, 1], disc_area, cup_area
├─ Tiempo: ~45ms
└─ Archivo: segmentation_vnet.py

MODELO B (Glaucoma)
├─ Input: imagen 224×224 (escala grises)
├─ Arquitectura: Red simple
├─ Output: probabilidad [0, 1]
├─ Tiempo: ~32ms
└─ Archivo: glaucoma_classifier.py

MODELO C (Retinopatía Diabética)
├─ Input: imagen 224×224 (RGB)
├─ Arquitecturas: ResNet50, DenseNet169, Xception, MobileNetV3
├─ Output: clase [0-4], confianza, probabilities[5]
├─ Tiempo: ~120ms/imagen (batch)
├─ Soporta: Batching para múltiples imágenes
├─ Archivos modelos: *.h5, *.keras
└─ Archivo gestor: ml_manager.py
```

---

## Checklist Rápido

```
✅ Usuario autenticado (JWT en header)
✅ Imagen uploadada (guardada en /data/images/)
✅ Preprocesamiento completo (verde+CLAHE+Ben)
✅ Modelo A ejecutado (CDR generado)
✅ Modelo B ejecutado (probabilidad generada)
✅ Modelo C ejecutado (grado DR generado)
✅ Postprocesamiento (reporte consolidado)
✅ Trazabilidad guardada (JSON actualizado)
✅ Respuesta JSON completa (campos correctos)
✅ Frontend visualiza (Details.jsx renderizado)
✅ Gráficas visibles (probabilities + times)
✅ Historial actualizado (GET /history funciona)
```
