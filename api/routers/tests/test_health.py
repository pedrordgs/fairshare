from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_alive_returns_ok():
    response = client.get("/health/alive")
    assert response.status_code == 200
    assert response.json() == "ok"
