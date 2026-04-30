from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from models import ExpenseCreate, ExpenseOut
from storage import get_expenses, save_expenses, get_categories

router = APIRouter()


@router.get("/", response_model=list[ExpenseOut])
def list_expenses(month: Optional[str] = Query(None, description="Filter by YYYY-MM")):
    expenses = get_expenses()
    if month:
        expenses = [e for e in expenses if e["date"][:7] == month]
    return [ExpenseOut(**{**e, "description": e.get("description", "")}) for e in expenses]


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(body: ExpenseCreate):
    if body.category not in get_categories():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Category '{body.category}' not found.",
        )
    expenses = get_expenses()
    record = {
        "id":          len(expenses) + 1,
        "amount":      body.amount,
        "category":    body.category,
        "description": body.description or "",
        "paid_by":     body.paid_by,
        "date":        body.date,
    }
    expenses.append(record)
    save_expenses(expenses)
    return ExpenseOut(**record)


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int):
    for e in get_expenses():
        if e["id"] == expense_id:
            return ExpenseOut(**{**e, "description": e.get("description", "")})
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int):
    expenses = get_expenses()
    updated  = [e for e in expenses if e["id"] != expense_id]
    if len(updated) == len(expenses):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    save_expenses(updated)
