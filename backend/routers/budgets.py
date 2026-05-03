from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models import BudgetBatch, BudgetResponse
from storage import get_budgets, save_budgets, get_categories
from dependencies import require_auth

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Month must be in YYYY-MM format.")


@router.get("/", response_model=dict[str, dict[str, float]])
def list_all_budgets(current_user: str = Depends(require_auth)):
    return get_budgets(current_user)


@router.get("/default", response_model=BudgetResponse)
def get_default_budget(current_user: str = Depends(require_auth)):
    return BudgetResponse(month="default", budgets=get_budgets(current_user).get("default", {}))


@router.put("/default", response_model=BudgetResponse)
def set_default_budget(body: BudgetBatch, current_user: str = Depends(require_auth)):
    cats = {c["name"] for c in get_categories(current_user)}
    unknown = [e.category for e in body.entries if e.category not in cats]
    if unknown:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown categories: {unknown}. Create them first.")
    budgets = get_budgets(current_user)
    budgets["default"] = {e.category: e.amount for e in body.entries}
    save_budgets(current_user, budgets)
    return BudgetResponse(month="default", budgets=budgets["default"])


@router.get("/{month}", response_model=BudgetResponse)
def get_month_budget(month: str, current_user: str = Depends(require_auth)):
    _validate_month(month)
    return BudgetResponse(month=month, budgets=get_budgets(current_user).get(month, {}))


@router.put("/{month}", response_model=BudgetResponse)
def set_month_budgets(month: str, body: BudgetBatch, current_user: str = Depends(require_auth)):
    _validate_month(month)
    cats = {c["name"] for c in get_categories(current_user)}
    unknown = [e.category for e in body.entries if e.category not in cats]
    if unknown:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown categories: {unknown}. Create them first.")
    budgets = get_budgets(current_user)
    month_data = budgets.setdefault(month, {})
    for entry in body.entries:
        month_data[entry.category] = entry.amount
    save_budgets(current_user, budgets)
    return BudgetResponse(month=month, budgets=month_data)


@router.put("/{month}/{category}", response_model=BudgetResponse)
def set_single_budget(month: str, category: str, amount: float, current_user: str = Depends(require_auth)):
    _validate_month(month)
    if category not in {c["name"] for c in get_categories(current_user)}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category '{category}' not found.")
    if amount <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Amount must be positive.")
    budgets = get_budgets(current_user)
    budgets.setdefault(month, {})[category] = amount
    save_budgets(current_user, budgets)
    return BudgetResponse(month=month, budgets=budgets[month])


@router.delete("/{month}/{category}", response_model=BudgetResponse)
def delete_budget_entry(month: str, category: str, current_user: str = Depends(require_auth)):
    _validate_month(month)
    budgets = get_budgets(current_user)
    if category not in budgets.get(month, {}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No budget for '{category}' in {month}.")
    del budgets[month][category]
    save_budgets(current_user, budgets)
    return BudgetResponse(month=month, budgets=budgets.get(month, {}))
