# Requerimientos funcionales y no funcionales

## 1. Requerimientos funcionales

| Id | Descripción | Prioridad |
|----|-------------|-----------|
| RF01 | Carga de imagen de retinografía (formatos habituales: jpg, png) | Alta |
| RF02 | Selección de uno o más modelos de IA (A: segmentación, B: clasificación, C: detección) antes de ejecutar el análisis | Alta |
| RF03 | Ejecución de inferencia solo con los modelos seleccionados | Alta |
| RF04 | Visualización de resultados: CDR, probabilidad de glaucoma, número de lesiones, recomendación y mapa de relevancia (explicabilidad) | Alta |
| RF05 | Historial básico: listado de análisis recientes con posibilidad de ver detalle de cada uno | Alta |
| RF06 | Trazabilidad: cada inferencia con ID único, timestamp, modelos usados y tiempos de ejecución | Alta |
| RF07 | Postprocesamiento: etiquetas legibles, probabilidades y datos para gráficas (barras de probabilidad y tiempos) | Media |
| RF08 | Evaluación con dataset: script que calcule métricas (accuracy, F1, AUC, sensibilidad, especificidad) y tiempos de inferencia; comparación entre modelos | Media |
| RF09 | Gestión de usuarios (opcional): registro/login para asociar análisis a usuario | Baja |

## 2. Requerimientos no funcionales

### 2.1 Usabilidad

- Interfaz web clara: pasos identificables (cargar imagen → elegir modelos → analizar → ver resultados).
- Resultados presentados de forma ordenada: métricas, gráficas y texto de recomendación.
- Aviso visible de que nuestro sistema es de apoyo clínico/educativo y no diagnóstico.

### 2.2 Rendimiento

- Tiempos de inferencia razonables; posibilidad de usar GPU (ONNX/Triton) para reducir latencia.
- Historial acotado en memoria (p. ej. últimos N registros) para no degradar el servicio.

### 2.3 Seguridad y privacidad

- Cifrado en tránsito (HTTPS) en despliegue real.
- Control de acceso al API (y a datos sensibles) según política del centro.
- Retención mínima de imágenes/inferencias; opción de no persistir imágenes y solo guardar resultados agregados o anonimizados.
- No certificación como dispositivo médico en nuestro alcance actual.

### 2.4 Mantenibilidad y despliegue

- Código modular (preprocesamiento, modelos, postprocesamiento, almacenamiento).
- Prototipo desplegable en local o nube (Docker/docker-compose).
- Documentación técnica y manual de usuario (este documento y `MANUAL_USUARIO.md`).

## 3. Riesgos y mitigaciones (resumen)

| Riesgo | Mitigación |
|--------|-------------|
| Calidad variable de imágenes | Implementamos preprocesamiento (canal verde, CLAHE, Ben Graham); documentamos limitaciones. |
| Desbalance/sesgos en datos | Realizamos evaluación con dataset público o provisto; reportamos métricas en script de evaluación. |
| Explicabilidad limitada | Incluimos heatmap/mapa de relevancia en resultados; nuestro objetivo es Grad-CAM con modelo real. |
| Latencia y recursos | Ofrecemos opción GPU; batch en evaluación; historial acotado. |
| Privacidad de imágenes médicas | Implementamos cifrado, control de acceso, retención mínima, anonimización donde aplique. |
| Uso indebido como diagnóstico | Disclaimers en API e interfaz; enfoque “apoyo/tamizaje”; trazabilidad. |
| Alcance excesivo | Definimos claramente salidas por modelo (A: CDR; B: probabilidad; C: bboxes) y lesiones consideradas. |
