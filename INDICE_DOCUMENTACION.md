# 📚 Índice Completo - Documentación del Sistema

## 🎯 Propósito
Este proyecto es una **Plataforma de Análisis de Retinografías** que utiliza 3 modelos de IA para detectar lesiones oculares (glaucoma y retinopatía diabética). La documentación a continuación describe el flujo completo desde el frontend hasta el backend.

---

## 📖 Documentación Disponible

### **1. 🚀 [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md)** - START HERE ⭐
- **Mejor para**: Introducción rápida (2-5 minutos)
- **Contenido**:
  - TL;DR (resumen en 2 minutos)
  - Partes principales (5 capas)
  - Flujo usuario → backend → respuesta (11 pasos)
  - Estructura de respuesta JSON
  - Endpoints API (resumen)
  - Optimización de batching
  - Checklist rápido
  - Debugging rápido

---

### **2. 🏗️ [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)** - DETAILED ⭐⭐⭐
- **Mejor para**: Entendimiento profundo (20-30 minutos)
- **Contenido**:
  - Descripción general detallada
  - 8 partes principales del sistema
  - Matriz de tecnologías por componente
  - Flujo detallado de los 11 pasos con código
    - Paso 1: Autenticación JWT
    - Paso 2: Upload de imagen
    - Paso 3: Lectura de imagen
    - Paso 4: Almacenamiento temporal
    - Paso 5: Preprocesamiento (canal verde, CLAHE, Ben Graham)
    - Paso 6: Carga de modelos (startup)
    - Paso 7: Batching Modelo C
    - Paso 8: Inferencia Modelos A y B
    - Paso 9: Postprocesamiento
    - Paso 10: Construcción resultado
    - Paso 11: Trazabilidad
    - Paso 12: Respuesta al frontend
    - Paso 13: Visualización
    - Paso 14: Historial
  - Flujo técnico por capas (Presentación, Aplicación, ML)
  - Matriz de archivos clave por funcionalidad
  - Resumen visual del flujo de archivos

---

### **3. 📊 [DIAGRAMAS_VISUALES.md](DIAGRAMAS_VISUALES.md)** - VISUAL
- **Mejor para**: Visualización de arquitectura (5-10 minutos)
- **Contenido**:
  - 11 diagramas Mermaid:
    1. Diagrama de arquitectura general
    2. Flujo de inferencia detallado (secuencia)
    3. Flujo de preprocesamiento
    4. Arquitectura de ML (3 modelos)
    5. Flujo de batching
    6. Estructura de datos JSON
    7. Flujo de autenticación
    8. Flujo de historial
    9. Flujo completo del sistema (macro)
    10. Tabla de endpoints API
    11. Stack tecnológico visual

---

### **4. 📝 [DIAGRAMA_ASCII.md](DIAGRAMA_ASCII.md)** - TEXT BASED
- **Mejor para**: Análisis paso-a-paso (10-15 minutos)
- **Contenido**:
  - Visión general simplificada (ASCII art)
  - Flujo de análisis detallado (11 pasos con boxes)
  - Ciclo completo con timeline
  - Componentes y responsabilidades
  - Matriz de integración frontend-backend
  - Flujo de datos JSON
  - Matriz de modelos
  - Checklist de verificación

---

## 🎓 Flujos de Lectura Recomendados

### **Para Principiante (20 minutos)**
```
1. Leer: FLUJO_RAPIDO.md (TL;DR + Partes principales)
2. Ver: DIAGRAMA_ASCII.md (Visión general)
3. Resultado: Entiende qué hace el sistema
```

### **Para Desarrollador (45 minutos)**
```
1. Leer: FLUJO_RAPIDO.md (Completo)
2. Leer: ARQUITECTURA_COMPLETA.md (Capas + flujo técnico)
3. Ver: DIAGRAMAS_VISUALES.md (Diagramas 1-5)
4. Ver: DIAGRAMA_ASCII.md (Pasos detallados)
5. Resultado: Puedes modificar/debuggear el sistema
```

### **Para Arquitecto/Lead (90 minutos)**
```
1. Leer: ARQUITECTURA_COMPLETA.md (Todo)
2. Ver: DIAGRAMAS_VISUALES.md (Todos)
3. Ver: DIAGRAMA_ASCII.md (Completo)
4. Revisar: Archivos en /backend/ y /new_frontend/src/
5. Resultado: Visión 360° del proyecto
```

