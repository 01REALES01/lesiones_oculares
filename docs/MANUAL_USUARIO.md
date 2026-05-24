# Manual de usuario — Plataforma de análisis de retinografías

## 1. Propósito

Nuestra plataforma permite **cargar retinografías** (imágenes de fondo de ojo), **ejecutar inferencias concurrentes** utilizando tres modelos de IA (DenseNet169, MobileNetV3, Xception) y **obtener resultados** con métricas, trazabilidad e interpretación orientada a **apoyo clínico y educativo para Retinopatía Diabética (RD)**. **No sustituye el diagnóstico médico.**

## 2. Requisitos previos

- Navegador web actualizado (Chrome, Firefox, Edge, Safari).
- Si se ejecuta en local: backend en `http://127.0.0.1:8000` y frontend en `http://127.0.0.1:5173` (o según indicaciones del instalador).
- Si se usa el prototipo en Docker: acceder a la URL indicada (por ejemplo `http://localhost`).

## 3. Uso de la interfaz web

### 3.1 Cargar imagen

1. En la sección **“1. Cargar imagen”**, haz clic en la zona de carga o arrastra un archivo.
2. Formatos admitidos: **JPG, PNG** (imagen de retinografía/fondo de ojo).
3. La zona se marcará en verde cuando haya un archivo seleccionado.

### 3.2 Seleccionar modelos

En **“2. Seleccionar modelos”** la plataforma ejecuta por defecto una inferencia en paralelo utilizando:

- **DenseNet169**
- **MobileNetV3**
- **Xception**

El objetivo es contrastar el diagnóstico (Grados de RD según APTOS) entre las tres arquitecturas para una mayor confiabilidad.

### 3.3 Analizar

1. Pulsa el botón **“Analizar”**.
2. Espera a que termine el proceso (aparecerá “Analizando…”).
3. Los resultados se mostrarán debajo en **“Resultados”**.

### 3.4 Interpretar resultados

- **ID de inferencia:** identifica de forma única el análisis (trazabilidad).
- **Tiempos (ms):** tiempo de ejecución de cada modelo usado.
- **Diagnóstico RD:** Ausencia o presencia de Retinopatía Diabética.
- **Grado de severidad:** Clasificación según la escala APTOS (0 al 4).
- **Confianza:** Porcentaje de certeza del modelo para esa predicción.
- **Gráficas:** barras de probabilidades y de tiempos de inferencia.
- **Recomendación:** texto resumen (orientativo).

Al final se muestra el **aviso legal**: el sistema es de apoyo, no constituye diagnóstico.

### 3.5 Historial

- En **“Historial de análisis”** se listan los análisis recientes.
- Puedes pulsar **“Ver detalle”** en cualquier fila para cargar de nuevo ese resultado completo.

## 4. Uso de la API (desarrolladores)

- **Documentación interactiva:** `http://<servidor>:8000/docs`
- **Analizar imagen:** `POST /analyze-retina/`  
  - Cuerpo: `multipart/form-data` con campo `file` (imagen).  
  - Parámetros: `models=densenet169,mobilenetv3,xception` (opcional; por defecto los tres).  
  - Respuesta: JSON con resultados, `inference_id`, `traceability`, `postprocessing`, `disclaimer`.
- **Historial:** `GET /history?limit=50&offset=0`
- **Detalle de una inferencia:** `GET /inferences/{inference_id}`

## 5. Limitaciones y avisos

- La calidad de la imagen (iluminación, enfoque, artefactos) puede afectar los resultados.
- Los modelos son de apoyo; la decisión clínica debe tomarla un profesional.
- No usar en entornos clínicos reales sin supervisión y aprobación ética según corresponda.

## 6. Solución de problemas

- **“Error al leer la imagen”:** comprueba que el archivo sea una imagen válida (jpg/png) y no esté corrupto.
- **“Error de conexión”:** verifica que el backend y los modelos estén operativos.
- Si el historial no aparece: verifica que el backend esté en marcha y que la URL del API sea la correcta (en local, el frontend usa `/api` como proxy al backend).
