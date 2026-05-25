"""
Sección 10.1.6 — Módulo de login.

Criterio de éxito: dar acceso al sistema al usuario válido y mostrar un
mensaje de error claro al inválido.

El endpoint `/token` delega la verificación en ROBLE; aquí mockeamos
la respuesta HTTP de ROBLE con `respx` para validar el contrato del
backend sin depender de la red.
"""

from __future__ import annotations

import re

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from backend.auth import get_current_user, oauth2_scheme
from backend.config import settings
from backend.main import app


# Para `/token` queremos usar el endpoint REAL (sin overrides),
# porque lo que probamos es justamente la autenticación.
@pytest.fixture
def raw_client():
    overrides = app.dependency_overrides.copy()
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(oauth2_scheme, None)
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides = overrides


ROBLE_LOGIN_URL = re.compile(
    rf"{re.escape(settings.roble_auth_base)}/{re.escape(settings.roble_db_name)}/login"
)


class TestLoginCredencialesValidas:
    @respx.mock
    def test_login_ok_devuelve_access_token(self, raw_client):
        respx.post(ROBLE_LOGIN_URL).mock(
            return_value=httpx.Response(
                200,
                json={
                    "accessToken": "fake-access-token",
                    "refreshToken": "fake-refresh-token",
                    "user": {
                        "id": "user-123",
                        "email": "valid@test.com",
                        "role": "user",
                    },
                },
            )
        )

        r = raw_client.post(
            "/token",
            data={"username": "valid@test.com", "password": "correct"},
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["access_token"] == "fake-access-token"
        assert body["refresh_token"] == "fake-refresh-token"
        assert body["token_type"] == "bearer"


class TestLoginCredencialesInvalidas:
    @respx.mock
    def test_login_invalido_devuelve_401_con_mensaje_claro(self, raw_client):
        respx.post(ROBLE_LOGIN_URL).mock(
            return_value=httpx.Response(401, json={"message": "invalid credentials"})
        )

        r = raw_client.post(
            "/token",
            data={"username": "bad@test.com", "password": "wrong"},
        )
        assert r.status_code == 401
        detail = r.json()["detail"].lower()
        # Mensaje al usuario debe ser comprensible (no un stacktrace)
        assert "contrase" in detail or "correo" in detail or "credenciales" in detail

    @respx.mock
    def test_roble_caido_devuelve_503(self, raw_client):
        respx.post(ROBLE_LOGIN_URL).mock(
            side_effect=httpx.ConnectError("no hay red")
        )

        r = raw_client.post(
            "/token",
            data={"username": "any@test.com", "password": "any"},
        )
        assert r.status_code == 503
        assert "roble" in r.json()["detail"].lower()