---

## 🔑 Conceptos Clave

### **Autenticación**
- **Tecnología**: JWT (JSON Web Token)
- **Ubicación**: `/backend/auth.py`
- **Flujo**: Login → POST /token → JWT generado → localStorage → Bearer header
- **Expiración**: 30 minutos

### **Preprocesamiento**
- **Archivo**: `/backend/preprocessing/fundus.py`
- **Pasos**:
  1. Extraer canal verde (mejor contraste)
  2. CLAHE (realce local adaptativo)
  3. Normalización Ben Graham (elimina fondo)
- **Resultado**: Imagen optimizada para ML

### **Modelos ML**
- **Modelo A**: Segmentación disco/copa → CDR
- **Modelo B**: Clasificación glaucoma → Probabilidad [0,1]
- **Modelo C**: Clasificación DR → Grado [0-4] (ResNet50, DenseNet169, etc.)
- **Optimización**: Batching para Modelo C (3× más rápido)

### **Postprocesamiento**
- **Archivo**: `/backend/postprocessing/report.py`
- **Salida**: Reporte consolidado + gráficas para frontend

### **Trazabilidad**
- **Archivo**: `/backend/store.py`
- **Guardado**: `/data/inferences.json`
- **Datos**: ID, timestamp, modelos usados, tiempos, resultados

---

## 📂 Estructura de Carpetas Relevante

```
proyecto/
├── ARQUITECTURA_COMPLETA.md      ← Detalles técnicos
├── DIAGRAMAS_VISUALES.md         ← Diagramas Mermaid
├── FLUJO_RAPIDO.md               ← Guía rápida
├── DIAGRAMA_ASCII.md             ← ASCII art detallado
├── README.md                      ← Instrucciones ejecución
│
├── new_frontend/src/
│   ├── App.jsx                   ← Router + lógica
│   ├── pages/
│   │   ├── Login.jsx             ← Autenticación
│   │   ├── Dashboard.jsx         ← Panel principal
│   │   ├── Details.jsx           ← Visualización resultado
│   │   └── History.jsx           ← Historial análisis
│   ├── services/api.js           ← HTTP client
│   └── context/AuthContext.jsx   ← JWT context
│
├── backend/
│   ├── main.py                   ← FastAPI app + endpoints
│   ├── auth.py                   ← JWT validation
│   ├── preprocessing/fundus.py   ← Preprocesamiento
│   ├── models/
│   │   ├── segmentation_vnet.py  ← Modelo A
│   │   ├── glaucoma_classifier.py ← Modelo B
│   │   ├── lesion_detector.py    ← Modelo C
│   │   ├── ml_manager.py         ← Gestor modelos
│   │   └── *.h5, *.keras         ← Modelos entrenados
│   ├── postprocessing/report.py  ← Postprocesamiento
│   └── store.py                  ← Trazabilidad
│
└── data/
    ├── inferences.json           ← Historial
    ├── images/                   ← Imágenes uploadadas
    └── users.json                ← Base de datos usuarios
```

---

## 🔄 Flujo Básico (30 segundos)

```
Usuario Login
    ↓
Upload Imagen + Modelos A/B/C
    ↓
POST /analyze-retina/
    ↓
Backend: Preprocesa → Ejecuta modelos → Postprocesa
    ↓
Guarda trazabilidad + Retorna JSON
    ↓
Frontend: Visualiza resultados + gráficas
    ↓
Historial disponible
```

---

## 🛠️ Tecnologías Clave

| Capa | Stack |
|------|-------|
| **Frontend** | React 18 + Vite + Tailwind CSS + Framer Motion |
| **Backend** | FastAPI + Python 3.10+ + asyncio |
| **ML** | TensorFlow/Keras + NumPy + OpenCV + Scikit-learn |
| **Almacenamiento** | JSON + Sistema de archivos |
| **Autenticación** | JWT (OAuth2) |
| **Deployment** | Docker + Docker Compose |

---

## ❓ Preguntas Frecuentes

