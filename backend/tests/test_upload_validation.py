"""
Sección 10.1.1 — Módulo de carga de imágenes (Frontend/Backend).

Criterio de éxito: el sistema acepta formatos válidos (JPG/PNG) y rechaza
los inválidos (PDF, TXT) con un mensaje claro.

El backend procesa por archivo: las imágenes válidas devuelven `success=True`
y las que no se pueden decodificar como imagen devuelven `success=False`
junto con un campo `error` legible.
"""

from __future__ import annotations


def _post_one(client, upload_tuple):
    return client.post("/analyze-retina/?models=B&include_heatmap=false", files=[upload_tuple])


class TestFormatosValidos:
    def test_acepta_jpg(self, client, jpg_upload):
        r = _post_one(client, jpg_upload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) and len(data) == 1
        assert data[0]["success"] is True
        assert data[0]["filename"] == "fundus.jpg"

    def test_acepta_png(self, client, png_upload):
        r = _post_one(client, png_upload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is True
        assert data[0]["filename"] == "fundus.png"


class TestFormatosInvalidos:
    def test_rechaza_pdf_con_mensaje_claro(self, client, pdf_upload):
        r = _post_one(client, pdf_upload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is False
        assert "error" in data[0]
        # El mensaje debe orientar al usuario
        assert "imagen" in data[0]["error"].lower()

    def test_rechaza_txt(self, client, text_upload):
        r = _post_one(client, text_upload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is False
        assert data[0].get("error")

    def test_rechaza_archivo_vacio(self, client, empty_upload):
        r = _post_one(client, empty_upload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data[0]["success"] is False


class TestSeleccionDeModelosInvalida:
    def test_modelo_invalido_devuelve_400(self, client, jpg_upload):
        r = client.post(
            "/analyze-retina/?models=Z&include_heatmap=false",
            files=[jpg_upload],
        )
        assert r.status_code == 400
        body = r.json()
        assert "inv" in body["detail"].lower()  # "inválido"
