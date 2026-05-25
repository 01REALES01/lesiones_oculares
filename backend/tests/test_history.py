"""
Sección 10.1.5 — Módulo de historial.

Criterio de éxito: cada análisis queda registrado con ID, fecha y
resultados; se puede consultar el historial.

En producción el historial se persiste en ROBLE; en estas pruebas
forzamos el fallback local del endpoint (mockeando ROBLE con respx)
y validamos en paralelo el store local que respalda esa lógica.
"""

from __future__ import annotations

import re

import httpx
import pytest
import respx

from backend.config import settings
from backend.store import (
    clear_history,
    get_inference,
    list_inferences,
    save_inference,
)
from backend.tests.conftest import TEST_USER


ROBLE_READ_URL = re.compile(
    r"https://roble-api\.openlab\.uninorte\.edu\.co/database/.+/read"
)


@pytest.fixture(autouse=True)
def _clean_history():
    """Cada test arranca con historial local limpio."""
    clear_history(delete_images=False)
    yield
    clear_history(delete_images=False)


class TestStoreLocal:
    """Pruebas directas del módulo de almacenamiento."""

    def test_registro_nueva_inferencia_tiene_id_y_fecha(self):
        inf_id = save_inference(
            models_used=["A", "B"],
            inference_times_ms={"A": 12.3, "B": 45.6},
            result={"filename": "x.jpg", "diagnosis": "Normal"},
            image_size=(224, 224),
            user_email=TEST_USER.email,
            roble_user_id=TEST_USER.roble_user_id,
        )
        assert inf_id  # ID no vacío
        record = get_inference(inf_id)
        assert record is not None
        assert record["inference_id"] == inf_id
        assert record["timestamp"]  # fecha presente
        assert record["models_used"] == ["A", "B"]
        assert record["user_email"] == TEST_USER.email

    def test_consulta_historial_filtra_por_usuario(self):
        save_inference(
            models_used=["B"], inference_times_ms={"B": 10.0},
            result={"filename": "mio.jpg"}, user_email=TEST_USER.email,
        )
        save_inference(
            models_used=["B"], inference_times_ms={"B": 10.0},
            result={"filename": "ajeno.jpg"}, user_email="otro@test.com",
        )

        mias = list_inferences(limit=50, user_email=TEST_USER.email)
        ajenas = list_inferences(limit=50, user_email="otro@test.com")

        assert len(mias) == 1
        assert len(ajenas) == 1
        assert mias[0]["summary"]["filename"] == "mio.jpg"


class TestEndpointHistorial:
    """Prueba el endpoint /history a través del fallback local."""

    @respx.mock
    def test_history_devuelve_inferencias_guardadas(self, client):
        # Forzar que ROBLE falle → el endpoint usa el store local
        respx.get(ROBLE_READ_URL).mock(
            return_value=httpx.Response(500, json={"error": "down"})
        )

        save_inference(
            models_used=["B"], inference_times_ms={"B": 7.0},
            result={"filename": "hist.jpg", "diagnosis": "Normal"},
            user_email=TEST_USER.email,
        )

        r = client.get("/history")
        assert r.status_code == 200
        body = r.json()
        assert "inferences" in body
        assert body.get("source") == "local_fallback"
        assert len(body["inferences"]) == 1
        item = body["inferences"][0]
        assert item["inference_id"]
        assert item["timestamp"]
        assert "models_used" in item

    @respx.mock
    def test_history_vacio_devuelve_lista_vacia(self, client):
        respx.get(ROBLE_READ_URL).mock(
            return_value=httpx.Response(500, json={"error": "down"})
        )
        r = client.get("/history")
        assert r.status_code == 200
        assert r.json()["inferences"] == []
