"""Cliente para consumir ROBLE Database desde FastAPI."""
from typing import Any, Dict, List, Optional
import httpx

from backend.config import settings
from datetime import datetime, timezone


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