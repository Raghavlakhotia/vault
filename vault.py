#!/usr/bin/env python3
"""vault — terminal budget manager"""

import json
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from textual import on
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, ScrollableContainer
from textual.reactive import reactive
from textual.widgets import (
    Button, DataTable, Footer, Header,
    Input, Label, Select, TabbedContent, TabPane,
)
from rich.text import Text


# ── Data layer ─────────────────────────────────────────────────────────────────

DATA_DIR        = Path(__file__).parent / "data"
CATEGORIES_FILE = DATA_DIR / "categories.json"
BUDGETS_FILE    = DATA_DIR / "budgets.json"
EXPENSES_FILE   = DATA_DIR / "expenses.json"


def bootstrap() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    for f, d in [(CATEGORIES_FILE, "[]"), (BUDGETS_FILE, "{}"), (EXPENSES_FILE, "[]")]:
        if not f.exists():
            f.write_text(d)


def _load(p: Path):           return json.loads(p.read_text())
def _save(p: Path, d) -> None: p.write_text(json.dumps(d, indent=2, default=str))
def get_cats():               return _load(CATEGORIES_FILE)
def get_budgets():            return _load(BUDGETS_FILE)
def get_expenses():           return _load(EXPENSES_FILE)


def prev_month(m: str) -> str:
    y, mo = map(int, m.split("-"))
    return f"{y-1}-12" if mo == 1 else f"{y}-{mo-1:02d}"

def next_month(m: str) -> str:
    y, mo = map(int, m.split("-"))
    return f"{y+1}-01" if mo == 12 else f"{y}-{mo+1:02d}"

def parse_amount(raw: str) -> Optional[float]:
    raw = raw.strip().lower().replace(",", "")
    if raw.endswith("k"):
        try: return float(raw[:-1]) * 1000
        except ValueError: return None
    try: return float(raw)
    except ValueError: return None

def sid(s: str) -> str:
    return "".join(c if c.isalnum() else "-" for c in s).lower()


_NOW = datetime.now().strftime("%Y-%m")


# ── CSS ────────────────────────────────────────────────────────────────────────

APP_CSS = """
/* ── Layout ── */
Screen        { background: $background; }
TabbedContent { height: 1fr; }
TabPane       { padding: 1 2; }

/* ── Month nav bar ── */
.month-nav {
    height: 3;
    align: center middle;
    margin-bottom: 1;
    background: $panel;
    border: solid $primary-darken-3;
}
.month-label {
    width: 18;
    content-align: center middle;
    text-style: bold;
    color: $accent;
}
.nav-btn {
    min-width: 6;
    border: none;
    background: $surface-lighten-1;
}

/* ── Section headings ── */
.section-title {
    text-style: bold;
    color: $text;
    background: $panel;
    padding: 0 1;
    height: 1;
    margin-bottom: 1;
}

/* ── Tables ── */
DataTable {
    max-height: 20;
    border: solid $primary-darken-3;
    margin-bottom: 1;
}

/* ── Budget form ── */
.budget-row  { height: 3; align: left middle; }
.budget-cat  { width: 24; padding-left: 1; content-align: left middle; color: $accent; }
Input.b-inp  { width: 20; }

/* ── Expense form ── */
.exp-form {
    background: $panel;
    border: solid $primary-darken-3;
    padding: 1 2;
    height: auto;
    margin-bottom: 1;
}
.form-row { height: 3; margin-bottom: 1; align: left middle; }
.form-lbl { width: 14; content-align: left middle; color: $text-muted; }

/* ── Category form ── */
.cat-row { height: 3; margin-top: 1; align: left middle; }

/* ── Shared ── */
Button { margin: 0 1; }
"""


# ── App ────────────────────────────────────────────────────────────────────────

