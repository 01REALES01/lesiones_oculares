"""Agente Cerebro: orquestador LLM que coordina los modelos ML como herramientas.

Usa el Anthropic SDK con tool_use para decidir dinámicamente qué modelos invocar,
razonar paso a paso (CoT) y sintetizar un informe clínico estructurado.
"""

from __future__ import annotations

import asyncio
import json
import time
from typing import Any, Dict, Optional

from pydantic import BaseModel

from backend.config import settings
from backend.ml_manager import ml_manager
from backend.store import save_inference, save_image_to_disk


# ---------------------------------------------------------------------------
# Definición de herramientas (constante de módulo — nunca mutable por request)
# ---------------------------------------------------------------------------

RETINA_TOOLS: list[dict] = [
    {
        "name": "run_segmentation_model",
        "description": (
            "Ejecuta el modelo de segmentación de disco óptico y copa óptica (Modelo A). "
            "Retorna: cdr (cup-to-disc ratio), disc_area, cup_area, cdr_interpretation. "
            "Usar cuando la solicitud involucre evaluación de glaucoma, medición de CDR "
            "o análisis estructural del nervio óptico."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Justificación clínica de una oración para invocar este modelo.",
                }
            },
            "required": ["reason"],
        },
    },
    {
        "name": "run_glaucoma_classifier",
        "description": (
            "Ejecuta el clasificador de probabilidad de glaucoma (Modelo B). "
            "Retorna: glaucoma_probability (0.0–1.0), glaucoma_probability_percent, risk_level. "
            "Usar cuando la solicitud requiera evaluación de riesgo de glaucoma."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "reason": {
                    "type": "string",
                    "description": "Justificación clínica de una oración para invocar este modelo.",
                }
            },
            "required": ["reason"],
        },
    },
    {
        "name": "run_dr_classifier",
        "description": (
            "Ejecuta el clasificador de Retinopatía Diabética según la escala APTOS (Modelo C). "
            "Retorna: predicted_class (0–4), confidence_percent, diagnosis, "
            "clinical_description, raw_probabilities. "
            "Grados APTOS: 0=Sin DR, 1=Leve, 2=Moderada, 3=Severa, 4=Proliferativa. "
            "Usar cuando la solicitud involucre detección de DR, lesiones, hemorragias o "
            "tamizaje de retinopatía diabética."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "model_variant": {
                    "type": "string",
                    "enum": ["densenet169", "priority", "resnet", "efficientnet", "resnet50", "efficientnetb0"],
                    "description": (
                        "Variante del modelo DR a usar. "
                        "'densenet169' = DenseNet169, "
                        "'priority' = modelo prioritario (EfficientNetB0/ResNet50), "
                        "'resnet' = ResNet50, "
                        "'efficientnet' = EfficientNetB0."
                    ),
                },
                "reason": {
                    "type": "string",
                    "description": "Justificación clínica de una oración para invocar este modelo.",
                },
            },
            "required": ["model_variant", "reason"],
        },
    },
]

