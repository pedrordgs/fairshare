from fastapi.testclient import TestClient


class TestCheckAlive:
    def test_success(self, client: TestClient) -> None:
        response = client.get("/-/alive/")
        assert response.status_code == 200
        assert response.json() == "ok"
