#!/usr/bin/env python3
"""
Evaluación de los tres modelos con un dataset (carpeta de imágenes + opcional CSV de etiquetas).

Métricas: accuracy, F1, AUC, sensibilidad, especificidad (clasificador B si hay labels);
tiempos de inferencia para A, B, C. Comparación entre modelos.
Sin etiquetas: solo reporta tiempos de inferencia (útil con stubs).
"""

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Añadir raíz del proyecto
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import cv2

from backend.preprocessing.fundus import preprocess_fundus
from backend.models.segmentation_vnet import segment_optic_disc
from backend.models.glaucoma_classifier import predict_glaucoma
from backend.models.lesion_detector import detect_hemorrhages


def load_labels(csv_path: Path) -> Dict[str, int]:
    """Carga CSV con columnas image_name, glaucoma (0/1). Devuelve dict {nombre_archivo: 0|1}."""
    labels = {}
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("image_name", row.get("filename", "")).strip()
            gl = row.get("glaucoma", "0").strip()
            labels[name] = 1 if gl in ("1", "true", "True", "yes") else 0
    return labels


def run_evaluation(
    images_dir: Path,
    labels_path: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    limit: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Ejecuta los 3 modelos sobre las imágenes y calcula métricas.
    """
    image_files = list(images_dir.glob("*.jpg")) + list(images_dir.glob("*.png")) + list(images_dir.glob("*.jpeg"))
    if limit:
        image_files = image_files[:limit]

    labels = {}
    if labels_path and labels_path.exists():
        labels = load_labels(labels_path)

    times_a: List[float] = []
    times_b: List[float] = []
    times_c: List[float] = []
    preds_b: List[float] = []
    labeled_pairs: List[tuple] = []  # (pred, label) solo para imágenes con etiqueta

    import time as _time
    for im_path in image_files:
        img = cv2.imread(str(im_path))
        if img is None:
            continue
        image = preprocess_fundus(img)
        name = im_path.name

        # Modelo A
        t0 = _time.perf_counter()
        segment_optic_disc(image)
        times_a.append((_time.perf_counter() - t0) * 1000)

        # Modelo B
        t0 = _time.perf_counter()
        prob = predict_glaucoma(image)
        times_b.append((_time.perf_counter() - t0) * 1000)
        preds_b.append(prob)

        # Modelo C
        t0 = _time.perf_counter()
        detect_hemorrhages(image)
        times_c.append((_time.perf_counter() - t0) * 1000)

        if name in labels:
            labeled_pairs.append((prob, labels[name]))

    # Métricas de tiempo (siempre)
    def stats(ms_list: List[float]) -> Dict[str, float]:
        if not ms_list:
            return {"mean_ms": 0, "min_ms": 0, "max_ms": 0}
        arr = np.array(ms_list)
        return {"mean_ms": float(np.mean(arr)), "min_ms": float(np.min(arr)), "max_ms": float(np.max(arr))}

    report = {
        "n_images": len(image_files),
        "inference_times": {
            "model_A_segmentation": stats(times_a),
            "model_B_classifier": stats(times_b),
            "model_C_detector": stats(times_c),
        },
        "comparison": {
            "A_mean_ms": stats(times_a)["mean_ms"],
            "B_mean_ms": stats(times_b)["mean_ms"],
            "C_mean_ms": stats(times_c)["mean_ms"],
        },
    }

    # Métricas de clasificación (B) si hay suficientes imágenes etiquetadas
    if len(labeled_pairs) >= 2:
        preds_arr = np.array([p[0] for p in labeled_pairs])
        y_true_arr = np.array([p[1] for p in labeled_pairs])
        y_pred_binary = (preds_arr >= 0.5).astype(int)
        tp = int(np.sum((y_pred_binary == 1) & (y_true_arr == 1)))
        tn = int(np.sum((y_pred_binary == 0) & (y_true_arr == 0)))
        fp = int(np.sum((y_pred_binary == 1) & (y_true_arr == 0)))
        fn = int(np.sum((y_pred_binary == 0) & (y_true_arr == 1)))
        accuracy = (tp + tn) / len(y_true_arr) if len(y_true_arr) else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        sensitivity = recall
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        try:
            from sklearn.metrics import roc_auc_score
            auc = float(roc_auc_score(y_true_arr, preds_arr))
        except Exception:
            auc = 0.0
        report["model_B_metrics"] = {
            "accuracy": round(accuracy, 4),
            "f1": round(f1, 4),
            "auc": round(auc, 4),
            "sensitivity": round(sensitivity, 4),
            "specificity": round(specificity, 4),
        }
        report["n_with_labels"] = len(y_true_arr)
    else:
        report["model_B_metrics"] = None
        report["n_with_labels"] = len(labeled_pairs)

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / "evaluation_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        md = _report_to_md(report)
        with open(output_dir / "evaluation_report.md", "w", encoding="utf-8") as f:
            f.write(md)

    return report


def _report_to_md(report: Dict[str, Any]) -> str:
    lines = ["# Informe de evaluación de modelos", ""]
    lines.append(f"Número de imágenes: {report['n_images']}")
    lines.append("")
    lines.append("## Tiempos de inferencia (ms)")
    lines.append("| Modelo | Media | Mín | Máx |")
    lines.append("|--------|-------|-----|-----|")
    for name, key in [("A (segmentación)", "model_A_segmentation"), ("B (clasificación)", "model_B_classifier"), ("C (detección)", "model_C_detector")]:
        s = report["inference_times"][key]
        lines.append(f"| {name} | {s['mean_ms']:.1f} | {s['min_ms']:.1f} | {s['max_ms']:.1f} |")
    if report.get("model_B_metrics"):
        lines.append("")
        lines.append("## Métricas del clasificador (B) — con ground truth")
        m = report["model_B_metrics"]
        lines.append(f"- Accuracy: {m['accuracy']}")
        lines.append(f"- F1: {m['f1']}")
        lines.append(f"- AUC: {m['auc']}")
        lines.append(f"- Sensibilidad: {m['sensitivity']}")
        lines.append(f"- Especificidad: {m['specificity']}")
        lines.append(f"- N con etiquetas: {report['n_with_labels']}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Evaluación de modelos A, B, C")
    parser.add_argument("--images", type=Path, required=True, help="Carpeta de imágenes")
    parser.add_argument("--labels", type=Path, default=None, help="CSV con columnas image_name, glaucoma (0/1)")
    parser.add_argument("--output", type=Path, default=None, help="Carpeta de salida (JSON + MD)")
    parser.add_argument("--limit", type=int, default=None, help="Máximo de imágenes a procesar")
    args = parser.parse_args()
    report = run_evaluation(args.images, args.labels, args.output, args.limit)
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
