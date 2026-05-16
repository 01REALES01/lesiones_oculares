# Manual de desarrollo

## 1. Propósito del documento

Este documento tiene como objetivo servir de guía técnica para comprender, mantener, extender y dar continuidad al desarrollo del proyecto. Está dirigido a futuros equipos de trabajo que necesiten familiarizarse rápidamente con la estructura del repositorio, la organización de la solución, los contenedores, los scripts, las variables de entorno y el flujo de trabajo del sistema.

## 2. Descripción general del proyecto desde la perspectiva de desarrollo

El proyecto es una solución web de apoyo clínico para el tamizaje de retinopatía diabética, optimizada para funcionar en zonas con infraestructura limitada. Técnicamente, se organiza en un frontend reactivo (React + Vite) y un backend de alto rendimiento (FastAPI) que ejecuta modelos de Deep Learning para el procesamiento de imágenes.

### 2.1 Tecnologías principales

- **Frontend:** React, Vite, TailwindCSS.
- **Backend:** FastAPI, Python 3.12+, Uvicorn.
- **IA/ML:** TensorFlow, Keras, OpenCV, scikit-image.
- **Persistencia:** Almacenamiento basado en archivos JSON y sistema de archivos local.
- **Contenedores:** Docker, Docker Compose.
- **Infraestructura adicional:** Anthropic API (Agente inteligente).

### 2.2 Componentes principales

- **Cliente web:** Interfaz interactiva para la carga de imágenes, selección de modelos y visualización de resultados (heatmaps y métricas).
- **Servidor/API:** Orquestador de inferencias que maneja la lógica de preprocesamiento, trazabilidad y comunicación con los modelos.
- **Módulo de Evaluación:** Herramientas para validar el desempeño de los modelos contra datasets de referencia.
- **Servicios externos:** Integración con el Agente Cerebro (Anthropic) para el análisis avanzado de resultados.

## 3. Estructura del repositorio

### 3.1 Árbol general del repositorio

```text
/
├── backend/            # API FastAPI, modelos y lógica de IA
├── new_frontend/       # Aplicación React + Vite (Producción)
├── frontend/           # Versión previa (Legacy)
├── data/               # Persistencia JSON e imágenes procesadas
├── evaluation/         # Scripts de métricas y validación
├── docs/               # Manual de usuario y requerimientos
├── diseno/             # Documentación técnica por áreas
├── README.md           # Guía rápida
├── Informe.md          # Resumen ejecutivo y equipo
├── Instalacion.md      # Guía de despliegue
└── Desarrollo.md       # Este documento
```

### 3.2 Descripción de directorios y archivos relevantes

