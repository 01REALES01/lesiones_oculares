"""Cliente para consumir ROBLE Database desde FastAPI."""
from typing import Any, Dict, List, Optional
import httpx

from backend.config import settings
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import json

ROBLE_DATABASE_BASE = "https://roble-api.openlab.uninorte.edu.co/database"


async def roble_insert(
    token: str,
    table_name: str,
    records: List[Dict[str, Any]],
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/insert",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tableName": table_name,
                "records": records,
            },
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error insertando en ROBLE DB: {response.text}")

    return response.json()

async def roble_read(
    token: str,
    table_name: str,
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/table-data",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "schema": "public",
                "table": table_name,
            },
            timeout=15.0,
        )

    if response.status_code != 200:
        raise Exception(f"Error leyendo ROBLE DB: {response.text}")

    return response.json()

async def ensure_user_exists(
    token: str,
    current_user,
):
    data = await roble_read(token, "usuarios_app")

    rows = data.get("rows", [])

    for row in rows:
        if row.get("email") == current_user.email:
            return row

    record = {
        "roble_user_id": current_user.roble_user_id,
        "email": current_user.email,
        "nombre": current_user.username,
        "rol": current_user.role,
        "activo_app": True,
        "fecha_creacion": datetime.now(timezone.utc).isoformat(),
        "ultimo_login": datetime.now(timezone.utc).isoformat(),
    }

    await roble_insert(
        token=token,
        table_name="usuarios_app",
        records=[record],
    )

    return record

async def save_analysis_to_roble(
    token: str,
    record: Dict[str, Any],
) -> Dict[str, Any]:
    return await roble_insert(
        token=token,
        table_name="analisis_retina",
        records=[record],
    )
    
async def roble_read_records(
    token: str,
    table_name: str,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    params = {"tableName": table_name}

    if filters:
        params.update(filters)

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/read",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error leyendo registros de ROBLE DB: {response.text}")

    return response.json()

async def list_user_analyses_from_roble(
    token: str,
    user_email: str,
    limit: int = 50,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={"usuario_email": user_email},
    )

    normalized = []

    for row in rows:
        
        result = row.get("result_json") or {}

        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                result = {}

        if isinstance(result, dict):
            if not result.get("uploaded_image_preview") and result.get("uploaded_image_braham"):
                result["uploaded_image_preview"] = result["uploaded_image_braham"]
                
        summary = result.get("comparison_summary", {})
        primary = result.get("primary_result", {})

        record = {
            "inference_id": row.get("inference_id"),
            "timestamp": row.get("timestamp"),

            "filename": result.get("filename") or row.get("filename") or "Sin nombre",
            "diagnosis": result.get("diagnosis") or primary.get("diagnosis") or "N/A",
            "risk_level": result.get("risk_level") or summary.get("risk_level") or "low",
            "confidence_percent": result.get("confidence_percent") or primary.get("confidence_percent"),
            "recommendation_short": result.get("recommendation_short") or summary.get("recommendation_short"),

            "positive_models": summary.get("positive_models", 0),
            "total_models": summary.get("total_models", len(result.get("model_comparisons", []))),

            "models_used": result.get("selected_models") or [],
            "inference_times_ms": {
                item.get("model_id"): item.get("inference_time_ms")
                for item in result.get("model_comparisons", [])
            },

            "result": result,
            "image_size": row.get("image_size"),
            "batch_id": row.get("batch_id"),
            "user_email": row.get("usuario_email"),
            "roble_user_id": row.get("roble_user_id"),
        }

        normalized.append(record)

    normalized.sort(key=lambda x: x.get("timestamp") or "", reverse=True)

