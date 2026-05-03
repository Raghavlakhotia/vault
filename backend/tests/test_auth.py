"""Auth router + token decoding."""

import time
from datetime import timedelta

import pytest

from auth_utils import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)


# ── auth_utils ─────────────────────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_and_verify(self):
        h = hash_password("hunter2")
        assert verify_password("hunter2", h)
        assert not verify_password("wrong", h)

    def test_different_hashes_for_same_password(self):
        # bcrypt salts each hash; same input → different output
        assert hash_password("abc") != hash_password("abc")


class TestTokens:
    def test_round_trip(self):
        token = create_access_token("alice")
        assert decode_token(token) == "alice"

    def test_invalid_token_returns_none(self):
        assert decode_token("not-a-jwt") is None

    def test_tampered_token_returns_none(self):
        token = create_access_token("alice")
        # Flip a character in the signature segment
        body, sig = token.rsplit(".", 1)
        tampered = body + "." + ("A" + sig[1:] if sig[0] != "A" else "B" + sig[1:])
        assert decode_token(tampered) is None

    def test_expired_token_returns_none(self):
        token = create_access_token("alice", expires_delta=timedelta(seconds=-1))
        assert decode_token(token) is None


# ── /api/auth/login ────────────────────────────────────────────────────────────

class TestLogin:
    def test_valid_credentials(self, client):
        res = client.post(
            "/api/auth/login",
            json={"username": "lakhotia", "password": "raghav"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["token_type"] == "bearer"
        assert decode_token(body["access_token"]) == "lakhotia"

    def test_test_user_credentials(self, client):
        res = client.post(
            "/api/auth/login",
            json={"username": "test", "password": "test"},
        )
        assert res.status_code == 200
        assert decode_token(res.json()["access_token"]) == "test"

    def test_wrong_password(self, client):
        res = client.post(
            "/api/auth/login",
            json={"username": "lakhotia", "password": "WRONG"},
        )
        assert res.status_code == 401
        assert "Invalid" in res.json()["detail"]

    def test_unknown_user(self, client):
        res = client.post(
            "/api/auth/login",
            json={"username": "nobody", "password": "anything"},
        )
        assert res.status_code == 401

    def test_missing_fields(self, client):
        res = client.post("/api/auth/login", json={"username": "x"})
        assert res.status_code == 422


# ── /api/auth/register ─────────────────────────────────────────────────────────

class TestRegister:
    def test_creates_new_user_and_returns_token(self, client):
        res = client.post(
            "/api/auth/register",
            json={"username": "newuser", "password": "secret"},
        )
        assert res.status_code == 200
        assert decode_token(res.json()["access_token"]) == "newuser"

        # User can subsequently log in
        login_res = client.post(
            "/api/auth/login",
            json={"username": "newuser", "password": "secret"},
        )
        assert login_res.status_code == 200

    def test_username_too_short(self, client):
        res = client.post(
            "/api/auth/register",
            json={"username": "ab", "password": "secret"},
        )
        assert res.status_code == 400
        assert "at least 3" in res.json()["detail"]

    def test_password_too_short(self, client):
        res = client.post(
            "/api/auth/register",
            json={"username": "validname", "password": "abc"},
        )
        assert res.status_code == 400
        assert "at least 4" in res.json()["detail"]

    def test_duplicate_username(self, client):
        # 'lakhotia' is seeded by the fixture
        res = client.post(
            "/api/auth/register",
            json={"username": "lakhotia", "password": "secret"},
        )
        assert res.status_code == 400
        assert "taken" in res.json()["detail"].lower()


# ── Token-protected endpoints ─────────────────────────────────────────────────

class TestProtectedEndpoints:
    PROTECTED = [
        ("GET", "/api/categories/"),
        ("GET", "/api/budgets/default"),
        ("GET", "/api/budgets/2026-04"),
        ("GET", "/api/expenses/"),
        ("GET", "/api/dashboard/2026-04"),
        ("GET", "/api/assets/"),
        ("GET", "/api/holdings/"),
        ("GET", "/api/wealth/2026-04"),
        ("GET", "/api/wealth/ratios"),
        ("GET", "/api/library/"),
        ("GET", "/api/family/"),
        ("GET", "/api/sources/"),
    ]

    @pytest.mark.parametrize("method,path", PROTECTED)
    def test_no_token_rejected(self, client, method, path):
        res = client.request(method, path)
        assert res.status_code in (401, 403), f"{method} {path} returned {res.status_code}"

    @pytest.mark.parametrize("method,path", PROTECTED)
    def test_invalid_token_rejected(self, client, method, path):
        res = client.request(method, path, headers={"Authorization": "Bearer garbage"})
        assert res.status_code == 401

    @pytest.mark.parametrize("method,path", PROTECTED)
    def test_valid_token_accepted(self, client, auth_headers, method, path):
        res = client.request(method, path, headers=auth_headers)
        assert res.status_code == 200
