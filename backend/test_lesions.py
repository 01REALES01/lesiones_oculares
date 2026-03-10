import cv2
import numpy as np
import io
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.auth import get_current_user, User

# Override dependency to avoid needing a real token
def override_get_current_user():
    return User(username="admin")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

def create_dummy_image():
    # Create a simple 224x224 green image
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    img[:, :, 1] = 100
    _, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())

img1 = create_dummy_image()

files = [
    ('files', ('img1.jpg', img1, 'image/jpeg')),
]

response = client.post("/analyze-retina/?models=C&include_heatmap=false", files=files)

print(json.dumps(response.json(), indent=2))
