"""JSON file storage — per-user data in data/{username}/"""

import json
import os
import shutil
from pathlib import Path
from typing import Any

DATA_DIR = Path(os.environ.get("VAULT_DATA_DIR", str(Path(__file__).parent.parent / "data")))

_DEFAULTS: list[tuple[str, Any]] = [
    ("categories.json", []),
    ("budgets.json",    {}),
    ("expenses.json",   []),
    ("assets.json",     []),
    ("holdings.json",   []),
    ("family.json",     ["Husband", "Wife"]),
]


def _user_dir(username: str) -> Path:
    d = DATA_DIR / username
    d.mkdir(parents=True, exist_ok=True)
    return d


def _bootstrap(username: str) -> None:
    d = _user_dir(username)
    for name, empty in _DEFAULTS:
        p = d / name
        if not p.exists():
            p.write_text(json.dumps(empty, indent=2))


def _load(username: str, name: str) -> Any:
    _bootstrap(username)
    return json.loads((_user_dir(username) / name).read_text())


def _save(username: str, name: str, data: Any) -> None:
    _bootstrap(username)
    (_user_dir(username) / name).write_text(json.dumps(data, indent=2, default=str))


def migrate_legacy_data() -> None:
    """One-time: move flat data/*.json → data/lakhotia/ if not already done."""
    user_dir = DATA_DIR / "lakhotia"
    user_dir.mkdir(exist_ok=True)
    for name, _ in _DEFAULTS:
        src = DATA_DIR / name
        dst = user_dir / name
        if src.exists() and not dst.exists():
            shutil.move(str(src), str(dst))


# ── Per-user public helpers ────────────────────────────────────────────────────

def get_categories(username: str) -> list[str]:
    return _load(username, "categories.json")

def save_categories(username: str, cats: list[str]) -> None:
    _save(username, "categories.json", cats)


def get_budgets(username: str) -> dict[str, dict[str, float]]:
    return _load(username, "budgets.json")

def save_budgets(username: str, budgets: dict) -> None:
    _save(username, "budgets.json", budgets)


def get_expenses(username: str) -> list[dict]:
    return _load(username, "expenses.json")

def save_expenses(username: str, expenses: list[dict]) -> None:
    _save(username, "expenses.json", expenses)


def get_assets(username: str) -> list[dict]:
    return _load(username, "assets.json")

def save_assets(username: str, assets: list[dict]) -> None:
    _save(username, "assets.json", assets)


def get_holdings(username: str) -> list[dict]:
    return _load(username, "holdings.json")

def save_holdings(username: str, holdings: list[dict]) -> None:
    _save(username, "holdings.json", holdings)


def get_family(username: str) -> list[str]:
    return _load(username, "family.json")

def save_family(username: str, members: list[str]) -> None:
    _save(username, "family.json", members)


# ── Users (not per-user, stored directly in data/) ────────────────────────────

_USERS_FILE = DATA_DIR / "users.json"


def get_users() -> dict[str, dict]:
    if not _USERS_FILE.exists():
        _USERS_FILE.write_text(json.dumps({}, indent=2))
    return json.loads(_USERS_FILE.read_text())


def save_users(users: dict[str, dict]) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    _USERS_FILE.write_text(json.dumps(users, indent=2))
