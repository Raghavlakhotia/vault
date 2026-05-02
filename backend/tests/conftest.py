"""
Shared pytest fixtures.

Tests run against a fresh tmp data directory per test, so production
data in /data is never touched. The trick: set VAULT_DATA_DIR before
the backend modules are imported the first time.
"""

import os
import shutil
import sys
import tempfile
from pathlib import Path

import pytest

# Resolve and isolate before any backend module is imported.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND_DIR))

_TEST_DATA_DIR = Path(tempfile.mkdtemp(prefix="vault_test_session_"))
os.environ["VAULT_DATA_DIR"] = str(_TEST_DATA_DIR)

# Now safe to import — storage will pick up the env var.
from fastapi.testclient import TestClient  # noqa: E402

import storage  # noqa: E402
import main  # noqa: E402  — triggers _startup() which seeds users


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    """
    Per-test isolated data directory. Re-points storage.DATA_DIR
    and storage._USERS_FILE at a fresh tmp_path; bootstraps users
    so login works.
    """
    monkeypatch.setattr(storage, "DATA_DIR", tmp_path)
    monkeypatch.setattr(storage, "_USERS_FILE", tmp_path / "users.json")

    # Seed lakhotia + test like production startup does
    from auth_utils import hash_password
    storage.save_users({
        "lakhotia": {
            "username": "lakhotia",
            "hashed_password": hash_password("raghav"),
        },
        "test": {
            "username": "test",
            "hashed_password": hash_password("test"),
        },
    })
    return tmp_path


@pytest.fixture
def client(data_dir):
    """FastAPI test client wired to the per-test data directory."""
    return TestClient(main.app)


@pytest.fixture
def login(client):
    """Returns a function: login(username, password) -> token."""
    def _login(username: str, password: str) -> str:
        res = client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )
        assert res.status_code == 200, res.text
        return res.json()["access_token"]
    return _login


@pytest.fixture
def auth_headers(login):
    """Default headers for `lakhotia` user."""
    token = login("lakhotia", "raghav")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user_headers(login):
    """Default headers for `test` user (used for isolation tests)."""
    token = login("test", "test")
    return {"Authorization": f"Bearer {token}"}


def pytest_sessionfinish(session, exitstatus):
    """Wipe the session-level tmp dir created at import time."""
    shutil.rmtree(_TEST_DATA_DIR, ignore_errors=True)
