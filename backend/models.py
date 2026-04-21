"""Pydantic request/response models."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ── Categories ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


# ── Budgets ────────────────────────────────────────────────────────────────────

class BudgetEntry(BaseModel):
    category: str
    amount: float = Field(gt=0)

class BudgetBatch(BaseModel):
    """Set multiple category budgets at once for a given month."""
    entries: list[BudgetEntry]

class BudgetResponse(BaseModel):
    month: str
    budgets: dict[str, float]


# ── Expenses ───────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = Field(min_length=1)
    description: Optional[str] = ""
    paid_by: str  = Field(min_length=1)
    date: Optional[str] = None  # defaults to today (YYYY-MM-DD)

    @field_validator("date", mode="before")
    @classmethod
    def default_date(cls, v):
        return v or date.today().isoformat()

    @field_validator("date")
    @classmethod
    def valid_date(cls, v):
        from datetime import datetime
        datetime.strptime(v, "%Y-%m-%d")
        return v

class ExpenseOut(BaseModel):
    id: int
    amount: float
    category: str
    description: str
    paid_by: str
    date: str


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardRow(BaseModel):
    category: str
    monthly_budget: float
    prev_unused: float
    cumulative: float
    spent: float
    remaining: float
    pct_used: float

class DashboardResponse(BaseModel):
    month: str
    matrix: list[DashboardRow]
    totals: DashboardRow
    expenses: list[ExpenseOut]
