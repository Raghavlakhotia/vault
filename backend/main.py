"""
Vault Budget API — FastAPI backend
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth_utils import hash_password
from storage import get_users, save_users, migrate_legacy_data
from routers import categories, budgets, expenses, dashboard, assets, holdings, wealth, library
from routers import auth

app = FastAPI(
    title="Vault Budget API",
    description="Budget management — categories, budgets, expenses, and dashboard.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _startup() -> None:
    migrate_legacy_data()
    users = get_users()
    changed = False
    if "lakhotia" not in users:
        users["lakhotia"] = {"username": "lakhotia", "hashed_password": hash_password("raghav")}
        changed = True
    if "test" not in users:
        users["test"] = {"username": "test", "hashed_password": hash_password("test")}
        changed = True
    if changed:
        save_users(users)


_startup()

app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(budgets.router,    prefix="/api/budgets",    tags=["Budgets"])
app.include_router(expenses.router,   prefix="/api/expenses",   tags=["Expenses"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(assets.router,     prefix="/api/assets",     tags=["Assets"])
app.include_router(holdings.router,   prefix="/api/holdings",   tags=["Holdings"])
app.include_router(wealth.router,     prefix="/api/wealth",     tags=["Wealth"])
app.include_router(library.router,    prefix="/api/library",    tags=["Library"])


@app.get("/", tags=["Meta"])
def root():
    return {
        "service": "Vault Budget API",
        "version": "1.0.0",
        "docs":    "/docs",
        "current_month": datetime.now().strftime("%Y-%m"),
    }