class VaultApp(App):
    CSS   = APP_CSS
    TITLE = "Vault — Budget Manager"
    DARK  = True

    BINDINGS = [
        Binding("q",      "quit",       "Quit",        priority=True),
        Binding("comma",  "prev_month", "◀ Month"),
        Binding("period", "next_month", "▶ Month"),
        Binding("r",      "refresh",    "Refresh"),
        Binding("1",      "go_dash",    "Dashboard"),
        Binding("2",      "go_cats",    "Categories"),
        Binding("3",      "go_budget",  "Budget"),
        Binding("4",      "go_exp",     "Expenses"),
    ]

    month: reactive[str] = reactive(_NOW)

    # ── Compose ───────────────────────────────────────────────────────────────

    def compose(self) -> ComposeResult:
        yield Header()
        with TabbedContent(id="tabs"):

            # 1. Dashboard
            with TabPane("📊  Dashboard", id="tab-dashboard"):
                with Horizontal(classes="month-nav"):
                    yield Button("◀", id="d-prev", classes="nav-btn")
                    yield Label(_NOW, id="d-month", classes="month-label")
                    yield Button("▶", id="d-next", classes="nav-btn")
                yield Label("Budget Matrix", classes="section-title")
                yield DataTable(id="t-matrix",   zebra_stripes=True, cursor_type="row")
                yield Label("Expense Sheet", classes="section-title")
                yield DataTable(id="t-dash-exp", zebra_stripes=True, cursor_type="row")

            # 2. Categories
            with TabPane("🗂   Categories", id="tab-cats"):
                yield Label("All Categories", classes="section-title")
                yield DataTable(id="t-cats", zebra_stripes=True, cursor_type="row")
                with Horizontal(classes="cat-row"):
                    yield Input(placeholder="New category name…", id="inp-cat")
                    yield Button("Add",    id="btn-add-cat", variant="success")
                    yield Button("Delete", id="btn-del-cat", variant="error")

            # 3. Budget
            with TabPane("💰  Budget", id="tab-budget"):
                with Horizontal(classes="month-nav"):
                    yield Button("◀", id="b-prev", classes="nav-btn")
                    yield Label(_NOW, id="b-month", classes="month-label")
                    yield Button("▶", id="b-next", classes="nav-btn")
                yield Label("Monthly Budgets  (supports 5k, 10k)", classes="section-title")
                yield ScrollableContainer(id="budget-form")
                yield Button("💾  Save Budgets", id="btn-save-bud", variant="success")

            # 4. Expenses
            with TabPane("💸  Expenses", id="tab-expenses"):
                with Container(classes="exp-form"):
                    with Horizontal(classes="form-row"):
                        yield Label("Amount (₹)", classes="form-lbl")
                        yield Input(placeholder="500 or 2k", id="inp-amt")
                        yield Label("Category",   classes="form-lbl")
                        yield Select([], id="sel-cat", prompt="Select category…")
                    with Horizontal(classes="form-row"):
                        yield Label("Paid By", classes="form-lbl")
                        yield Input(placeholder="Name", id="inp-paidby")
                        yield Label("Date",    classes="form-lbl")
                        yield Input(value=date.today().isoformat(), id="inp-edate")
                    with Horizontal(classes="form-row"):
                        yield Label("Description", classes="form-lbl")
                        yield Input(placeholder="Optional", id="inp-desc")
                        yield Button("➕  Add Expense", id="btn-add-exp", variant="success")
                yield Label("All Expenses", classes="section-title")
                yield DataTable(id="t-exp-list", zebra_stripes=True, cursor_type="row")

        yield Footer()

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    def on_mount(self) -> None:
        self.action_refresh()

    def watch_month(self, m: str) -> None:
        for wid in ("#d-month", "#b-month"):
            try: self.query_one(wid, Label).update(m)
            except Exception: pass
        self._build_dashboard()
        self._rebuild_budget_form()

    # ── Dashboard ─────────────────────────────────────────────────────────────

    def _build_dashboard(self) -> None:
        m, prev = self.month, prev_month(self.month)
        cats = get_cats()
        bud  = get_budgets()
        exps = get_expenses()
        cb, pb = bud.get(m, {}), bud.get(prev, {})

        ps: dict = {}   # prev spent
        cs: dict = {}   # curr spent
        cr: list = []   # curr rows

        for e in exps:
            em = e["date"][:7]
            if em == prev:
                ps[e["category"]] = ps.get(e["category"], 0) + e["amount"]
            elif em == m:
                cs[e["category"]] = cs.get(e["category"], 0) + e["amount"]
                cr.append(e)

        # ── budget matrix ──────────────────────────────────────────────────
        try: dt = self.query_one("#t-matrix", DataTable)
        except Exception: return

        dt.clear(columns=True)
        dt.add_columns(
            "Category", "Monthly Budget", "Prev Unused",
            "Cumulative", "Spent", "Remaining", "% Used",
        )

        tots = [0.0, 0.0, 0.0, 0.0]  # monthly, carry, cumul, spent
        for cat in cats:
            mon   = cb.get(cat, 0.0)
            carry = max(0.0, pb.get(cat, 0.0) - ps.get(cat, 0.0))
            cumul = mon + carry
            sp    = cs.get(cat, 0.0)
            rem   = cumul - sp
            pct   = sp / cumul * 100 if cumul else 0.0

            dt.add_row(
                cat,
                f"₹{mon:,.0f}",
                f"₹{carry:,.0f}",
                f"₹{cumul:,.0f}",
                f"₹{sp:,.0f}",
                Text(f"₹{rem:,.0f}", style="red" if rem < 0 else "green"),
                Text(f"{pct:.1f}%",  style="red" if pct > 90 else "yellow" if pct > 70 else "green"),
            )
            for i, v in enumerate([mon, carry, cumul, sp]):
                tots[i] += v

        tr = tots[2] - tots[3]
        tp = tots[3] / tots[2] * 100 if tots[2] else 0.0
        dt.add_row(
            Text("TOTAL", style="bold"),
            Text(f"₹{tots[0]:,.0f}", style="bold"),
            Text(f"₹{tots[1]:,.0f}", style="bold"),
            Text(f"₹{tots[2]:,.0f}", style="bold"),
            Text(f"₹{tots[3]:,.0f}", style="bold"),
            Text(f"₹{tr:,.0f}", style="bold red"    if tr < 0 else "bold green"),
            Text(f"{tp:.1f}%",  style="bold red"    if tp > 90 else "bold yellow" if tp > 70 else "bold green"),
        )

        # ── expense sheet ──────────────────────────────────────────────────
        try: et = self.query_one("#t-dash-exp", DataTable)
        except Exception: return

        et.clear(columns=True)
        et.add_columns("#", "Date", "Category", "Amount", "Paid By", "Description")
        for i, e in enumerate(sorted(cr, key=lambda x: x["date"]), 1):
            et.add_row(
                str(i), e["date"], e["category"],
                f"₹{e['amount']:,.0f}", e["paid_by"], e.get("description", ""),
            )

    # ── Categories ────────────────────────────────────────────────────────────

    def _build_cat_table(self) -> None:
        try: dt = self.query_one("#t-cats", DataTable)
        except Exception: return
        dt.clear(columns=True)
        dt.add_columns("#", "Category")
        for i, c in enumerate(get_cats(), 1):
            dt.add_row(str(i), c)

    def _refresh_cat_select(self) -> None:
        try:
            self.query_one("#sel-cat", Select).set_options(
                [(c, c) for c in get_cats()]
            )
        except Exception: pass

    def _add_category(self) -> None:
        inp  = self.query_one("#inp-cat", Input)
        name = inp.value.strip()
        if not name:
            self.notify("Enter a category name", severity="warning"); return
        cs = get_cats()
        if name in cs:
            self.notify(f"'{name}' already exists", severity="warning"); return
        cs.append(name)
        _save(CATEGORIES_FILE, cs)
        inp.value = ""
        self._build_cat_table()
        self._refresh_cat_select()
        self._rebuild_budget_form()
        self.notify(f"'{name}' added ✓")

    def _delete_category(self) -> None:
        dt = self.query_one("#t-cats", DataTable)
        if not dt.row_count:
            self.notify("No categories to delete", severity="warning"); return
        try:
            name = str(dt.get_row_at(dt.cursor_row)[1])
        except Exception:
            self.notify("Select a row first", severity="warning"); return
        cs = get_cats()
        if name not in cs: return
        cs.remove(name)
        _save(CATEGORIES_FILE, cs)
        self._build_cat_table()
        self._refresh_cat_select()
        self._rebuild_budget_form()
        self.notify(f"Deleted '{name}'", severity="warning")

    # ── Budget ────────────────────────────────────────────────────────────────

    def _rebuild_budget_form(self) -> None:
        try: container = self.query_one("#budget-form", ScrollableContainer)
        except Exception: return
        container.remove_children()
        md = get_budgets().get(self.month, {})
        for cat in get_cats():
            existing = md.get(cat, "")
            container.mount(Horizontal(
                Label(cat, classes="budget-cat"),
                Input(
                    value=f"{int(existing)}" if existing else "",
                    placeholder="5000 or 10k",
                    id=f"bi-{sid(cat)}",
                    classes="b-inp",
                ),
                classes="budget-row",
            ))

    def _save_budgets(self) -> None:
        bd = get_budgets()
        md = bd.setdefault(self.month, {})
        saved = []
        for cat in get_cats():
            try:
                raw = self.query_one(f"#bi-{sid(cat)}", Input).value.strip()
            except Exception: continue
            if not raw: continue
            amt = parse_amount(raw)
            if amt is None or amt < 0:
                self.notify(f"Invalid value for '{cat}'", severity="error"); return
            md[cat] = amt
            saved.append(cat)
        if saved:
            _save(BUDGETS_FILE, bd)
            self._build_dashboard()
            self.notify(f"Saved {len(saved)} budget(s) for {self.month} ✓")
        else:
            self.notify("Nothing to save", severity="warning")

    # ── Expenses ──────────────────────────────────────────────────────────────

    def _build_exp_list(self) -> None:
        try: dt = self.query_one("#t-exp-list", DataTable)
        except Exception: return
        dt.clear(columns=True)
        dt.add_columns("#", "Date", "Category", "Amount", "Paid By", "Description")
        for i, e in enumerate(
            sorted(get_expenses(), key=lambda x: x["date"], reverse=True), 1
        ):
            dt.add_row(
                str(i), e["date"], e["category"],
                f"₹{e['amount']:,.0f}", e["paid_by"], e.get("description", ""),
            )

    def _add_expense(self) -> None:
        amt_raw = self.query_one("#inp-amt",    Input).value
        cat     = self.query_one("#sel-cat",    Select).value
        paid_by = self.query_one("#inp-paidby", Input).value.strip()
        exp_dt  = self.query_one("#inp-edate",  Input).value.strip()
        desc    = self.query_one("#inp-desc",   Input).value.strip()

        amt = parse_amount(amt_raw)
        if not amt or amt <= 0:
            self.notify("Invalid amount", severity="error"); return
        if cat is Select.BLANK:
            self.notify("Select a category", severity="error"); return
        if not paid_by:
            self.notify("'Paid By' is required", severity="error"); return
        try: datetime.strptime(exp_dt, "%Y-%m-%d")
        except ValueError:
            self.notify("Invalid date — use YYYY-MM-DD", severity="error"); return

        exps = get_expenses()
        exps.append({
            "id": len(exps) + 1, "amount": amt, "category": cat,
            "description": desc, "paid_by": paid_by, "date": exp_dt,
        })
        _save(EXPENSES_FILE, exps)

        self.query_one("#inp-amt",    Input).value = ""
        self.query_one("#inp-paidby", Input).value = ""
        self.query_one("#inp-desc",   Input).value = ""
        self.query_one("#inp-edate",  Input).value = date.today().isoformat()

        self._build_dashboard()
        self._build_exp_list()
        self.notify(f"Added ₹{amt:,.0f} → {cat} ✓")

    # ── Button handler ────────────────────────────────────────────────────────

    @on(Button.Pressed)
    def on_button_pressed(self, event: Button.Pressed) -> None:
        bid = event.button.id
        if   bid in ("d-prev", "b-prev"): self.month = prev_month(self.month)
        elif bid in ("d-next", "b-next"): self.month = next_month(self.month)
        elif bid == "btn-add-cat":         self._add_category()
        elif bid == "btn-del-cat":         self._delete_category()
        elif bid == "btn-save-bud":        self._save_budgets()
        elif bid == "btn-add-exp":         self._add_expense()

    # ── Actions ───────────────────────────────────────────────────────────────

    def action_prev_month(self): self.month = prev_month(self.month)
    def action_next_month(self): self.month = next_month(self.month)

    def action_refresh(self) -> None:
        self._build_dashboard()
        self._build_cat_table()
        self._rebuild_budget_form()
        self._build_exp_list()
        self._refresh_cat_select()

    def action_go_dash(self):   self.query_one("#tabs", TabbedContent).active = "tab-dashboard"
    def action_go_cats(self):   self.query_one("#tabs", TabbedContent).active = "tab-cats"
    def action_go_budget(self): self.query_one("#tabs", TabbedContent).active = "tab-budget"
    def action_go_exp(self):    self.query_one("#tabs", TabbedContent).active = "tab-expenses"


# ── Entry ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    bootstrap()
    VaultApp().run()
