"""
Módulo de autenticación JWT para RetinaAI Platform.
Usa hashlib (SHA-256 + salt) para hashing de contraseñas.
En producción, migrar a argon2/bcrypt con versiones compatibles.
"""

from datetime import datetime, timedelta
from typing import Optional
import hashlib
import secrets

from jose import JWTError, jwt
from pydantic import BaseModel
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user(username)
    if user is None:
        raise credentials_exception
    return User(username=user["username"])
