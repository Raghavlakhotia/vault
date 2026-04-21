from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from models import BudgetBatch, BudgetResponse
from storage import get_budgets, save_budgets, get_categories

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Month must be in YYYY-MM format.",
        )


@router.get("/", response_model=dict[str, dict[str, float]])
def list_all_budgets():
    """Return every month's budgets."""
    return get_budgets()


@router.get("/{month}", response_model=BudgetResponse)
def get_month_budget(month: str):
    _validate_month(month)
    return BudgetResponse(month=month, budgets=get_budgets().get(month, {}))


@router.put("/{month}", response_model=BudgetResponse)
def set_month_budgets(month: str, body: BudgetBatch):
    """Batch-set budgets for a month. Existing entries are merged/overwritten."""
    _validate_month(month)
    cats = get_categories()
    unknown = [e.category for e in body.entries if e.category not in cats]
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown categories: {unknown}. Create them first.",
        )
    budgets = get_budgets()
    month_data = budgets.setdefault(month, {})
    for entry in body.entries:
        month_data[entry.category] = entry.amount
    save_budgets(budgets)
    return BudgetResponse(month=month, budgets=month_data)


@router.put("/{month}/{category}", response_model=BudgetResponse)
def set_single_budget(month: str, category: str, amount: float):
    """Set the budget for a single category in a month."""
    _validate_month(month)
    if category not in get_categories():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category}' not found.",
        )
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Amount must be positive.",
        )
    budgets = get_budgets()
    budgets.setdefault(month, {})[category] = amount
    save_budgets(budgets)
    return BudgetResponse(month=month, budgets=budgets[month])


@router.delete("/{month}/{category}", response_model=BudgetResponse)
def delete_budget_entry(month: str, category: str):
    _validate_month(month)
    budgets = get_budgets()
    if category not in budgets.get(month, {}):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No budget for '{category}' in {month}.",
        )
    del budgets[month][category]
    save_budgets(budgets)
    return BudgetResponse(month=month, budgets=budgets.get(month, {}))
