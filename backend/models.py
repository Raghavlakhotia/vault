"""Pydantic request/response models."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


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


# ── Wealth ─────────────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    asset_name: str = Field(min_length=1, max_length=128)
    category: str = Field(pattern="^(Equity|Debt)$")
    expected_return: float = Field(ge=0)

class AssetOut(BaseModel):
    asset_id: int
    asset_name: str
    category: str
    expected_return: float

class HoldingCreate(BaseModel):
    asset_id: int
    month_year: str
    invested_value: float = Field(ge=0)
    market_value: float = Field(ge=0)

class HoldingUpdate(BaseModel):
    invested_value: float = Field(ge=0)
    market_value: float = Field(ge=0)

class HoldingOut(BaseModel):
    id: int
    asset_id: int
    month_year: str
    invested_value: float
    market_value: float

class WealthRow(BaseModel):
    asset_id: int
    asset_name: str
    category: str
    expected_return: float
    holding_id: Optional[int]
    invested_value: float
    market_value: float
    returns: Optional[float]

class WealthTotals(BaseModel):
    weighted_expected_return: Optional[float]
    total_invested: float
    total_market: float
    weighted_realized_return: Optional[float]

class WealthDashboardResponse(BaseModel):
    month_year: str
    rows: list[WealthRow]
    totals: WealthTotals
