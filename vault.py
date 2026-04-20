#!/usr/bin/env python3
"""vault — terminal budget manager"""

import argparse
import json
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.table import Table
from rich.prompt import Prompt, FloatPrompt
from rich import box
from rich.panel import Panel
from rich.text import Text

DATA_DIR = Path(__file__).parent / "data"
CATEGORIES_FILE = DATA_DIR / "categories.json"
BUDGETS_FILE    = DATA_DIR / "budgets.json"
EXPENSES_FILE   = DATA_DIR / "expenses.json"

console = Console()


# ── storage helpers ────────────────────────────────────────────────────────────

def _bootstrap():
    DATA_DIR.mkdir(exist_ok=True)
    if not CATEGORIES_FILE.exists():
        CATEGORIES_FILE.write_text("[]")
    if not BUDGETS_FILE.exists():
        BUDGETS_FILE.write_text("{}")
    if not EXPENSES_FILE.exists():
        EXPENSES_FILE.write_text("[]")

def _load(path: Path):
    return json.loads(path.read_text())

def _save(path: Path, data):
    path.write_text(json.dumps(data, indent=2, default=str))

def _categories():
    return _load(CATEGORIES_FILE)

def _budgets():
    return _load(BUDGETS_FILE)

def _expenses():
    return _load(EXPENSES_FILE)


# ── validation helpers ─────────────────────────────────────────────────────────

def _pick_category(prompt_text="Category") -> str:
    cats = _categories()
    if not cats:
        console.print("[red]No categories found.[/red] Run [bold]vault.py --create_category[/bold] first.")
        sys.exit(1)
    console.print(f"[dim]Available:[/dim] {', '.join(cats)}")
    while True:
        val = Prompt.ask(prompt_text).strip()
        if val in cats:
            return val
        console.print(f"[red]'{val}' not found.[/red] Choose from: {', '.join(cats)}")

def _parse_month(s: str) -> str:
    try:
        datetime.strptime(s, "%Y-%m")
        return s
    except ValueError:
        console.print(f"[red]Invalid month '{s}'. Use YYYY-MM.[/red]")
        sys.exit(1)

def _parse_date(s: str) -> str:
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return s
    except ValueError:
        console.print(f"[red]Invalid date '{s}'. Use YYYY-MM-DD.[/red]")
        sys.exit(1)

def _prev_month(month_str: str) -> str:
    y, m = map(int, month_str.split("-"))
    return f"{y-1}-12" if m == 1 else f"{y}-{m-1:02d}"


# ── commands ───────────────────────────────────────────────────────────────────

def cmd_create_category():
    cats = _load(CATEGORIES_FILE)
    console.print(Panel("[bold cyan]Create Category[/bold cyan]", expand=False))
    name = Prompt.ask("Category name").strip()
    if not name:
        console.print("[red]Name cannot be empty.[/red]")
        return
    if name in cats:
        console.print(f"[yellow]'{name}' already exists.[/yellow]")
        return
    cats.append(name)
    _save(CATEGORIES_FILE, cats)
    console.print(f"[green]✓[/green] Category [bold]{name}[/bold] created.")


def cmd_update_budget():
    console.print(Panel("[bold cyan]Update Monthly Budget[/bold cyan]", expand=False))
    category = _pick_category()
    default_month = datetime.now().strftime("%Y-%m")
    month_str = Prompt.ask("Month (YYYY-MM)", default=default_month).strip()
    month_str = _parse_month(month_str)
    amount = FloatPrompt.ask("Budget amount (₹)")
    if amount <= 0:
        console.print("[red]Amount must be positive.[/red]")
        return
    budgets = _budgets()
    budgets.setdefault(month_str, {})[category] = amount
    _save(BUDGETS_FILE, budgets)
    console.print(f"[green]✓[/green] [bold]{category}[/bold] budget for {month_str} → [bold]₹{amount:,.2f}[/bold]")


def cmd_add_expense():
    console.print(Panel("[bold cyan]Add Expense[/bold cyan]", expand=False))
    amount = FloatPrompt.ask("Amount (₹)")
    if amount <= 0:
        console.print("[red]Amount must be positive.[/red]")
        return
    category = _pick_category()
    description = Prompt.ask("Description", default="").strip()
    paid_by = Prompt.ask("Paid by").strip()
    if not paid_by:
        console.print("[red]'Paid by' cannot be empty.[/red]")
        return
    default_date = date.today().isoformat()
    date_str = Prompt.ask("Date (YYYY-MM-DD)", default=default_date).strip()
    date_str = _parse_date(date_str)

    expenses = _expenses()
    expenses.append({
        "id": len(expenses) + 1,
        "amount": amount,
        "category": category,
        "description": description,
        "paid_by": paid_by,
        "date": date_str,
    })
    _save(EXPENSES_FILE, expenses)
    console.print(f"[green]✓[/green] ₹{amount:,.2f} in [bold]{category}[/bold] on {date_str}.")