#AGRUPAR POR BATCH ID PARA LOTES
    grouped = {}

    for item in normalized:
        batch_id = item.get("batch_id")

        if not batch_id:
            grouped[item["inference_id"]] = item
            continue

        if batch_id not in grouped:
            grouped[batch_id] = {
                "is_batch": True,
                "batch_id": batch_id,
                "batch_size": 0,
                "timestamp": item.get("timestamp"),

                "summary": {
                    "filename": item.get("filename"),
                    "headline": item.get("result", {})
                        .get("comparison_summary", {})
                        .get("headline"),

                    "risk_level": item.get("risk_level"),
                    "risk_max_level": item.get("risk_level"),

                    "positive_models": item.get("positive_models", 0),
                    "total_models": item.get("total_models", 0),

                    "primary_grade": item.get("result", {})
                        .get("primary_result", {})
                        .get("predicted_class"),

                    "risk_counts": {
                        "high": 0,
                        "medium": 0,
                        "low": 0,
                    },
                },

                "items": [],
            }

        grouped[batch_id]["items"].append(item)
        grouped[batch_id]["batch_size"] += 1

        level = item.get("risk_level", "low")

        if level in grouped[batch_id]["summary"]["risk_counts"]:
            grouped[batch_id]["summary"]["risk_counts"][level] += 1

        # actualizar riesgo máximo
        current_max = grouped[batch_id]["summary"]["risk_max_level"]

        priority = {
            "low": 1,
            "medium": 2,
            "high": 3,
        }

        if priority.get(level, 1) > priority.get(current_max, 1):
            grouped[batch_id]["summary"]["risk_max_level"] = level

    # =========================================
    # CONVERTIR A LISTA
    # =========================================
    final_items = []

    for item in grouped.values():
        if item.get("is_batch") and item.get("batch_size", 0) == 1:
            single = item["items"][0]
            single["is_batch"] = False
            final_items.append(single)
        else:
            final_items.append(item)
        final_items.sort(
            key=lambda x: x.get("timestamp") or "",
            reverse=True
        )

    return final_items[offset: offset + limit]

async def roble_delete_record(
    token: str,
    table_name: str,
    id_column: str,
    id_value: str,
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.request(
            "DELETE",
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/delete",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tableName": table_name,
                "idColumn": id_column,
                "idValue": id_value,
            },
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error eliminando en ROBLE DB: {response.text}")

    return response.json()

async def roble_delete_batch(
    token: str,
    batch_id: str,
    user_email: str,
) -> Dict[str, Any]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={
            "batch_id": batch_id,
            "usuario_email": user_email,
        },
    )

    deleted = []

    for row in rows:
        inference_id = row.get("inference_id")

        if not inference_id:
            continue

        result = await roble_delete_record(
            token=token,
            table_name="analisis_retina",
            id_column="inference_id",
            id_value=inference_id,
        )

        deleted.append(result)

    return {
        "batch_id": batch_id,
        "deleted_count": len(deleted),
        "deleted": deleted,
    }
    
async def roble_delete_all_user_history(
    token: str,
    user_email: str,
) -> Dict[str, Any]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={
            "usuario_email": user_email,
        },
    )

    deleted = []

    for row in rows:
        inference_id = row.get("inference_id")

        if not inference_id:
            continue

        result = await roble_delete_record(
            token=token,
            table_name="analisis_retina",
            id_column="inference_id",
            id_value=inference_id,
        )

        deleted.append(result)

    return {
        "deleted_count": len(deleted),
    }
    
async def get_user_stats_from_roble(
    token: str,
    user_email: str,
) -> Dict[str, Any]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={"usuario_email": user_email},
    )

    total = len(rows)

    if total == 0:
        return {
            "total_analyses": 0,
            "rd_detected_percent": 0,
            "rd_detected_rate": 0,
            "avg_confidence": 0,
            "avg_latency_ms": 0,
        }

    rd_detected = 0
    confidence_sum = 0
    confidence_count = 0
    latency_sum = 0
    latency_count = 0

    for row in rows:
        result = row.get("result_json") or {}

        if isinstance(result, str):
            import json
            result = json.loads(result)

        predicted_class = result.get("predicted_class")
        if predicted_class is not None and int(predicted_class) > 0:
            rd_detected += 1

        confidence = row.get("confidence_percent") or result.get("confidence_percent")
        if confidence is not None:
            confidence_sum += float(confidence)
            confidence_count += 1

        comparisons = result.get("model_comparisons", [])
        for comp in comparisons:
            latency = comp.get("inference_time_ms")
            if latency is not None:
                latency_sum += float(latency)
                latency_count += 1
    
        rd_percent = round((rd_detected / total) * 100, 1)
        
    return {
        "total_analyses": total,
        "rd_detected_percent": rd_percent,
        "rd_detected_rate": rd_percent,
        "avg_confidence": round(confidence_sum / confidence_count, 1) if confidence_count else 0,
        "avg_latency_ms": round(latency_sum / latency_count, 1) if latency_count else 0,
    }
    
