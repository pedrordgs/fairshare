from fastapi.testclient import TestClient

from conftest import AuthenticatedClient


class TestRegister:
    def test_success(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register", json={"name": "Test User", "email": "test@example.com", "password": "password123"}
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
            "/auth/register", json={"name": "User 1", "email": "duplicate@example.com", "password": "password123"}
        )
        response = client.post(
            "/auth/register", json={"name": "User 2", "email": "duplicate@example.com", "password": "password456"}
        )
        assert response.status_code == 400
        assert response.json() == {"detail": "A user with this email already exists"}

    def test_invalid_email(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register", json={"name": "Test User", "email": "not-an-email", "password": "password123"}
        )
        assert response.status_code == 422


class TestLogin:
    def test_success(self, client: TestClient) -> None:
        client.post(
            "/auth/register", json={"name": "Login User", "email": "login@example.com", "password": "correctpassword"}
        )
        response = client.post(
            "/auth/token",
            data={"username": "login@example.com", "password": "correctpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_wrong_password(self, client: TestClient) -> None:
        client.post(
            "/auth/register",
            json={"name": "Wrong Pass User", "email": "wrongpass@example.com", "password": "correctpassword"},
        )
        response = client.post(
            "/auth/token",
            data={"username": "wrongpass@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"

    def test_nonexistent_user(self, client: TestClient) -> None:
        response = client.post(
            "/auth/token",
            data={"username": "nonexistent@example.com", "password": "anypassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect email or password"


class TestGetMe:
    def test_success(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.get("/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user.id
        assert data["name"] == user.name
        assert data["email"] == user.email

    def test_no_token(self, client: TestClient) -> None:
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_invalid_token(self, client: TestClient) -> None:
        response = client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid credentials"


class TestUpdateMe:
    def test_update_name(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me", json={"name": "Updated Name"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["email"] == user.email

    def test_update_email_to_unique(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me", json={"email": "newemail@example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user.name
        assert data["email"] == "newemail@example.com"

    def test_update_email_to_existing(self, authenticated_client: AuthenticatedClient, client: TestClient) -> None:
        auth_client, _ = authenticated_client
        # Create another user with a different email
        client.post(
            "/auth/register", json={"name": "Other User", "email": "other@example.com", "password": "password123"}
        )
        response = auth_client.patch("/auth/me", json={"email": "other@example.com"})
        assert response.status_code == 400
        assert response.json() == {"detail": "A user with this email already exists"}

    def test_update_email_to_own_email(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me", json={"email": user.email})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user.email

    def test_no_changes(self, authenticated_client: AuthenticatedClient) -> None:
        client, user = authenticated_client
        response = client.patch("/auth/me", json={})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == user.name
        assert data["email"] == user.email

    def test_update_both_name_and_email(self, authenticated_client: AuthenticatedClient) -> None:
        client, _ = authenticated_client
        response = client.patch("/auth/me", json={"name": "New Name", "email": "newemail2@example.com"})
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"
        assert data["email"] == "newemail2@example.com"

    def test_no_token(self, client: TestClient) -> None:
        response = client.patch("/auth/me", json={"name": "New Name"})
        assert response.status_code == 401