### **¿Cuál es el tiempo total de análisis?**
- Preprocesamiento: ~50ms
- Modelo A: ~45ms
- Modelo B: ~32ms
- Modelo C (batch): ~120ms para 3 imágenes
- Postprocesamiento: ~10ms
- **Total: ~250ms para análisis completo**

### **¿Cómo funciona el batching?**
- Modelo C (clasificación DR) soporta batching
- En lugar de procesar 1 imagen a la vez, procesa N imágenes en 1 pase al GPU
- **Resultado**: 3× más rápido

### **¿Dónde se guardan los resultados?**
- **Historial**: `/data/inferences.json` (JSON con todos los análisis)
- **Imágenes**: `/data/images/{uuid}.png` (las imágenes uploadadas)
- **Usuarios**: `/data/users.json` (base de datos de usuarios)

### **¿Cómo es la autenticación?**
- Usuario ingresa username/password
- Backend genera JWT token (exp: 30 min)
- Frontend guarda token en localStorage
- Token incluido en header `Authorization: Bearer {JWT}`

### **¿Qué modelos hay disponibles?**
- **Modelo A**: V-Net (segmentación disco/copa)
- **Modelo B**: Red simple (clasificación glaucoma)
- **Modelo C**: ResNet50, DenseNet169, Xception, MobileNetV3 (clasificación DR)

### **¿Puedo agregar más modelos?**
- Sí, modificar `/backend/models/` y `/backend/ml_manager.py`
- El sistema está diseñado para ser extensible

---

## 📞 Soporte & Debugging

### **Modelo no carga**
- Ver `/backend/models/` - verificar que exista archivo .h5 o .keras
- Revisar `ml_manager.py` línea ~50 para fallbacks
- Los modelos se cargan en startup (función `lifespan`)

### **Autenticación falla**
- Verificar JWT_SECRET en `backend/config.py`
- Token expira en 30 min (modificable en `ACCESS_TOKEN_EXPIRE_MINUTES`)
- localStorage debe tener token válido

### **Imagen no se guarda**
- Verificar permisos en `/data/images/`
- `store.py` genera UUID para cada imagen
- Ruta: `/data/images/{uuid}.png`

### **Batching lento**
- Revisar `ml_manager.predict_batch()` en `ml_manager.py`
- Asegurar que todas las imágenes se preprocesen
- TensorFlow/Keras debe estar compilado con soporte GPU

---

## 🎯 Siguientes Pasos

1. **Entender el flujo**: Leer [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md)
2. **Ver arquitectura**: Revisar [ARQUITECTURA_COMPLETA.md](ARQUITECTURA_COMPLETA.md)
3. **Visualizar**: Estudiar [DIAGRAMAS_VISUALES.md](DIAGRAMAS_VISUALES.md)
4. **Detalles**: Analizar [DIAGRAMA_ASCII.md](DIAGRAMA_ASCII.md)
5. **Código**: Revisar archivos en `/backend/` y `/new_frontend/src/`
6. **Ejecutar**: Ver instrucciones en [README.md](README.md)
7. **Debuggear**: Usar checklist en [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md#checklist-de-flujo-verificación)

---

## 📝 Notas Importantes

- ⚠️ **Disclaimer**: Este sistema es de apoyo clínico/educativo, NO diagnóstico definitivo
- 🔒 **Seguridad**: JWT garantiza autenticación; almacenamiento local en producción usar base de datos
- ⚡ **Optimización**: Batching de Modelo C es crítico para performance
- 🐳 **Deployment**: Usar Docker/Docker Compose para consistencia en entornos

---

## 📚 Referencias Rápidas

- **API REST**: Leer sección "Endpoints API" en [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md#endpoints-api-resumen)
- **JSON Response**: Ver estructura en [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md#-estructura-de-respuesta-json)
- **Modelos**: Matriz en [DIAGRAMA_ASCII.md](DIAGRAMA_ASCII.md#matriz-de-modelos)
- **Componentes**: Checklist en [DIAGRAMA_ASCII.md](DIAGRAMA_ASCII.md#checklist-rápido)

---

## 🎉 ¡Listo!

Tienes documentación completa del flujo del sistema. Comienza con [FLUJO_RAPIDO.md](FLUJO_RAPIDO.md) y profundiza según necesites.

**¿Preguntas o feedback?** Revisar sección [Preguntas Frecuentes](#preguntas-frecuentes).
