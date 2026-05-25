"""
Configuración compartida de pytest para la sección 10 (Validación).

Fixtures principales:
- `client`: TestClient de FastAPI con autenticación reemplazada por un
  usuario de prueba (evita golpear ROBLE en las pruebas de componentes).
- `dummy_image_bytes` / `dummy_image_upload`: imágenes válidas en memoria.
- `corrupted_upload` / `empty_upload`: payloads inválidos para 10.1.2.
- `pdf_upload` / `text_upload`: formatos no permitidos para 10.1.1.
"""

from __future__ import annotations

import io
import os
import sys
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

# Asegura que la raíz del repo está en el PYTHONPATH (`backend.main` resuelva).
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.main import app  # noqa: E402
from backend.auth import User, get_current_user, oauth2_scheme  # noqa: E402


TEST_USER = User(
    username="tester@retina.ai",
    email="tester@retina.ai",
    role="user",
    roble_user_id="test-user-id-001",
)


def _override_user() -> User:
    return TEST_USER


def _override_token() -> str:
    return "test-token-do-not-use-in-prod"


@pytest.fixture(scope="session", autouse=True)
def _override_auth():
    """Sustituye las dependencias de auth para no llamar a ROBLE."""
    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[oauth2_scheme] = _override_token
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# -----------------------------
# Generadores de imágenes
# -----------------------------

def _encode(img: np.ndarray, ext: str = ".jpg") -> bytes:
    ok, buf = cv2.imencode(ext, img)
    assert ok, f"No se pudo codificar imagen como {ext}"
    return buf.tobytes()


@pytest.fixture
def dummy_image_bytes() -> bytes:
    """Imagen sintética 224x224 con un círculo (simula fondo de ojo)."""
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.circle(img, (112, 112), 90, (40, 30, 180), -1)
    cv2.circle(img, (112, 112), 20, (0, 255, 255), -1)
    return _encode(img, ".jpg")


@pytest.fixture
def dummy_png_bytes() -> bytes:
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    cv2.circle(img, (112, 112), 80, (60, 40, 200), -1)
    return _encode(img, ".png")


def _upload(content: bytes, name: str, mime: str):
    return ("files", (name, io.BytesIO(content), mime))


@pytest.fixture
def jpg_upload(dummy_image_bytes):
    return _upload(dummy_image_bytes, "fundus.jpg", "image/jpeg")


@pytest.fixture
def png_upload(dummy_png_bytes):
    return _upload(dummy_png_bytes, "fundus.png", "image/png")


@pytest.fixture
def corrupted_upload():
    """Bytes que no son una imagen decodificable."""
    return _upload(b"NO-ES-UNA-IMAGEN-VALIDA-1234567890", "broken.jpg", "image/jpeg")


@pytest.fixture
def empty_upload():
    return _upload(b"", "empty.jpg", "image/jpeg")


@pytest.fixture
def pdf_upload():
    pdf_bytes = b"%PDF-1.4\n%fake pdf for testing\n%%EOF"
    return _upload(pdf_bytes, "doc.pdf", "application/pdf")


@pytest.fixture
def text_upload():
    return _upload(b"esto es un txt, no una imagen", "notes.txt", "text/plain")


def multi_image_uploads(n: int, image_bytes: bytes):
    """Genera n tuplas (files, (name, buf, mime)) para multipart."""
    return [
        ("files", (f"img_{i}.jpg", io.BytesIO(image_bytes), "image/jpeg"))
        for i in range(n)
    ]
