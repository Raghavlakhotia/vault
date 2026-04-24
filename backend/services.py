"""Business logic — dashboard calculations, month helpers."""

from storage import get_budgets, get_expenses, get_categories
from models import DashboardRow, DashboardResponse, ExpenseOut


def prev_month(m: str) -> str:
    y, mo = map(int, m.split("-"))
    return f"{y-1}-12" if mo == 1 else f"{y}-{mo-1:02d}"


def next_month(m: str) -> str:
    y, mo = map(int, m.split("-"))
    return f"{y+1}-01" if mo == 12 else f"{y}-{mo+1:02d}"


def build_dashboard(month: str) -> DashboardResponse:
    prev = prev_month(month)
    cats    = get_categories()
    budgets = get_budgets()
    expenses = get_expenses()

    curr_budget = budgets.get(month, {})
    prev_budget = budgets.get(prev, {})

    prev_spent: dict[str, float] = {}
    curr_spent: dict[str, float] = {}
    curr_rows:  list[dict]       = []

    for e in expenses:
        em = e["date"][:7]
        if em == prev:
            prev_spent[e["category"]] = prev_spent.get(e["category"], 0) + e["amount"]
        elif em == month:
            curr_spent[e["category"]] = curr_spent.get(e["category"], 0) + e["amount"]
            curr_rows.append(e)

    matrix: list[DashboardRow] = []
    tot_monthly = tot_carry = tot_cumul = tot_spent = 0.0

    for cat in cats:
        monthly = curr_budget.get(cat, 0.0)
        carry   = max(0.0, prev_budget.get(cat, 0.0) - prev_spent.get(cat, 0.0))
        cumul   = monthly + carry
        spent   = curr_spent.get(cat, 0.0)
        rem     = cumul - spent
        pct     = round(spent / cumul * 100, 1) if cumul else 0.0

        matrix.append(DashboardRow(
            category=cat,
            monthly_budget=monthly,
            prev_unused=carry,
            cumulative=cumul,
            spent=spent,
            remaining=rem,
            pct_used=pct,
        ))
        tot_monthly += monthly
        tot_carry   += carry
        tot_cumul   += cumul
        tot_spent   += spent

    tot_rem = tot_cumul - tot_spent
    tot_pct = round(tot_spent / tot_cumul * 100, 1) if tot_cumul else 0.0

    totals = DashboardRow(
        category="TOTAL",
        monthly_budget=tot_monthly,
        prev_unused=tot_carry,
        cumulative=tot_cumul,
        spent=tot_spent,
        remaining=tot_rem,
        pct_used=tot_pct,
    )

    return DashboardResponse(
        month=month,
        matrix=matrix,
        totals=totals,
        expenses=[
            ExpenseOut(**{**e, "description": e.get("description", "")})
            for e in sorted(curr_rows, key=lambda x: x["date"])
        ],
    )
