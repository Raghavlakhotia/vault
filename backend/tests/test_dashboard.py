"""
Dashboard router + services.build_dashboard.

The dashboard is the spend-tracking heart: rollover (carry-over of
unused budget), default-budget fallback, totals, and current-month
expense list. These tests pin the math.
"""

import pytest

from services import next_month, prev_month


# ── month helpers ─────────────────────────────────────────────────────────────

class TestMonthHelpers:
    @pytest.mark.parametrize("inp,out", [
        ("2026-04", "2026-03"),
        ("2026-01", "2025-12"),
        ("2026-12", "2026-11"),
    ])
    def test_prev_month(self, inp, out):
        assert prev_month(inp) == out

    @pytest.mark.parametrize("inp,out", [
        ("2026-04", "2026-05"),
        ("2026-12", "2027-01"),
        ("2026-01", "2026-02"),
    ])
    def test_next_month(self, inp, out):
        assert next_month(inp) == out


# ── /api/dashboard/{month} ────────────────────────────────────────────────────

@pytest.fixture
def with_categories(client, auth_headers):
    for name in ("Groceries", "Rent"):
        client.post("/api/categories/", headers=auth_headers, json={"name": name})


def _post_expense(client, headers, **kwargs):
    body = {
        "category": "Groceries",
        "amount": 100.0,
        "date": "2026-04-15",
        "description": "",
        "paid_by": "me",
        **kwargs,
    }
    return client.post("/api/expenses/", headers=headers, json=body)


class TestDashboard:
    def test_invalid_month(self, client, auth_headers):
        res = client.get("/api/dashboard/2026-13", headers=auth_headers)
        assert res.status_code == 422

    def test_empty_month_returns_zeroed_totals(self, client, auth_headers):
        res = client.get("/api/dashboard/2026-04", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert body["month"] == "2026-04"
        assert body["matrix"] == []
        assert body["totals"]["spent"] == 0
        assert body["expenses"] == []

    def test_uses_default_budget_when_no_month_override(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        # Spend the full prev-month default so rollover is 0; otherwise the
        # default applies retroactively and 5000 carries forward.
        _post_expense(client, auth_headers, amount=5000, date="2026-03-15")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        groc = next(r for r in body["matrix"] if r["category"] == "Groceries")
        assert groc["monthly_budget"] == 5000.0
        assert groc["prev_unused"] == 0.0
        assert groc["spent"] == 0
        assert groc["remaining"] == 5000.0

    def test_month_override_replaces_default(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 7000}]},
        )
        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        groc = next(r for r in body["matrix"] if r["category"] == "Groceries")
        assert groc["monthly_budget"] == 7000.0

    def test_current_month_spend_is_summed(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        # Burn the prev-month default so rollover is 0
        _post_expense(client, auth_headers, amount=5000, date="2026-03-10")

        _post_expense(client, auth_headers, amount=200, date="2026-04-01")
        _post_expense(client, auth_headers, amount=300, date="2026-04-15")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        groc = next(r for r in body["matrix"] if r["category"] == "Groceries")
        assert groc["spent"] == 500.0
        assert groc["remaining"] == 4500.0
        assert groc["pct_used"] == 10.0

    def test_rollover_carries_unused_prev_budget(
        self, client, auth_headers, with_categories
    ):
        # March budget 5000, spent 1000 → 4000 unused carries to April
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        _post_expense(client, auth_headers, amount=1000, date="2026-03-15")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        groc = next(r for r in body["matrix"] if r["category"] == "Groceries")
        assert groc["monthly_budget"] == 5000.0
        assert groc["prev_unused"] == 4000.0
        assert groc["cumulative"] == 9000.0

    def test_rollover_floor_at_zero_when_overspent(
        self, client, auth_headers, with_categories
    ):
        # Spent more than budget last month — prev_unused should be 0, not negative
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 1000}]},
        )
        _post_expense(client, auth_headers, amount=1500, date="2026-03-10")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        groc = next(r for r in body["matrix"] if r["category"] == "Groceries")
        assert groc["prev_unused"] == 0.0

    def test_totals_aggregate_across_categories(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [
                {"category": "Groceries", "amount": 5000},
                {"category": "Rent", "amount": 20000},
            ]},
        )
        # Burn the prev-month default so totals only reflect the current month
        _post_expense(client, auth_headers,
                      category="Groceries", amount=5000, date="2026-03-01")
        _post_expense(client, auth_headers,
                      category="Rent", amount=20000, date="2026-03-01")

        _post_expense(client, auth_headers,
                      category="Groceries", amount=500, date="2026-04-01")
        _post_expense(client, auth_headers,
                      category="Rent", amount=20000, date="2026-04-01")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        totals = body["totals"]
        assert totals["monthly_budget"] == 25000.0
        assert totals["spent"] == 20500.0
        assert totals["remaining"] == 4500.0

    def test_expenses_returned_sorted_by_date(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        _post_expense(client, auth_headers, amount=10, date="2026-04-25")
        _post_expense(client, auth_headers, amount=20, date="2026-04-05")
        _post_expense(client, auth_headers, amount=30, date="2026-04-15")

        body = client.get("/api/dashboard/2026-04", headers=auth_headers).json()
        dates = [e["date"] for e in body["expenses"]]
        assert dates == sorted(dates)
