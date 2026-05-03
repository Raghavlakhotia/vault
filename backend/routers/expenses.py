from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from models import ExpenseCreate, ExpenseOut
from storage import get_expenses, save_expenses, get_categories
from dependencies import require_auth

router = APIRouter()


def _to_out(e: dict) -> ExpenseOut:
    """Build an ExpenseOut, defaulting fields that may be missing on legacy rows."""
    return ExpenseOut(**{
        **e,
        "description": e.get("description", ""),
        "source":      e.get("source", ""),
    })


@router.get("/", response_model=list[ExpenseOut])
def list_expenses(month: Optional[str] = Query(None), current_user: str = Depends(require_auth)):
    expenses = get_expenses(current_user)
    if month:
        expenses = [e for e in expenses if e["date"][:7] == month]
    return [_to_out(e) for e in expenses]


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(body: ExpenseCreate, current_user: str = Depends(require_auth)):
    if body.category not in {c["name"] for c in get_categories(current_user)}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Category '{body.category}' not found.")
    expenses = get_expenses(current_user)
    record = {
        "id":          len(expenses) + 1,
        "amount":      body.amount,
        "category":    body.category,
        "description": body.description or "",
        "paid_by":     body.paid_by,
        "source":      body.source or "",
        "date":        body.date,
    }
    expenses.append(record)
    save_expenses(current_user, expenses)
    return _to_out(record)


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, current_user: str = Depends(require_auth)):
    for e in get_expenses(current_user):
        if e["id"] == expense_id:
            return _to_out(e)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    body: ExpenseCreate,
    current_user: str = Depends(require_auth),
):
    if body.category not in {c["name"] for c in get_categories(current_user)}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Category '{body.category}' not found.",
        )
    expenses = get_expenses(current_user)
    for e in expenses:
        if e["id"] == expense_id:
            e["amount"]      = body.amount
            e["category"]    = body.category
            e["description"] = body.description or ""
            e["paid_by"]     = body.paid_by
            e["source"]      = body.source or ""
            e["date"]        = body.date
            save_expenses(current_user, expenses)
            return _to_out(e)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, current_user: str = Depends(require_auth)):
    expenses = get_expenses(current_user)
    updated = [e for e in expenses if e["id"] != expense_id]
    if len(updated) == len(expenses):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    save_expenses(current_user, updated)
