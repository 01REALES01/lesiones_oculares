# Informe 2  
[LINK DEL INFORME 2](https://uninorte-my.sharepoint.com/:w:/g/personal/asilverad_uninorte_edu_co/IQACBqu_HGi0TKPcYib8wW2NAc2VBapSLh7U5ahr4t3zWSw?e=ngtLgD)

# Plataforma para la Identificación y Clasificación de Lesiones en Imágenes de Fondo de Ojo con IA

## Descripción general

En este segundo informe se presenta el desarrollo técnico de la plataforma, pasando de la idea conceptual a una solución funcional. El sistema permite analizar retinografías utilizando múltiples modelos de inteligencia artificial en paralelo, con el objetivo de apoyar al personal médico en la detección de retinopatía diabética.

La plataforma está pensada como una herramienta de apoyo clínico y educativo, no como un sistema de diagnóstico automático.

---

## Objetivo del informe

El propósito de este informe es mostrar **cómo está construida la solución**, incluyendo:

- Diseño de arquitectura
- Pipeline de procesamiento
- Integración de modelos de IA
- Implementación del sistema
- Plan de pruebas

---

## Arquitectura del sistema

La solución se diseñó como una plataforma web modular con separación clara de responsabilidades.

### Componentes principales

- **Frontend (React + Vite)**
  - Carga de imágenes
  - Selección de modelos
  - Visualización comparativa de resultados

- **Backend (FastAPI)**
  - Orquesta la ejecución de modelos
  - Gestiona trazabilidad
  - Expone API REST

- **Motor de IA**
  - Tres modelos enfocados en retinopatía diabética
  - Ejecución en paralelo

- **Postprocesamiento**
  - Normaliza resultados
  - Genera métricas y datos interpretables

- **Persistencia**
  - Guarda historial de inferencias
  - No almacena imágenes clínicas de forma permanente

---

## Pipeline del sistema

El flujo del sistema es el siguiente:

1. El usuario carga una retinografía
2. Selecciona uno o varios modelos
3. El backend recibe la solicitud
4. Se realiza preprocesamiento de la imagen
5. Se ejecutan los modelos de IA
6. Se consolidan los resultados
7. Se almacena la trazabilidad
8. Se muestran los resultados en el frontend

---

## Modelos de Inteligencia Artificial

El sistema utiliza tres modelos que trabajan sobre la misma patología:

- Clasificación de retinopatía diabética (presencia/ausencia)
- Estimación de severidad
- Comparación de resultados entre modelos

Esto permite una **validación cruzada**, aumentando la confianza en los resultados.

---

## Tecnologías utilizadas

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- JWT (Python-JOSE, Passlib)

### Procesamiento e IA
- NumPy
- OpenCV
- Pillow
- Scikit-image
- TensorFlow
- Scikit-learn

### Frontend
- React
- Vite
- Axios
- Tailwind CSS
- Framer Motion

### Despliegue
- Docker
- Docker Compose

---

## Componentes del sistema

### 1. Autenticación
- Login con JWT
- Protección de endpoints
- Manejo de sesión en frontend

### 2. Carga y análisis
- Subida de imágenes
- Selección de modelos
- Orquestación de inferencia

### 3. Preprocesamiento e inferencia
- Normalización de imágenes
- Ejecución de modelos
- Manejo de fallos

### 4. Postprocesamiento
- Generación de resultados comparativos
- Métricas por modelo

### 5. Visualización
- Dashboard de análisis
- Resultados detallados
- Historial de inferencias

### 6. Trazabilidad
- ID único por inferencia
- Timestamp
- Modelos utilizados
- Tiempos de ejecución

---

## Integraciones

- Frontend ↔ Backend mediante HTTP
- Autenticación con JWT
- Persistencia de resultados
- Integración de modelos IA en entorno local
- Despliegue reproducible con Docker

---

## Decisiones de diseño

- Uso de un backend orquestador único
- Comparación de modelos en una sola ejecución
- Enfoque en una sola patología (retinopatía diabética)
- Arquitectura modular para facilitar escalabilidad
- No almacenamiento de imágenes clínicas

---

## Plan de pruebas

### Pruebas por componentes

- Carga de imágenes válidas e inválidas
- Procesamiento en backend
- Ejecución de modelos
- Visualización de resultados
- Registro en historial
- Login de usuarios

### Pruebas de integración

- Comunicación frontend-backend
- Manejo de errores
- Flujo completo del sistema

### Pruebas de usabilidad

- Facilidad de uso
- Claridad de resultados
- Tiempo de respuesta
- Comprensión por parte del usuario

---

## Limitaciones

- Modelos pueden estar en fase inicial o simulación
- No es un sistema certificado clínicamente
- No reemplaza el diagnóstico médico
- Uso limitado a entorno académico o de prueba

---

## Próximos pasos

- Integración de modelos entrenados reales
- Mejora en explicabilidad (heatmaps)
- Optimización de tiempos de inferencia
- Escalamiento de infraestructura
- Integración con sistemas externos (futuro)

---

## Nota importante

Este sistema está diseñado como una herramienta de apoyo para el personal médico.  
No debe ser utilizado como reemplazo del diagnóstico clínico profesional.


