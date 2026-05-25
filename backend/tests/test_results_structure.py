"""
Sección 10.1.4 — Módulo de resultados.

Criterio de éxito: resultados claros, completos y correctamente
estructurados — incluyendo probabilidades, etiquetas y los datos
que el frontend usa para construir gráficos.
"""

from __future__ import annotations


class TestEstructuraDeResultados:
    def test_campos_obligatorios_de_alto_nivel(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=[jpg_upload])
        assert r.status_code == 200
        item = r.json()[0]

        # Identificación / trazabilidad
        for key in (
            "filename",
            "success",
            "inference_id",
            "traceability",
            "uploaded_image_preview",
            "disclaimer",
        ):
            assert key in item, f"Falta campo de alto nivel: {key}"

        # Salidas clínicas
        for key in (
            "glaucoma_probability",
            "cup_to_disc_ratio",
            "lesions_found",
            "recommendation",
            "explanation",
            "postprocessing",
        ):
            assert key in item, f"Falta campo clínico: {key}"

    def test_probabilidades_son_validas(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=B&include_heatmap=false", files=[jpg_upload])
        item = r.json()[0]
        prob = item["glaucoma_probability"]
        assert isinstance(prob, (int, float))
        assert 0.0 <= prob <= 1.0

    def test_explanation_tiene_campos_para_la_ui(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=[jpg_upload])
        explanation = r.json()[0]["explanation"]
        for key in (
            "cdr_interpretation",
            "glaucoma_risk_level",
            "glaucoma_probability_percent",
            "dr_grade",
            "dr_diagnosis",
            "recommendation_short",
        ):
            assert key in explanation, f"Falta {key} en explanation"
        assert explanation["glaucoma_risk_level"] in {"low", "medium", "high"}

    def test_graph_data_para_frontend(self, client, jpg_upload):
        """El frontend dibuja gráficos a partir de `postprocessing.graph_data`."""
        r = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=[jpg_upload])
        post = r.json()[0]["postprocessing"]
        assert "report" in post
        assert "graph_data" in post

    def test_trazabilidad_consistente(self, client, jpg_upload):
        r = client.post("/analyze-retina/?models=A,B&include_heatmap=false", files=[jpg_upload])
        item = r.json()[0]
        trace = item["traceability"]
        assert trace["inference_id"] == item["inference_id"]
        assert set(trace["models_used"]) == {"A", "B"}
        assert set(trace["inference_times_ms"].keys()) == {"A", "B"}
