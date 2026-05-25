"""
Sección 10.2 — Pruebas de integración.

Cubre:
- 10.2.1 frontend → backend (HTTP request/response correctos).
- 10.2.2 manejo de errores (timeout/ROBLE caído sin colapso del sistema).
- 10.2.3 integración con almacenamiento (guardado automático tras análisis).
- 10.2.4 flujo completo: usuario carga → backend recibe → modelos procesan
  → resultados se muestran → quedan en historial.
"""

from __future__ import annotations

import re

import httpx
import pytest
import respx

from backend.store import clear_history, get_inference
from backend.tests.conftest import multi_image_uploads


ROBLE_READ_URL = re.compile(
    r"https://roble-api\.openlab\.uninorte\.edu\.co/database/.+/read"
)


@pytest.fixture(autouse=True)
def _reset_store():
    clear_history(delete_images=False)
    yield
    clear_history(delete_images=False)


class TestFrontendBackendHTTP:
    def test_request_multipart_y_respuesta_json(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=[jpg_upload])
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/json")
        assert isinstance(r.json(), list)

    def test_endpoints_basicos_disponibles(self, client):
        assert client.get("/health").status_code == 200
        assert client.get("/").status_code == 200


class TestManejoErroresIntegracion:
    @respx.mock
    def test_roble_caido_no_tumba_history(self, client):
        """Si ROBLE devuelve 500, el sistema responde con fallback local."""
        respx.get(ROBLE_READ_URL).mock(
            return_value=httpx.Response(500, json={"error": "down"})
        )
        r = client.get("/history")
        assert r.status_code == 200
        assert r.json()["source"] == "local_fallback"

    @respx.mock
    def test_roble_timeout_no_tumba_history(self, client):
        respx.get(ROBLE_READ_URL).mock(
            side_effect=httpx.ReadTimeout("timeout simulado")
        )
        r = client.get("/history")
        assert r.status_code == 200
        assert "inferences" in r.json()


class TestFlujoCompletoSistema:
    @respx.mock
    def test_carga_procesa_resultados_y_queda_en_historial(
        self, client, dummy_image_bytes
    ):
        """10.2.4 — flujo end-to-end del sistema sobre el backend."""
        # Forzamos fallback para que el historial venga del store local
        respx.get(ROBLE_READ_URL).mock(
            return_value=httpx.Response(500, json={"error": "down"})
        )

        # 1. Usuario "carga" 2 imágenes
        files = multi_image_uploads(2, dummy_image_bytes)

        # 2. Backend recibe y 3. modelos procesan
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=files)
        assert r.status_code == 200, r.text
        results = r.json()
        assert len(results) == 2
        assert all(item["success"] for item in results)

        # 4. Resultados se muestran (campos esperados por el frontend)
        for item in results:
            assert item["inference_id"]
            assert "recommendation" in item
            assert "explanation" in item
            assert "postprocessing" in item

        # 5. Guardado automático tras análisis (10.2.3)
        ids = [item["inference_id"] for item in results]
        for iid in ids:
            assert get_inference(iid) is not None

        # 6. Quedan disponibles al consultar /history
        hist = client.get("/history").json()
        # 2 imágenes → 1 batch → 1 grupo
        assert len(hist["inferences"]) >= 1
        group = hist["inferences"][0]
        assert group["is_batch"] is True
        assert group["batch_size"] == 2
