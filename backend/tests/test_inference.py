"""
Sección 10.1.3 — Módulo de inferencia (3 modelos en paralelo).

Criterio del Informe:
- Los tres modelos retornan resultados sin fallos.
- Tiempo aceptable: <2–3 s para 10 fotos con un solo modelo,
  <8–10 s para 10 fotos con los 3 modelos.

Las pruebas usan imágenes sintéticas pequeñas en CPU: el umbral
se relaja respecto al informe para no ser un test "flaky", pero se
sigue verificando la cota superior (tiempo wall-clock razonable).
"""

from __future__ import annotations

import time

import pytest

from backend.tests.conftest import multi_image_uploads


# Umbrales generosos para CPU local / CI (el informe es objetivo de prod)
TIMEOUT_10_UN_MODELO_S = 30.0
TIMEOUT_10_TRES_MODELOS_S = 60.0


class TestInferenciaModelos:
    def test_un_modelo_imagen_valida(self, client, dummy_image_bytes):
        files = multi_image_uploads(1, dummy_image_bytes)
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=files)
        assert r.status_code == 200
        data = r.json()
        assert data[0]["success"] is True
        # Tiempos reportados por el backend
        assert "traceability" in data[0]
        assert "inference_times_ms" in data[0]["traceability"]
        assert "B" in data[0]["traceability"]["inference_times_ms"]

    def test_tres_modelos_en_paralelo(self, client, dummy_image_bytes):
        files = multi_image_uploads(1, dummy_image_bytes)
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is True
        times = data[0]["traceability"]["inference_times_ms"]
        # Los tres modelos deben haber registrado un tiempo
        assert set(times.keys()) == {"A", "B", "C"}
        for k, v in times.items():
            assert v >= 0, f"Tiempo inválido para {k}: {v}"

    def test_modelos_devuelven_estructura_comparable(self, client, dummy_image_bytes):
        """Permite comparar salidas entre modelos (criterio 10.1.3)."""
        files = multi_image_uploads(1, dummy_image_bytes)
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=files)
        result = r.json()[0]
        # Cada modelo aporta una sección verificable
        assert "glaucoma_probability" in result   # modelo B
        assert "cup_to_disc_ratio" in result       # modelo A
        assert "lesions_found" in result           # modelo C


class TestTiemposDeInferencia:
    @pytest.mark.slow
    def test_tiempo_10_imagenes_un_modelo(self, client, dummy_image_bytes):
        files = multi_image_uploads(10, dummy_image_bytes)
        t0 = time.perf_counter()
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=files)
        elapsed = time.perf_counter() - t0
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 10
        assert all(item["success"] for item in data)
        assert elapsed < TIMEOUT_10_UN_MODELO_S, (
            f"10 imágenes con 1 modelo tardaron {elapsed:.2f}s (límite {TIMEOUT_10_UN_MODELO_S}s)"
        )

    @pytest.mark.slow
    def test_tiempo_10_imagenes_tres_modelos(self, client, dummy_image_bytes):
        files = multi_image_uploads(10, dummy_image_bytes)
        t0 = time.perf_counter()
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=files)
        elapsed = time.perf_counter() - t0
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 10
        assert all(item["success"] for item in data)
        assert elapsed < TIMEOUT_10_TRES_MODELOS_S, (
            f"10 imágenes con 3 modelos tardaron {elapsed:.2f}s (límite {TIMEOUT_10_TRES_MODELOS_S}s)"
        )
