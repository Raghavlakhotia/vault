"""
Vault Budget API — FastAPI backend
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from datetime import datetime
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth_utils import hash_password, decode_token
from storage import get_users, save_users
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

_bearer = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Security(_bearer)) -> str:
    username = decode_token(credentials.credentials)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return username


def _seed_default_user() -> None:
    users = get_users()
    if "lakhotia" not in users:
        users["lakhotia"] = {
            "username": "lakhotia",
            "hashed_password": hash_password("raghav"),
        }
        save_users(users)


_seed_default_user()

_auth_dep = [Depends(require_auth)]

app.include_router(auth.router,       prefix="/api/auth",       tags=["Auth"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"], dependencies=_auth_dep)
app.include_router(budgets.router,    prefix="/api/budgets",    tags=["Budgets"],    dependencies=_auth_dep)
app.include_router(expenses.router,   prefix="/api/expenses",   tags=["Expenses"],   dependencies=_auth_dep)
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"],  dependencies=_auth_dep)
app.include_router(assets.router,     prefix="/api/assets",     tags=["Assets"],     dependencies=_auth_dep)
app.include_router(holdings.router,   prefix="/api/holdings",   tags=["Holdings"],   dependencies=_auth_dep)
app.include_router(wealth.router,     prefix="/api/wealth",     tags=["Wealth"],     dependencies=_auth_dep)
app.include_router(library.router,    prefix="/api/library",    tags=["Library"],    dependencies=_auth_dep)


@app.get("/", tags=["Meta"])
def root():
    return {
        "service": "Vault Budget API",
        "version": "1.0.0",
        "docs":    "/docs",
        "current_month": datetime.now().strftime("%Y-%m"),
    }