async def get_analysis_from_roble(
    token: str,
    inference_id: str,
    user_email: str,
) -> Optional[Dict[str, Any]]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={
            "inference_id": inference_id,
            "usuario_email": user_email,
        },
    )

    if not rows:
        return None

    row = rows[0]
    result = row.get("result_json") or {}

    if isinstance(result, str):
        import json
        result = json.loads(result)

    # Compatibilidad con registros donde no se persistió preview original.
    if isinstance(result, dict):
        if not result.get("uploaded_image_preview") and result.get("uploaded_image_braham"):
            result["uploaded_image_preview"] = result["uploaded_image_braham"]

    return {
        "inference_id": row.get("inference_id"),
        "timestamp": row.get("timestamp"),
        "models_used": result.get("selected_models") or [],
        "inference_times_ms": {
            item.get("model_id"): item.get("inference_time_ms")
            for item in result.get("model_comparisons", [])
        },
        "result": result,
        "image_size": row.get("image_size"),
        "batch_id": row.get("batch_id"),
        "user_email": row.get("usuario_email"),
        "roble_user_id": row.get("roble_user_id"),
    }


async def get_batch_from_roble(
    token: str,
    batch_id: str,
    user_email: str,
) -> List[Dict[str, Any]]:
    rows = await roble_read_records(
        token=token,
        table_name="analisis_retina",
        filters={
            "batch_id": batch_id,
            "usuario_email": user_email,
        },
    )

    records = []

    for row in rows:
        result = row.get("result_json") or {}

        if isinstance(result, str):
            import json
            result = json.loads(result)

        if isinstance(result, dict):
            if not result.get("uploaded_image_preview") and result.get("uploaded_image_braham"):
                result["uploaded_image_preview"] = result["uploaded_image_braham"]

        records.append({
            "inference_id": row.get("inference_id"),
            "timestamp": row.get("timestamp"),
            "models_used": result.get("selected_models") or [],
            "inference_times_ms": {
                item.get("model_id"): item.get("inference_time_ms")
                for item in result.get("model_comparisons", [])
            },
            "result": result,
            "image_size": row.get("image_size"),
            "batch_id": row.get("batch_id"),
            "user_email": row.get("usuario_email"),
            "roble_user_id": row.get("roble_user_id"),
        })

    records.sort(key=lambda x: x.get("timestamp") or "")

    return records
async def get_user_app_by_email(
    token: str,
    email: str,
) -> Optional[Dict[str, Any]]:
    rows = await roble_read_records(
        token=token,
        table_name="usuarios_app",
        filters={"email": email},
    )

    return rows[0] if rows else None


async def update_user_app_status_or_login(
    token: str,
    email: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/update",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tableName": "usuarios_app",
                "idColumn": "email",
                "idValue": email,
                "updates": updates,
            },
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error actualizando usuario en ROBLE DB: {response.text}")

    return response.json()
