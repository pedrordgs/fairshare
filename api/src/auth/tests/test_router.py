from fastapi.testclient import TestClient

from conftest import AuthenticatedClient


class TestRegister:
    def test_success(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "Tr0ub4dor&3"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "password" not in data
        assert "hashed_password" not in data

    def test_duplicate_email(self, client: TestClient) -> None:
        client.post(
            "/auth/register/", json={"name": "User 1", "email": "duplicate@example.com", "password": "Tr0ub4dor&3"}
        )
        response = client.post(
            "/auth/register/", json={"name": "User 2", "email": "duplicate@example.com", "password": "Tr0ub4dor&3"}
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "A user with this email already exists"}

    def test_invalid_email(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "not-an-email", "password": "Tr0ub4dor&3"}
        )
        assert response.status_code == 422

    def test_password_too_short(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "Ab1!"}
        )
        assert response.status_code == 422
        assert "at least 8 characters" in response.text

    def test_password_too_long(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "Ab1!" + "x" * 125}
        )
        assert response.status_code == 422
        assert "at most 128 characters" in response.text

    def test_password_missing_uppercase(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "tr0ub4dor&3"}
        )
        assert response.status_code == 422
        assert "uppercase" in response.text

    def test_password_missing_digit(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "Troubador&x"}
        )
        assert response.status_code == 422
        assert "digit" in response.text

    def test_password_missing_special_character(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "Tr0ub4dor3"}
        )
        assert response.status_code == 422
        assert "special character" in response.text

    def test_password_too_common(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register/", json={"name": "Test User", "email": "test@example.com", "password": "P@ssw0rd1"}
        )
        assert response.status_code == 422


class TestLogin:
    def test_success(self, client: TestClient) -> None:
        client.post(
            "/auth/register/", json={"name": "Login User", "email": "login@example.com", "password": "Tr0ub4dor&3"}
        )
        response = client.post(
            "/auth/token/",
            data={"username": "login@example.com", "password": "Tr0ub4dor&3"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_wrong_password(self, client: TestClient) -> None:
        client.post(
            "/auth/register/",
            json={"name": "Wrong Pass User", "email": "wrongpass@example.com", "password": "Tr0ub4dor&3"},
        )
        response = client.post(
            "/auth/token/",
            data={"username": "wrongpass@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    def test_nonexistent_user(self, client: TestClient) -> None:
        response = client.post(
            "/auth/token/",
            data={"username": "nonexistent@example.com", "password": "anypassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"


class TestGetMe:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.get("/auth/me/")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user.id
        assert data["name"] == user.name
        assert data["email"] == user.email

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/auth/me/")
        assert response.status_code == 401

    def test_invalid_token(self, client: TestClient) -> None:
        response = client.get("/auth/me/", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"


class TestUpdateMe:
    def test_update_name(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me/", json={"name": "Updated Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == user.email

    def test_ignore_email_updates(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me/", json={"email": "newemail@example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user.name
        assert data["email"] == user.email

    def test_ignore_password_updates(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me/", json={"password": "N3wStr0ng!Pass#2026"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user.name
        assert data["email"] == user.email
        assert "password" not in data
        assert "hashed_password" not in data

    def test_name_too_short(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.patch("/auth/me/", json={"name": "A"})
        assert response.status_code == 422

    def test_no_changes(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me/", json={})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user.name
        assert data["email"] == user.email

    def test_no_token(self, client: TestClient) -> None:
        response = client.patch("/auth/me/", json={"name": "New Name"})
        assert response.status_code == 401
