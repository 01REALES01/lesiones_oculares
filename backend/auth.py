"""
Módulo de autenticación JWT para RetinaAI Platform.
Usa hashlib (SHA-256 + salt) para hashing de contraseñas.
En producción, migrar a argon2/bcrypt con versiones compatibles.
"""

from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

from cv2 import data
from jose import JWTError, jwt
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

import httpx
from backend.config import settings

# ---- Configuración ----
SECRET_KEY = "SECRET_SUPER_SECRETO_PARA_FONDOS_DE_OJO"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ---- Modelos ----
class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    username: str
    email: str | None = None
    role: str = "user"
    roble_user_id: str | None = None
    name: Optional[str] = None

# ---- Hashing (SHA-256 + salt) ----
_SALT = "retina_ai_salt_2024"

def _hash_password(password: str) -> str:
    return hashlib.sha256(f"{_SALT}{password}".encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _hash_password(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    return _hash_password(password)

# ---- Base de Datos en Memoria ----
FAKE_USERS_DB = {
    "admin": {
        "username": "admin",
        "hashed_password": _hash_password("admin"),
    }
}

# ---- OAuth2 ----
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_user(username: str):
    if username in FAKE_USERS_DB:
        return FAKE_USERS_DB[username]
    return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ---- Dependencia de Seguridad ----
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