async def get_admin_global_stats(
    token: str,
) -> Dict[str, Any]:
    users = await roble_read_records(
        token=token,
        table_name="usuarios_app",
    )

    analyses = await roble_read_records(
        token=token,
        table_name="analisis_retina",
    )

    total_users = len(users)
    active_users = sum(1 for u in users if u.get("activo_app") is not False)
    inactive_users = sum(1 for u in users if u.get("activo_app") is False)

    confidences = []
    rd_detected = 0
    latest_analysis = None

    severity_counts = {
        "NO R.D.": 0,
        "Leve": 0,
        "Moderado": 0,
        "Severo": 0,
        "Proliferativo": 0,
    }

    model_usage = {}
    model_latency_sum = {}
    model_latency_count = {}

    labels = ["NO R.D.", "Leve", "Moderado", "Severo", "Proliferativo"]

    for row in analyses:
        result = row.get("result_json") or {}

        if isinstance(result, str):
            import json
            try:
                result = json.loads(result)
            except Exception:
                result = {}

        confidence = row.get("confidence_percent") or result.get("confidence_percent")
        if confidence is not None:
            confidences.append(float(confidence))

        grade = (
            result.get("comparison_summary", {}).get("consensus_grade")
            or result.get("primary_result", {}).get("predicted_class")
            or result.get("predicted_class")
            or row.get("predicted_class")
            or 0
        )

        try:
            grade = int(grade)
        except Exception:
            grade = 0

        grade = max(0, min(4, grade))
        severity_counts[labels[grade]] += 1

        if grade > 0:
            rd_detected += 1

        timestamp = row.get("timestamp") or result.get("timestamp")
        if timestamp and (latest_analysis is None or timestamp > latest_analysis):
            latest_analysis = timestamp

        comparisons = result.get("model_comparisons") or []

        if not comparisons:
            model_name = (
                result.get("primary_result", {}).get("model_used")
                or result.get("model_used")
                or row.get("model_used")
                or "Modelo desconocido"
            )
            latency = (
                result.get("primary_result", {}).get("inference_time_ms")
                or result.get("inference_time_ms")
                or row.get("inference_time_ms")
                or 0
            )

            comparisons = [{
                "model_name": model_name,
                "inference_time_ms": latency,
            }]

        for model in comparisons:
            model_name = model.get("model_name") or model.get("model_id") or "Modelo desconocido"
            latency = float(model.get("inference_time_ms") or 0)

            model_usage[model_name] = model_usage.get(model_name, 0) + 1
            model_latency_sum[model_name] = model_latency_sum.get(model_name, 0) + latency
            model_latency_count[model_name] = model_latency_count.get(model_name, 0) + 1

    total_analyses = len(analyses)

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": inactive_users,
        "total_analyses": total_analyses,
        "avg_confidence": round(sum(confidences) / len(confidences), 1) if confidences else 0,
        "rd_detected_percent": round((rd_detected / total_analyses) * 100, 1) if total_analyses else 0,
        "latest_analysis": latest_analysis,
        "severity_distribution": [
            {"name": key, "value": value}
            for key, value in severity_counts.items()
        ],
        "model_usage": [
            {"name": key, "value": value}
            for key, value in model_usage.items()
        ],
        "model_latency": [
            {
                "name": key,
                "value": round(model_latency_sum[key] / model_latency_count[key], 1),
            }
            for key in model_latency_sum
        ],
        "most_used_model": max(
            model_usage.items(),
            key=lambda x: x[1],
            default=("Sin datos", 0),
        ),

        "fastest_model": min(
            [
                (
                    key,
                    round(model_latency_sum[key] / model_latency_count[key], 1)
                )
                for key in model_latency_sum
            ],
            key=lambda x: x[1],
            default=("Sin datos", 0),
        ),
    }
    
async def roble_update_by_column(
    token: str,
    table_name: str,
    id_column: str,
    id_value: str,
    updates: Dict[str, Any],
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.put(
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/update",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tableName": table_name,
                "idColumn": id_column,
                "idValue": id_value,
                "updates": updates,
            },
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error actualizando {table_name}: {response.text}")

    return response.json()
    
async def create_suggestion(
    token: str,
    suggestion_data: Dict[str, Any],
):
    return await roble_insert(
        token=token,
        table_name="sugerencias_app",
        records=[suggestion_data],
    )


async def get_all_suggestions(
    token: str,
):
    return await roble_read_records(
        token=token,
        table_name="sugerencias_app",
    )


async def update_suggestion_status(
    token: str,
    suggestion_id: str,
    estado: str,
):
    return await roble_update_by_column(
        token=token,
        table_name="sugerencias_app",
        id_column="_id",
        id_value=suggestion_id,
        updates={
            "estado": estado,
        },
    )
    
async def roble_delete_by_column(
    token: str,
    table_name: str,
    id_column: str,
    id_value: str,
) -> Dict[str, Any]:
    async with httpx.AsyncClient() as client:
        response = await client.request(
            "DELETE",
            f"{ROBLE_DATABASE_BASE}/{settings.roble_db_name}/delete",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "tableName": table_name,
                "idColumn": id_column,
                "idValue": id_value,
            },
            timeout=15.0,
        )

    if response.status_code not in (200, 201):
        raise Exception(f"Error eliminando en {table_name}: {response.text}")

    return response.json()

async def delete_suggestion(
    token: str,
    suggestion_id: str,
):
    return await roble_delete_by_column(
        token=token,
        table_name="sugerencias_app",
        id_column="_id",
        id_value=suggestion_id,
    )
