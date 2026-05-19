"""Cliente para consumir ROBLE Database desde FastAPI."""
from typing import Any, Dict, List, Optional
import httpx

from backend.config import settings


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