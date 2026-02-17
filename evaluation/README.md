# Evaluación de modelos

Este directorio contiene el script para evaluar los modelos con un dataset público o provisto.

## Métricas

- **Modelo A (segmentación):** IoU/Dice si se dispone de máscaras de referencia; tiempo de inferencia.
- **Modelo B (clasificación):** Accuracy, F1, AUC-ROC, sensibilidad, especificidad; tiempo de inferencia.
- **Modelo C (detección):** mAP o precisión/recall por clase si se dispone de anotaciones; tiempo de inferencia.

## Uso

1. Colocar imágenes de fondo de ojo en una carpeta (ej. `evaluation/data/images/`).
2. (Opcional) Archivo CSV con etiquetas para ground truth:
   - Columnas sugeridas: `image_name`, `glaucoma` (0/1) para el clasificador.
   - Con datos reales se calculan accuracy, F1, AUC, sensibilidad, especificidad.
3. Ejecutar:

```bash
cd /ruta/Proyecto_final
PYTHONPATH=. python evaluation/run_evaluation.py --images evaluation/data/images --labels evaluation/data/labels.csv --output evaluation/reports
```

Si no se pasa `--labels`, el script calcula únicamente **tiempos de inferencia** y comparación entre modelos (útil con stubs).

## Salida

- `evaluation_report.json`: métricas y tiempos en JSON.
- `evaluation_report.md`: resumen en Markdown para documentación.
