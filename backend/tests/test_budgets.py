"""Budgets router — default budget, month budget, single category, delete."""

import pytest


@pytest.fixture
def with_categories(client, auth_headers):
    """Seed a few categories on the lakhotia user."""
    for name in ("Groceries", "Rent", "Travel"):
        client.post("/api/categories/", headers=auth_headers, json={"name": name})
    return ("Groceries", "Rent", "Travel")


# ── Default budget ────────────────────────────────────────────────────────────

class TestDefaultBudget:
    def test_empty_initially(self, client, auth_headers):
        res = client.get("/api/budgets/default", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == {"month": "default", "budgets": {}}

    def test_set_replaces_full_default(self, client, auth_headers, with_categories):
        res = client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [
                {"category": "Groceries", "amount": 5000},
                {"category": "Rent", "amount": 20000},
            ]},
        )
        assert res.status_code == 200
        assert res.json()["budgets"] == {"Groceries": 5000.0, "Rent": 20000.0}

        # Subsequent PUT replaces (not merges)
        res = client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "Travel", "amount": 3000}]},
        )
        assert res.json()["budgets"] == {"Travel": 3000.0}

    def test_unknown_category_rejected(self, client, auth_headers, with_categories):
        res = client.put(
            "/api/budgets/default",
            headers=auth_headers,
            json={"entries": [{"category": "MadeUp", "amount": 100}]},
        )
        assert res.status_code == 422


# ── Month budgets ─────────────────────────────────────────────────────────────

class TestMonthBudget:
    def test_invalid_month_rejected(self, client, auth_headers):
        res = client.get("/api/budgets/2026-13", headers=auth_headers)
        assert res.status_code == 422

    def test_get_returns_empty_for_unset_month(self, client, auth_headers):
        res = client.get("/api/budgets/2026-04", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == {"month": "2026-04", "budgets": {}}

    def test_put_merges_into_existing_month(self, client, auth_headers, with_categories):
        client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        # Add another category — first one stays
        res = client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Rent", "amount": 20000}]},
        )
        assert res.json()["budgets"] == {"Groceries": 5000.0, "Rent": 20000.0}

    def test_put_overwrites_existing_category(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 5000}]},
        )
        res = client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Groceries", "amount": 7000}]},
        )
        assert res.json()["budgets"]["Groceries"] == 7000.0

    def test_unknown_category_rejected(self, client, auth_headers, with_categories):
        res = client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Bogus", "amount": 100}]},
        )
        assert res.status_code == 422


# ── Single-category PUT and DELETE ────────────────────────────────────────────

class TestSingleBudget:
    def test_set_single_budget_for_month(self, client, auth_headers, with_categories):
        res = client.put(
            "/api/budgets/2026-04/Groceries?amount=4500",
            headers=auth_headers,
        )
        assert res.status_code == 200
        assert res.json()["budgets"] == {"Groceries": 4500.0}

    def test_unknown_category_404(self, client, auth_headers):
        res = client.put(
            "/api/budgets/2026-04/Mystery?amount=100",
            headers=auth_headers,
        )
        assert res.status_code == 404

    def test_zero_or_negative_amount_rejected(
        self, client, auth_headers, with_categories
    ):
        res = client.put(
            "/api/budgets/2026-04/Groceries?amount=0",
            headers=auth_headers,
        )
        assert res.status_code == 422
        res = client.put(
            "/api/budgets/2026-04/Groceries?amount=-100",
            headers=auth_headers,
        )
        assert res.status_code == 422

    def test_delete_removes_category_from_month(
        self, client, auth_headers, with_categories
    ):
        client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [
                {"category": "Groceries", "amount": 5000},
                {"category": "Rent", "amount": 20000},
            ]},
        )
        res = client.delete(
            "/api/budgets/2026-04/Groceries", headers=auth_headers
        )
        assert res.status_code == 200
        assert res.json()["budgets"] == {"Rent": 20000.0}

    def test_delete_missing_entry_404(self, client, auth_headers):
        res = client.delete(
            "/api/budgets/2026-04/Nope", headers=auth_headers
        )
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_one_user_does_not_see_others_budgets(
        self, client, auth_headers, test_user_headers
    ):
        # Set up categories + budget on lakhotia
        client.post("/api/categories/", headers=auth_headers, json={"name": "Lk"})
        client.put(
            "/api/budgets/2026-04",
            headers=auth_headers,
            json={"entries": [{"category": "Lk", "amount": 9999}]},
        )
        # test user has no budgets
        res = client.get("/api/budgets/2026-04", headers=test_user_headers)
        assert res.status_code == 200
        assert res.json()["budgets"] == {}