# ---------------------------------------------------------------------------
# System prompt con cache_control — prefijo estable para todas las solicitudes
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_BLOCKS: list[dict] = [
    {
        "type": "text",
        "text": """Eres un sistema de análisis de imágenes retinianas de alta especialidad, actuando como orquestador central de una plataforma oftalmológica multi-modelo. Tu función es coordinar tres modelos ML especializados expuestos como herramientas y producir informes clínicos estructurados.

MODELOS DISPONIBLES:
- run_segmentation_model (Modelo A): Segmentación de disco y copa óptica. Calcula CDR (Cup-to-Disc Ratio). Umbrales clínicos: CDR < 0.5 = normal, CDR 0.5–0.6 = límite, CDR > 0.6 = sospechoso de glaucoma.
- run_glaucoma_classifier (Modelo B): Clasificador de probabilidad de glaucoma. Retorna probabilidad 0.0–1.0. Umbrales: < 0.4 = bajo riesgo, 0.4–0.6 = riesgo moderado, > 0.6 = alto riesgo.
- run_dr_classifier (Modelo C): Clasificador de Retinopatía Diabética (escala APTOS 0–4):
  * Grado 0: Sin DR — Retina sana, sin hallazgos patológicos.
  * Grado 1: DR Leve — Microaneurismas aislados.
  * Grado 2: DR Moderada — Microaneurismas, exudados, pequeñas hemorragias.
  * Grado 3: DR Severa — >20 hemorragias intrarretinianas, arrosariamiento venoso, AMIR.
  * Grado 4: DR Proliferativa — Neovascularización, hemorragia vítrea o prerretiniana.

PROTOCOLO DE DECISIÓN:
1. Lee la solicitud de análisis cuidadosamente.
2. Razona (Chain-of-Thought) qué modelos son clínicamente necesarios para esa solicitud específica.
3. NO invoques los tres modelos de forma indiscriminada — solo los que la solicitud justifique.
4. Invoca los modelos en orden lógico: segmentación → glaucoma → DR si todos aplican.
5. Tras recibir todos los resultados de herramientas, sintetiza un informe clínico.

EVALUACIÓN DE RIESGO GLOBAL:
- "high": DR grado ≥ 3, O probabilidad glaucoma ≥ 0.6, O CDR > 0.6
- "medium": DR grado 1–2, O probabilidad glaucoma 0.4–0.6, O CDR 0.5–0.6
- "low": DR grado 0, probabilidad glaucoma < 0.4, CDR ≤ 0.5

FORMATO DE SALIDA OBLIGATORIO (después de todas las herramientas, como texto plano JSON):
{
  "clinical_summary": "<resumen de 2-3 oraciones en español claro>",
  "models_invoked": ["A"],
  "findings": {
    "segmentation": <objeto con cdr, disc_area, cup_area, cdr_interpretation> o null,
    "glaucoma": <objeto con glaucoma_probability, glaucoma_probability_percent, risk_level> o null,
    "diabetic_retinopathy": <objeto con predicted_class, confidence_percent, diagnosis, clinical_description> o null
  },
  "risk_assessment": {
    "overall_risk": "low|medium|high",
    "primary_concern": "<hallazgo principal>",
    "recommendation_short": "<recomendación concisa>"
  },
  "disclaimer": "Este sistema es de apoyo clínico y educativo. No constituye diagnóstico médico. Los resultados deben ser interpretados por un profesional de la salud."
}

IMPORTANTE: Siempre incluye el disclaimer. Nunca inventes resultados de modelos — solo reporta lo que las herramientas devuelvan. El campo "models_invoked" debe contener solo las letras de los modelos realmente invocados ("A" para segmentación, "B" para glaucoma, "C" para DR).""",
        "cache_control": {"type": "ephemeral"},
    }
]

# Mapeo de variante de herramienta a model_key del MLManager
_DR_MODEL_KEY_MAP: dict[str, tuple[str, str]] = {
    "densenet169": ("lesiones_densenet", "densenet169"),
    "priority": ("lesiones_efficientnetb0", "efficientnetb0"),
    "resnet": ("lesiones_resnet50", "resnet50"),
    "efficientnet": ("lesiones_efficientnetb0", "efficientnetb0"),
    "resnet50": ("lesiones_resnet50", "resnet50"),
    "efficientnetb0": ("lesiones_efficientnetb0", "efficientnetb0"),
}


# ---------------------------------------------------------------------------
# Modelos de respuesta Pydantic
# ---------------------------------------------------------------------------


class RiskAssessment(BaseModel):
    overall_risk: str
    primary_concern: str
    recommendation_short: str


class AgentFindings(BaseModel):
    segmentation: Optional[Dict[str, Any]] = None
    glaucoma: Optional[Dict[str, Any]] = None
    diabetic_retinopathy: Optional[Dict[str, Any]] = None


class AgentAnalysisResponse(BaseModel):
    success: bool
    inference_id: str
    filename: str
    uploaded_image_preview: str
    agent_model: str
    clinical_summary: str
    models_invoked: list[str]
    findings: AgentFindings
    risk_assessment: RiskAssessment
    disclaimer: str
    agent_timing_ms: float
    cache_stats: dict[str, int]
    reasoning_trace: list[str]


# ---------------------------------------------------------------------------
# BrainAgent
# ---------------------------------------------------------------------------


