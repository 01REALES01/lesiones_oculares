# Instalación y Despliegue

## 1. Descripción general de la solución

La plataforma es una solución web de apoyo clínico para el tamizaje de retinopatía diabética, diseñada para integrarse con la infraestructura ROBLE (ROBLE Auth y ROBLE Database).

### 1.1 Lenguajes y tecnologías utilizadas
- **Frontend:** React, Vite, Node.js (v20+), TailwindCSS.
- **Backend:** Python (3.12+), FastAPI, Uvicorn.
- **IA/ML:** TensorFlow, tf_keras, OpenCV, scikit-image.
- **Contenedores:** Docker, Docker Compose.

### 1.2 Componentes de la solución
- **Cliente web:** Interfaz interactiva desplegada generalmente sobre Nginx o el servidor de desarrollo de Vite.
- **API (Backend):** Orquestador de inferencia y validación de tokens JWT contra ROBLE.

## 2. Requisitos previos

### 2.1 Software requerido
Para ejecutar el proyecto, el entorno debe contar con:
- Git
- Docker y Docker Compose (Recomendado para despliegue aislado)
- Python 3.12+ (Si se ejecuta sin contenedores)
- Node.js 20+ (Si se ejecuta sin contenedores)

### 2.2 Variables de entorno
Es fundamental configurar las siguientes variables de entorno para la integración institucional y la funcionalidad de IA:
- `PYTHONPATH`: Debe apuntar a la raíz del proyecto si se ejecuta sin Docker.

## 3. Instalación para ambiente de desarrollo

Existen dos formas principales de ejecutar el proyecto: de manera nativa (sin contenedores) y utilizando Docker (recomendada).

### 3.1 Desarrollo sin contenedores

#### 3.1.1 Clonar el repositorio
```bash
git clone https://github.com/01REALES01/lesiones_oculares.git
cd lesiones_oculares
```

#### 3.1.2 Instalar dependencias
Se debe iniciar el archivo **start**. Este instala todo lo necesario para la aplicación, tanto en el backend como en el frontend. Se inicia de esta forma:

**En Linux/Mac:**
```bash
./start.sh
```

**En Windows:**
```cmd
.\start.ps1
```

#### 3.1.3 Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto (basándote en `.env.example` si existe) y cualquier configuración de ROBLE necesaria.

#### 3.1.4 Iniciar la aplicación
Puedes iniciar ambos servicios simultáneamente si has configurado el script en tu `package.json` raíz, o correr el script de inicio proporcionado:

**En Linux/Mac:**
```bash
./start.sh
```

**En Windows:**
```cmd
.\start.ps1
```

De forma manual:
- Backend: `uvicorn backend.main:app` (nota: evitar `--reload` ya que causa inestabilidad con la carga de múltiples modelos)
- Frontend: `cd new_frontend && npm run dev`

### 3.2 Desarrollo con contenedores (Recomendado)

#### 3.2.1 Construcción y ejecución del entorno
Utilice Docker Compose para levantar todos los servicios configurados.
```bash
docker compose up --build -d
```

#### 3.2.2 Servicios disponibles
- **Frontend:** http://localhost:80 (o el puerto configurado en Nginx/Docker).
- **Backend API:** http://localhost:8000
- **Documentación API (Swagger):** http://localhost:8000/docs

#### 3.2.3 Apagado del entorno
Para detener los contenedores sin perder los volúmenes de datos:
```bash
docker compose down
```

## 4. Despliegue (Producción)

### 4.1 Arquitectura de despliegue
En producción, se recomienda el uso de contenedores para garantizar la reproducibilidad y evitar problemas de compatibilidad con librerías de Machine Learning (TensorFlow).

### 4.2 Proceso de actualización
1. Hacer pull de los últimos cambios (`git pull origin main`).
2. Reconstruir las imágenes si hay cambios en las dependencias (`docker compose build --no-cache`).
3. Reiniciar los servicios (`docker compose up -d`).

## 5. Solución de problemas frecuentes

- **Error de puertos ocupados:** Verifique que no haya servicios ejecutándose en el puerto 80 o 8000. Use `docker ps` o `lsof -i :8000`.
- **Problemas de memoria con TensorFlow en Docker:** Asegúrese de asignar al menos 4GB de RAM a Docker Desktop / Engine.
- **Errores de importación en Python:** Valide que el servidor se esté ejecutando desde el directorio raíz y que `PYTHONPATH` esté configurado.
- **Modelos IA no encontrados:** Verifique que los archivos `.h5` o `.keras` existan en `backend/models/`.
- **Error de conexión o crash del backend:** Si usó `--reload` al iniciar, intente sin esa bandera. El `--reload` puede causar fallos al recargar los modelos de TensorFlow.

## 6. Mantenimiento y actualización

- El historial de inferencias se maneja vía ROBLE Database. Los datos generados de manera local (`data/inferences.json`) son solo para desarrollo.
- Para cambios en el Frontend, el comando `npm run build` generará los assets optimizados listos para ser servidos por el servidor web (Nginx).

## 7. Referencias relacionadas
- [Manual de Desarrollo](Desarrollo.md)
- [Informe Principal del Proyecto](Informe.md)
