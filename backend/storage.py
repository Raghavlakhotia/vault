"""JSON file storage — shared with the TUI (vault/data/)."""

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).parent.parent / "data"


def _bootstrap() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    defaults = [
        ("categories.json", []),
        ("budgets.json",    {}),
        ("expenses.json",   []),
        ("assets.json",     []),
        ("holdings.json",   []),
    ]
    for name, empty in defaults:
        p = DATA_DIR / name
        if not p.exists():
            p.write_text(json.dumps(empty, indent=2))


def _load(name: str) -> Any:
    _bootstrap()
    return json.loads((DATA_DIR / name).read_text())


def _save(name: str, data: Any) -> None:
    _bootstrap()
    (DATA_DIR / name).write_text(json.dumps(data, indent=2, default=str))


# ── Public helpers ─────────────────────────────────────────────────────────────

def get_categories() -> list[str]:
    return _load("categories.json")

def save_categories(cats: list[str]) -> None:
    _save("categories.json", cats)


def get_budgets() -> dict[str, dict[str, float]]:
    return _load("budgets.json")

def save_budgets(budgets: dict) -> None:
    _save("budgets.json", budgets)


def get_expenses() -> list[dict]:
    return _load("expenses.json")

def save_expenses(expenses: list[dict]) -> None:
    _save("expenses.json", expenses)


def get_assets() -> list[dict]:
    return _load("assets.json")

def save_assets(assets: list[dict]) -> None:
    _save("assets.json", assets)


def get_holdings() -> list[dict]:
    return _load("holdings.json")

def save_holdings(holdings: list[dict]) -> None:
    _save("holdings.json", holdings)