class BrainAgent:
    """
    Orquestador central. Envuelve el loop agentic manual del Anthropic SDK.
    Instancia única por ciclo de vida de la app (stateless por llamada via run()).
    """

    def __init__(self) -> None:
        self._client = None
        self._model = "claude-sonnet-4-6"

    # ------------------------------------------------------------------
    # Punto de entrada público
    # ------------------------------------------------------------------

    async def run(
        self,
        image_bytes: bytes,
        filename: str,
        image_id: str,
        image_size: tuple[int, int],
        analysis_request: str = "Realiza un análisis retiniano completo.",
    ) -> AgentAnalysisResponse:
        if self._client is None:
            import anthropic

            self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        t_start = time.perf_counter()

        messages: list[dict] = [
            {
                "role": "user",
                "content": (
                    f"Archivo: {filename}\n"
                    f"Solicitud de análisis: {analysis_request}\n\n"
                    "Analiza esta imagen retiniana usando las herramientas disponibles. "
                    "Razona paso a paso antes de invocar cada herramienta."
                ),
            }
        ]

        reasoning_trace: list[str] = []
        tool_results_summary: dict[str, Any] = {}
        inference_times: dict[str, float] = {}
        models_invoked_labels: list[str] = []

        total_cache_creation = 0
        total_cache_read = 0
        total_input = 0
        total_output = 0

        final_text = ""
        MAX_ITERATIONS = 10

        for _ in range(MAX_ITERATIONS):
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=4096,
                system=SYSTEM_PROMPT_BLOCKS,
                tools=RETINA_TOOLS,
                tool_choice={"type": "auto"},
                messages=messages,
            )

            usage = response.usage
            total_cache_creation += getattr(usage, "cache_creation_input_tokens", 0) or 0
            total_cache_read += getattr(usage, "cache_read_input_tokens", 0) or 0
            total_input += getattr(usage, "input_tokens", 0) or 0
            total_output += getattr(usage, "output_tokens", 0) or 0

            for block in response.content:
                if block.type == "text" and block.text.strip():
                    reasoning_trace.append(block.text.strip())

            if response.stop_reason == "end_turn":
                for block in response.content:
                    if block.type == "text":
                        final_text = block.text
                break

            if response.stop_reason != "tool_use":
                for block in response.content:
                    if block.type == "text":
                        final_text = block.text
                break

            messages.append({"role": "assistant", "content": response.content})

            tool_result_blocks: list[dict] = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                t_tool = time.perf_counter()
                tool_result = await self._execute_tool(
                    tool_name=block.name,
                    tool_input=block.input,
                    image_bytes=image_bytes,
                    tool_results_summary=tool_results_summary,
                    models_invoked_labels=models_invoked_labels,
                )
                elapsed = (time.perf_counter() - t_tool) * 1000
                label = {"run_segmentation_model": "A", "run_glaucoma_classifier": "B", "run_dr_classifier": "C"}.get(block.name, block.name)
                inference_times[label] = round(elapsed, 2)

                tool_result_blocks.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(tool_result, default=str),
                    }
                )

            messages.append({"role": "user", "content": tool_result_blocks})

        parsed = self._parse_final_output(final_text, tool_results_summary, models_invoked_labels)
        agent_timing_ms = round((time.perf_counter() - t_start) * 1000, 2)

        result_payload = {
            **{k: v for k, v in parsed.items() if k != "findings"},
            "findings": parsed.get("findings", {}),
            "filename": filename,
            "uploaded_image_preview": f"/images/{image_id}",
            "agent_model": self._model,
            "agent_timing_ms": agent_timing_ms,
        }

        inference_id = save_inference(
            models_used=models_invoked_labels or ["agent"],
            inference_times_ms=inference_times,
            result=result_payload,
            image_size=image_size,
        )

        findings_raw = parsed.get("findings", {})

        return AgentAnalysisResponse(
            success=True,
            inference_id=inference_id,
            filename=filename,
            uploaded_image_preview=f"/images/{image_id}",
            agent_model=self._model,
            clinical_summary=parsed.get("clinical_summary", ""),
            models_invoked=parsed.get("models_invoked", models_invoked_labels),
            findings=AgentFindings(
                segmentation=findings_raw.get("segmentation"),
                glaucoma=findings_raw.get("glaucoma"),
                diabetic_retinopathy=findings_raw.get("diabetic_retinopathy"),
            ),
            risk_assessment=RiskAssessment(
                **parsed.get(
                    "risk_assessment",
                    {
                        "overall_risk": "low",
                        "primary_concern": "Sin hallazgos significativos",
                        "recommendation_short": "Control oftalmológico periódico.",
                    },
                )
            ),
            disclaimer=parsed.get(
                "disclaimer",
                "Este sistema es de apoyo clínico y educativo. No constituye diagnóstico médico.",
            ),
            agent_timing_ms=agent_timing_ms,
            cache_stats={
                "cache_creation_input_tokens": total_cache_creation,
                "cache_read_input_tokens": total_cache_read,
                "input_tokens": total_input,
                "output_tokens": total_output,
            },
            reasoning_trace=reasoning_trace,
        )

    # ------------------------------------------------------------------
    # Dispatcher de herramientas
    # ------------------------------------------------------------------

    async def _execute_tool(
        self,
        tool_name: str,
        tool_input: dict,
        image_bytes: bytes,
        tool_results_summary: dict,
        models_invoked_labels: list,
    ) -> dict:
        loop = asyncio.get_event_loop()

        if tool_name == "run_segmentation_model":
            result = await self._run_segmentation(loop, image_bytes)
            tool_results_summary["segmentation"] = result
            if "A" not in models_invoked_labels:
                models_invoked_labels.append("A")
            return result

        if tool_name == "run_glaucoma_classifier":
            result = await self._run_glaucoma(loop, image_bytes)
            tool_results_summary["glaucoma"] = result
            if "B" not in models_invoked_labels:
                models_invoked_labels.append("B")
            return result

        if tool_name == "run_dr_classifier":
            variant = tool_input.get("model_variant", "densenet169")
            result = await self._run_dr_classifier(loop, image_bytes, variant)
            tool_results_summary["diabetic_retinopathy"] = result
            if "C" not in models_invoked_labels:
                models_invoked_labels.append("C")
            return result

        return {"error": f"Herramienta desconocida: {tool_name}"}

    # ------------------------------------------------------------------
    # Runners individuales (ejecutados en thread pool)
    # ------------------------------------------------------------------

    async def _run_segmentation(self, loop: asyncio.AbstractEventLoop, image_bytes: bytes) -> dict:
        import cv2
        import numpy as np
        from backend.models.segmentation_vnet import segment_optic_disc

        def _infer() -> dict:
            arr = np.frombuffer(image_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                return {"error": "No se pudo decodificar la imagen para segmentación"}
            result = segment_optic_disc(img)
            cdr = float(result["cdr"])
            return {
                "cdr": round(cdr, 4),
                "disc_area": float(result["disc_area"]),
                "cup_area": float(result["cup_area"]),
                "cdr_interpretation": (
                    "CDR elevado (>0.6); sospechoso de glaucoma. Evaluación urgente."
                    if cdr > 0.6
                    else "CDR límite (0.5–0.6); seguimiento oftalmológico recomendado."
                    if cdr > 0.5
                    else "CDR dentro de rango habitual (≤0.5)."
                ),
            }

        return await loop.run_in_executor(None, _infer)

    async def _run_glaucoma(self, loop: asyncio.AbstractEventLoop, image_bytes: bytes) -> dict:
        import cv2
        import numpy as np
        from backend.models.glaucoma_classifier import predict_glaucoma

        def _infer() -> dict:
            arr = np.frombuffer(image_bytes, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if img is None:
                return {"error": "No se pudo decodificar la imagen para clasificación de glaucoma"}
            prob = float(predict_glaucoma(img))
            return {
                "glaucoma_probability": round(prob, 4),
                "glaucoma_probability_percent": round(prob * 100, 1),
                "risk_level": "high" if prob >= 0.6 else "medium" if prob >= 0.4 else "low",
            }

        return await loop.run_in_executor(None, _infer)

    async def _run_dr_classifier(
        self, loop: asyncio.AbstractEventLoop, image_bytes: bytes, variant: str
    ) -> dict:
        model_key, model_type = _DR_MODEL_KEY_MAP.get(variant, ("lesiones_densenet", "densenet169"))

        def _infer() -> dict:
            if model_key not in ml_manager.models:
                # Intentar fallback al primer modelo DR cargado
                dr_keys = [k for k in ml_manager.models if k.startswith("lesiones_")]
                if not dr_keys:
                    return {
                        "error": f"Modelo '{model_key}' no está cargado y no hay alternativas disponibles.",
                        "predicted_class": 0,
                        "confidence_percent": 0.0,
                        "diagnosis": "Modelo no disponible",
                        "clinical_description": "Ningún modelo DR está cargado en este momento.",
                        "raw_probabilities": [0.0, 0.0, 0.0, 0.0, 0.0],
                        "model_loaded": False,
                    }
                effective_key = dr_keys[0]
                # Obtener model_type desde MODEL_RUNTIME_METADATA (late import para evitar circular)
                from backend.main import MODEL_RUNTIME_METADATA
                runtime_meta = MODEL_RUNTIME_METADATA.get(effective_key, {})
                effective_type = runtime_meta.get("model_type", "densenet169")
            else:
                effective_key = model_key
                from backend.main import MODEL_RUNTIME_METADATA
                runtime_meta = MODEL_RUNTIME_METADATA.get(effective_key, {})
                effective_type = runtime_meta.get("model_type", model_type)

            result = ml_manager.predict_single(
                model_key=effective_key,
                image_bytes=image_bytes,
                target_size=None,
                model_type=effective_type,
            )
            result["model_loaded"] = True
            result["model_key_used"] = effective_key
            return result

        return await loop.run_in_executor(None, _infer)

    # ------------------------------------------------------------------
    # Parser de salida final
    # ------------------------------------------------------------------

    def _parse_final_output(
        self,
        final_text: str,
        tool_results_summary: dict,
        models_invoked_labels: list,
    ) -> dict:
        parsed: Optional[dict] = None

        if final_text:
            text = final_text.strip()
            # Extraer JSON de bloques de código si los hay
            for fence in ("```json", "```"):
                if fence in text:
                    try:
                        start = text.index(fence) + len(fence)
                        end = text.index("```", start)
                        text = text[start:end].strip()
                        break
                    except ValueError:
                        pass
            # Intentar parsear desde la primera { hasta la última }
            try:
                start = text.index("{")
                end = text.rindex("}") + 1
                parsed = json.loads(text[start:end])
            except (ValueError, json.JSONDecodeError):
                pass

        if parsed is None:
            parsed = self._fallback_output(tool_results_summary, models_invoked_labels)

        return parsed

    def _fallback_output(self, tool_results_summary: dict, models_invoked_labels: list) -> dict:
        seg = tool_results_summary.get("segmentation")
        gla = tool_results_summary.get("glaucoma")
        dr = tool_results_summary.get("diabetic_retinopathy")

        dr_class = dr.get("predicted_class", 0) if dr and "error" not in dr else 0
        gla_prob = gla.get("glaucoma_probability", 0.0) if gla and "error" not in gla else 0.0
        cdr = seg.get("cdr", 0.0) if seg and "error" not in seg else 0.0

        risk = (
            "high"
            if (dr_class >= 3 or gla_prob >= 0.6 or cdr > 0.6)
            else "medium"
            if (dr_class > 0 or gla_prob >= 0.4 or cdr > 0.5)
            else "low"
        )

        parts = []
        if dr and "error" not in dr:
            parts.append(f"DR Grado {dr_class} ({dr.get('diagnosis', '')})")
        if gla and "error" not in gla:
            parts.append(f"probabilidad de glaucoma {round(gla_prob * 100, 1)}%")
        if seg and "error" not in seg:
            parts.append(f"CDR {round(cdr, 2)}")

        summary = "Análisis completado. " + ("; ".join(parts) + "." if parts else "Sin hallazgos registrados.")

        return {
            "clinical_summary": summary,
            "models_invoked": models_invoked_labels,
            "findings": {
                "segmentation": seg,
                "glaucoma": gla,
                "diabetic_retinopathy": dr,
            },
            "risk_assessment": {
                "overall_risk": risk,
                "primary_concern": (
                    f"Retinopatía Diabética Grado {dr_class}"
                    if dr and dr_class >= 3
                    else "Riesgo elevado de glaucoma"
                    if gla_prob >= 0.6
                    else "Hallazgos moderados"
                    if risk == "medium"
                    else "Sin hallazgos significativos"
                ),
                "recommendation_short": (
                    "Evaluación oftalmológica urgente."
                    if risk == "high"
                    else "Seguimiento oftalmológico recomendado."
                    if risk == "medium"
                    else "Control oftalmológico periódico."
                ),
            },
            "disclaimer": (
                "Este sistema es de apoyo clínico y educativo. No constituye diagnóstico médico. "
                "Los resultados deben ser interpretados por un profesional de la salud."
            ),
        }


# Singleton — creado una vez al importar el módulo
brain_agent = BrainAgent()