- **backend/**: Contiene los servicios de inferencia y las rutas de la API.
- **new_frontend/**: Contiene el código fuente de la interfaz moderna.
- **data/**: Almacena `inferences.json` y las subcarpetas para imágenes.
- **evaluation/**: Contiene scripts como `run_evaluation.py` para métricas de IA.
- **docs/**: Archivos Markdown con la documentación funcional.

## 4. Organización de la solución a nivel de código

### 4.1 Organización por módulos o capas

- **Capa de presentación:** Componentes de UI, Hooks de estado (`useAnalysis.js`) y servicios de API en el frontend.
- **Capa de lógica de negocio:** Endpoints de FastAPI y lógica de orquestación en `backend/main.py` y `backend/services/`.
- **Capa de procesamiento:** Módulos especializados en preprocesamiento de imagen y carga de modelos TensorFlow.
- **Capa de persistencia:** Gestión de lectura/escritura de datos JSON en el directorio `data/`.

### 4.2 Relación entre componentes del sistema y código fuente

Cada componente principal se mapea directamente a un directorio. El flujo inicia en `new_frontend/src/`, pasa por los controladores en `backend/main.py` y finaliza en los servicios de inferencia dentro de `backend/services/`.

## 5. Contenedores

### 5.1 Contenedores utilizados

- **Contenedor del backend:** Ejecuta la API FastAPI (Puerto 8000).
- **Contenedor del frontend:** Servidor Nginx que sirve la app compilada (Puerto 80).

### 5.2 Archivos relacionados con contenedores

- `Dockerfile`: Definición de la imagen del backend.
- `new_frontend/Dockerfile`: Definición de la imagen del frontend.
- `docker-compose.yml`: Orquestador que vincula ambos servicios y gestiona volúmenes.

### 5.3 Construcción y ejecución de contenedores

```bash
# Construir imágenes y levantar servicios
docker compose up --build -d
```

### 5.4 Redes, puertos y volúmenes

- **Puertos:** 80 (Frontend) y 8000 (Backend).
- **Volúmenes:** Se mapea `./data` al contenedor del backend para asegurar la persistencia de las inferencias.

### 5.5 Recomendaciones para modificar contenedores

Evite cambiar la base de las imágenes (Python 3.12 y Node 20) sin verificar la compatibilidad de TensorFlow. Siempre reconstruya con `--build` tras modificar el `Dockerfile`.

## 6. Scripts y automatizaciones

### 6.1 Scripts principales

- `npm run dev`: Inicia tanto el backend como el frontend en modo desarrollo (Hot Reload).
- `npm run build`: Genera el build optimizado de la interfaz en `new_frontend/dist/`.

### 6.2 Ubicación de scripts auxiliares

Los scripts de evaluación se encuentran en `evaluation/`, y pueden ejecutarse con `python evaluation/run_evaluation.py`.

### 6.3 Consideraciones para su uso

Asegúrese de tener instalado `requirements.txt` y los módulos de Node antes de ejecutar cualquier script localmente fuera de Docker.

## 7. Variables de entorno

### 7.1 Variables requeridas

- `ANTHROPIC_API_KEY`: Necesaria para las funciones de análisis del agente inteligente.
- `PYTHONPATH`: Debe incluir la raíz del proyecto para la resolución de módulos.

### 7.2 Variables por ambiente

- **Desarrollo:** Se utiliza `uvicorn` con `--reload`.
- **Producción:** Se utiliza la configuración definida en `docker-compose.yml`.

### 7.3 Archivos de configuración

Se recomienda crear un archivo `.env` en la raíz basado en los ejemplos de `docker-compose.yml` para gestionar claves de API.

### 7.4 Manejo seguro de secretos

No suba el archivo `.env` al repositorio. Las claves deben gestionarse como secretos en el entorno de despliegue.

## 8. Flujo de trabajo de desarrollo

### 8.1 Preparación del entorno

1. Clonar el repositorio.
2. Instalar dependencias de Python y Node.
3. Configurar variables de entorno.
4. Ejecutar `npm run dev` para iniciar el desarrollo local.

### 8.2 Desarrollo de nuevas funcionalidades

Se recomienda trabajar en ramas descriptivas. Los cambios en el modelo de datos JSON deben ser retrocompatibles para no invalidar el historial existente en `data/`.

### 8.3 Ejecución de pruebas y validaciones

Use los scripts de `evaluation/` para validar que los cambios en los modelos no degraden las métricas de precisión y F1-score.

### 8.4 Integración de cambios

Los cambios se integran tras verificar el correcto funcionamiento del build de producción con Docker.

## 9. Dependencias y servicios externos

### 9.1 Servicios externos integrados

- **Anthropic API:** Proporciona la inteligencia para el "Agente Cerebro" que interpreta los hallazgos médicos.
- **Modelos de IA:** Archivos `.h5` o `SavedModel` cargados localmente en el backend.

### 9.2 Requisitos de acceso

Es obligatorio contar con una API Key de Anthropic válida para que las funciones de explicabilidad avanzada funcionen.

### 9.3 Consideraciones de desarrollo y pruebas

Para pruebas sin API Key, el sistema cuenta con fallbacks o mocks para evitar errores críticos en la interfaz.

## 10. Convenciones del proyecto

### 10.1 Convenciones de código

- **Python:** Seguimiento estricto de PEP 8.
- **Javascript:** Uso de ES6+, componentes funcionales de React y Hooks personalizados.
- **Nomenclatura:** snake_case para Python, camelCase para Javascript.

### 10.2 Convenciones de repositorio

- Commits descriptivos en español.
- Mantenimiento de la estructura de carpetas definida en el punto 3.

### 10.3 Convenciones de documentación

Toda nueva funcionalidad técnica debe verse reflejada en este `Manual de desarrollo` y en el `Manual de Usuario` si afecta la interfaz.

## 11. Problemas frecuentes y recomendaciones

### 11.1 Problemas frecuentes

- **Error de puertos:** Puerto 80 ocupado por otros servicios.
- **TensorFlow:** Problemas de memoria en Docker (se recomiendan al menos 4GB de RAM).
- **Rutas:** Errores de importación si no se configura correctamente el `PYTHONPATH`.

### 11.2 Deuda técnica conocida

- Migración completa de los estilos legacy a TailwindCSS en todos los componentes.
- Implementación de una base de datos relacional si el volumen de datos JSON crece excesivamente.

### 11.3 Recomendaciones para continuidad

Seguir utilizando Vite para el frontend y mantener la modularidad de los servicios de inferencia en el backend.

## 12. Historial de decisiones técnicas relevantes

- **Elección de FastAPI:** Por su soporte nativo de asincronismo y generación automática de OpenAPI (Swagger).
- **Adopción de Vite:** Para sustituir el setup anterior de React, logrando tiempos de compilación mucho menores.
- **Persistencia JSON:** Decisión estratégica para facilitar el despliegue en zonas rurales sin servidores de DB dedicados.

## 13. Referencias relacionadas

- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Guía de React](https://react.dev/)
- [TensorFlow Core](https://www.tensorflow.org/guide)
- [Instalación del proyecto](Instalacion.md)
- [Informe principal](Informe.md)
