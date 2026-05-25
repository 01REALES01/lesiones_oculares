"""
Sección 10.1.2 — Módulo de procesamiento (Backend / FastAPI).

Criterio de éxito: el backend procesa correctamente las imágenes válidas
y devuelve errores controlados ante imagen corrupta o vacía (sin tumbar
el servicio ni propagar 500).
"""

from __future__ import annotations


class TestRecepcionDesdeFrontend:
    def test_recibe_imagen_y_responde_200(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=[jpg_upload])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_health_endpoint_disponible(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestManejoErroresImagen:
    def test_imagen_corrupta_no_tumba_backend(self, client, corrupted_upload):
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=[corrupted_upload])
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is False
        assert data[0]["filename"] == "broken.jpg"
        assert data[0].get("error")

    def test_imagen_vacia_no_tumba_backend(self, client, empty_upload):
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=[empty_upload])
        assert r.status_code == 200
        data = r.json()
        assert data[0]["success"] is False

    def test_imagen_valida_y_corrupta_en_el_mismo_lote(
        self, client, jpg_upload, corrupted_upload
    ):
        """Una imagen mala no debe descartar las buenas del mismo request."""
        r = client.post(
            "/analyze-retina/?models=B&include_heatmap=false",
            files=[jpg_upload, corrupted_upload],
        )
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        by_name = {item["filename"]: item for item in data}
        assert by_name["fundus.jpg"]["success"] is True
        assert by_name["broken.jpg"]["success"] is False