def cmd_show(month_str: Optional[str] = None):
    month_str = month_str or datetime.now().strftime("%Y-%m")
    _parse_month(month_str)
    prev = _prev_month(month_str)

    categories = _categories()
    budgets    = _budgets()
    expenses   = _expenses()

    curr_budget = budgets.get(month_str, {})
    prev_budget = budgets.get(prev, {})

    # bucket expenses
    prev_spent: dict[str, float] = {}
    curr_spent: dict[str, float] = {}
    curr_rows:  list[dict]       = []

    for e in expenses:
        em = e["date"][:7]
        if em == prev:
            prev_spent[e["category"]] = prev_spent.get(e["category"], 0) + e["amount"]
        elif em == month_str:
            curr_spent[e["category"]] = curr_spent.get(e["category"], 0) + e["amount"]
            curr_rows.append(e)

    # ── Budget matrix ──────────────────────────────────────────────────────────
    t = Table(
        title=f"[bold]Budget Matrix — {month_str}[/bold]",
        box=box.ROUNDED,
        show_lines=True,
        header_style="bold white on dark_blue",
    )
    t.add_column("Category",          style="bold cyan",   min_width=14)
    t.add_column("Monthly Budget",    justify="right",     style="green",       min_width=16)
    t.add_column("Prev Unused",       justify="right",     style="yellow",      min_width=12)
    t.add_column("Cumulative",        justify="right",     style="bold green",  min_width=13)
    t.add_column("Spent",             justify="right",     style="red",         min_width=10)
    t.add_column("Remaining",         justify="right",                          min_width=12)
    t.add_column("% Used",            justify="right",                          min_width=8)

    tot_monthly = tot_carryover = tot_cumulative = tot_spent = 0.0

    for cat in categories:
        monthly    = curr_budget.get(cat, 0.0)
        carryover  = max(0.0, prev_budget.get(cat, 0.0) - prev_spent.get(cat, 0.0))
        cumulative = monthly + carryover
        spent      = curr_spent.get(cat, 0.0)
        remaining  = cumulative - spent
        pct        = (spent / cumulative * 100) if cumulative else 0.0

        rem_style = "red" if remaining < 0 else "green"
        pct_style = "red" if pct > 90 else "yellow" if pct > 70 else "green"

        t.add_row(
            cat,
            f"₹{monthly:>10,.2f}",
            f"₹{carryover:>10,.2f}",
            f"₹{cumulative:>10,.2f}",
            f"₹{spent:>10,.2f}",
            f"[{rem_style}]₹{remaining:>10,.2f}[/{rem_style}]",
            f"[{pct_style}]{pct:>6.1f}%[/{pct_style}]",
        )
        tot_monthly    += monthly
        tot_carryover  += carryover
        tot_cumulative += cumulative
        tot_spent      += spent

    tot_rem = tot_cumulative - tot_spent
    tot_pct = (tot_spent / tot_cumulative * 100) if tot_cumulative else 0.0
    rem_style = "red" if tot_rem < 0 else "green"
    pct_style = "red" if tot_pct > 90 else "yellow" if tot_pct > 70 else "green"

    t.add_section()
    t.add_row(
        "[bold]TOTAL[/bold]",
        f"[bold]₹{tot_monthly:>10,.2f}[/bold]",
        f"[bold]₹{tot_carryover:>10,.2f}[/bold]",
        f"[bold]₹{tot_cumulative:>10,.2f}[/bold]",
        f"[bold]₹{tot_spent:>10,.2f}[/bold]",
        f"[bold][{rem_style}]₹{tot_rem:>10,.2f}[/{rem_style}][/bold]",
        f"[bold][{pct_style}]{tot_pct:>6.1f}%[/{pct_style}][/bold]",
    )

    console.print()
    console.print(t)

    # ── Expense sheet ──────────────────────────────────────────────────────────
    if not curr_rows:
        console.print(f"\n[dim]No expenses recorded for {month_str}.[/dim]\n")
        return

    et = Table(
        title=f"[bold]Expense Sheet — {month_str}[/bold]",
        box=box.SIMPLE_HEAVY,
        show_lines=True,
        header_style="bold white on dark_blue",
    )
    et.add_column("#",           justify="right",  style="dim",    width=4)
    et.add_column("Date",        style="cyan",     min_width=12)
    et.add_column("Category",    style="yellow",   min_width=14)
    et.add_column("Amount",      justify="right",  style="red",    min_width=12)
    et.add_column("Paid By",     style="blue",     min_width=12)
    et.add_column("Description",                   min_width=20)

    for i, e in enumerate(sorted(curr_rows, key=lambda x: x["date"]), 1):
        et.add_row(
            str(i),
            e["date"],
            e["category"],
            f"₹{e['amount']:,.2f}",
            e["paid_by"],
            e.get("description", ""),
        )

    console.print(et)
    console.print()


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    _bootstrap()

    parser = argparse.ArgumentParser(
        prog="vault",
        description="vault — terminal budget manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  vault.py --create_category\n"
            "  vault.py --update_budget\n"
            "  vault.py --add_expense\n"
            "  vault.py --show\n"
            "  vault.py --show --month 2026-03\n"
        ),
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--create_category", action="store_true", help="Define a new spending category")
    group.add_argument("--update_budget",   action="store_true", help="Set monthly budget for a category")
    group.add_argument("--add_expense",     action="store_true", help="Record an expense")
    group.add_argument("--show",            action="store_true", help="Show dashboard")
    parser.add_argument("--month", metavar="YYYY-MM", help="Month for --show (default: current month)")

    args = parser.parse_args()

    if args.create_category:
        cmd_create_category()
    elif args.update_budget:
        cmd_update_budget()
    elif args.add_expense:
        cmd_add_expense()
    elif args.show:
        cmd_show(args.month)


if __name__ == "__main__":
    main()
