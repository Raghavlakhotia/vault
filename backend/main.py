"""
Vault Budget API — FastAPI backend
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import categories, budgets, expenses, dashboard, assets, holdings, wealth

app = FastAPI(
    title="Vault Budget API",
    description="Budget management — categories, budgets, expenses, and dashboard.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(budgets.router,    prefix="/api/budgets",    tags=["Budgets"])
app.include_router(expenses.router,   prefix="/api/expenses",   tags=["Expenses"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(assets.router,     prefix="/api/assets",     tags=["Assets"])
app.include_router(holdings.router,   prefix="/api/holdings",   tags=["Holdings"])
app.include_router(wealth.router,     prefix="/api/wealth",     tags=["Wealth"])


@app.get("/", tags=["Meta"])
def root():
    return {
        "service": "Vault Budget API",
        "version": "1.0.0",
        "docs":    "/docs",
        "current_month": datetime.now().strftime("%Y-%m"),
    }
