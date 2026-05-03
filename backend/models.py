"""Pydantic request/response models."""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


# ── Categories ─────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


# ── Family ─────────────────────────────────────────────────────────────────────

class FamilyMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


# ── Sources ────────────────────────────────────────────────────────────────────

class SourceCreate(BaseModel):
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
    source: Optional[str] = ""
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
    source: str = ""
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
    use_expected_return: bool = False

class HoldingUpdate(BaseModel):
    invested_value: float = Field(ge=0)
    market_value: float = Field(ge=0)
    use_expected_return: bool = False

class HoldingOut(BaseModel):
    id: int
    asset_id: int
    month_year: str
    invested_value: float
    market_value: float
    use_expected_return: bool = False

class WealthRow(BaseModel):
    asset_id: int
    asset_name: str
    category: str
    expected_return: float
    holding_id: Optional[int]
    invested_value: float
    market_value: float
    returns: Optional[float]
    use_expected_return: bool = False

class WealthTotals(BaseModel):
    weighted_expected_return: Optional[float]
    total_invested: float
    total_market: float
    weighted_realized_return: Optional[float]

class WealthDashboardResponse(BaseModel):
    month_year: str
    rows: list[WealthRow]
    totals: WealthTotals


# ── Retirement ──────────────────────────────────────────────────────────────────

class RetirementInput(BaseModel):
    current_age: int = Field(ge=18, le=70)
    target_retirement_age: int = Field(ge=19, le=80)
    inflation_rate: float = Field(default=6.0, ge=1.0, le=20.0)
    monthly_sip: float = Field(ge=0)
    current_corpus: float = Field(ge=0)
    expenses_lean: float = Field(gt=0)
    expenses_regular: float = Field(gt=0)
    expenses_fat: float = Field(gt=0)

class RetirementScenario(BaseModel):
    name: str
    monthly_expense_today: float
    monthly_expense_at_retirement: float
    corpus_needed: float
    projected_corpus: float          # FV of current corpus + SIP at target age
    funded_pct: float                # 0–100
    gap: float                       # 0 if already funded
    gap_sip_flat: float              # monthly SIP at 12% to close gap
    gap_sip_stepup: float            # starting monthly SIP with 10% annual step-up
    fire_age: Optional[int]          # earliest age fully funded; None if > 80
    fire_year: Optional[int]

class RetirementResponse(BaseModel):
    scenarios: list[RetirementScenario]
    years_to_target: int


# ── Income ─────────────────────────────────────────────────────────────────────

class IncomeSubAllocation(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    amount: float = Field(ge=0)

class IncomeAllocation(BaseModel):
    amount: float = Field(ge=0)
    subs: list[IncomeSubAllocation] = []

class IncomeConfig(BaseModel):
    in_hand: float = Field(ge=0)
    allocations: dict[str, IncomeAllocation]
