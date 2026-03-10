
from fastapi.testclient import TestClient
from backend.main import app
import cv2
import numpy as np
import io

client = TestClient(app)

def create_dummy_image():
    # Create a simple 100x100 black image
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())

def test_analyze_retina_multiple():
    img1 = create_dummy_image()
    img2 = create_dummy_image()
    
    files = [
        ('files', ('img1.jpg', img1, 'image/jpeg')),
        ('files', ('img2.jpg', img2, 'image/jpeg'))
    ]
    
    response = client.post("/analyze-retina/?models=A,B,C&include_heatmap=false", files=files)
    
    assert response.status_code == 200
    data = response.json()
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Type: {type(data)}")
    print(f"Number of results: {len(data)}")
    
    if isinstance(data, list):
        for res in data:
            print(f"File: {res.get('filename')}, Success: {res.get('success')}")
            if not res.get('success'):
                print(f"Error: {res.get('error')}")

if __name__ == "__main__":
    try:
        test_analyze_retina_multiple()
        print("✅ Custom Test: Multiple upload success!")
    except Exception as e:
        print(f"❌ Custom Test Failed: {e}")
