"""
Módulo de autenticación JWT para RetinaAI Platform.
Usa hashlib (SHA-256 + salt) para hashing de contraseñas.
En producción, migrar a argon2/bcrypt con versiones compatibles.
"""

from typing import Optional

from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

import httpx
from backend.config import settings

class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str = "user"
    roble_user_id: Optional[str] = None
    name: Optional[str] = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.roble_auth_base}/{settings.roble_db_name}/verify-token",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0,
            )

        if response.status_code not in (200, 201):
            raise credentials_exception

        data = response.json()

        user_data = data.get("user", {})


        email = data.get("email") or user_data.get("email")
        role = data.get("role") or user_data.get("role", "user")

        roble_user_id = (
            data.get("sub")
            or data.get("id")
            or user_data.get("id")
            or user_data.get("sub")
        )
        return User(
            username=email or "usuario_roble",
            email=email,
            role=role,
            roble_user_id=roble_user_id,
            name=user_data.get("name"),
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No se pudo verificar el token con ROBLE.",
        )
