"""Expenses router."""

import pytest


@pytest.fixture
def with_categories(client, auth_headers):
    for name in ("Groceries", "Rent", "Travel"):
        client.post("/api/categories/", headers=auth_headers, json={"name": name})


def _expense(category="Groceries", amount=100.0, date="2026-04-15", desc="", paid_by="me"):
    return {
        "category": category,
        "amount": amount,
        "date": date,
        "description": desc,
        "paid_by": paid_by,
    }


class TestCreate:
    def test_creates_expense_with_id_1(self, client, auth_headers, with_categories):
        res = client.post("/api/expenses/", headers=auth_headers, json=_expense())
        assert res.status_code == 201
        body = res.json()
        assert body["id"] == 1
        assert body["amount"] == 100.0
        assert body["category"] == "Groceries"

    def test_assigns_incrementing_ids(self, client, auth_headers, with_categories):
        client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=10))
        client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=20))
        res = client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=30))
        assert res.json()["id"] == 3

    def test_unknown_category_rejected(self, client, auth_headers, with_categories):
        res = client.post(
            "/api/expenses/",
            headers=auth_headers,
            json=_expense(category="Mystery"),
        )
        assert res.status_code == 422

    def test_description_defaults_to_empty(
        self, client, auth_headers, with_categories
    ):
        res = client.post(
            "/api/expenses/",
            headers=auth_headers,
            json={
                "category": "Groceries", "amount": 50,
                "date": "2026-04-01", "paid_by": "me",
            },
        )
        assert res.status_code == 201
        assert res.json()["description"] == ""


class TestList:
    def test_returns_all_when_no_month_filter(
        self, client, auth_headers, with_categories
    ):
        client.post("/api/expenses/", headers=auth_headers,
                    json=_expense(date="2026-03-15"))
        client.post("/api/expenses/", headers=auth_headers,
                    json=_expense(date="2026-04-15"))
        res = client.get("/api/expenses/", headers=auth_headers)
        assert res.status_code == 200
        assert len(res.json()) == 2

    def test_filters_by_month(self, client, auth_headers, with_categories):
        client.post("/api/expenses/", headers=auth_headers,
                    json=_expense(date="2026-03-15", amount=10))
        client.post("/api/expenses/", headers=auth_headers,
                    json=_expense(date="2026-04-15", amount=20))
        client.post("/api/expenses/", headers=auth_headers,
                    json=_expense(date="2026-04-30", amount=30))

        res = client.get("/api/expenses/?month=2026-04", headers=auth_headers)
        assert res.status_code == 200
        assert {e["amount"] for e in res.json()} == {20.0, 30.0}


class TestGet:
    def test_returns_expense_by_id(self, client, auth_headers, with_categories):
        client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=11))
        res = client.get("/api/expenses/1", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["amount"] == 11.0

    def test_unknown_id_404(self, client, auth_headers):
        res = client.get("/api/expenses/9999", headers=auth_headers)
        assert res.status_code == 404


class TestDelete:
    def test_removes_expense(self, client, auth_headers, with_categories):
        client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=11))
        client.post("/api/expenses/", headers=auth_headers, json=_expense(amount=22))

        res = client.delete("/api/expenses/1", headers=auth_headers)
        assert res.status_code == 204

        remaining = client.get("/api/expenses/", headers=auth_headers).json()
        assert len(remaining) == 1
        assert remaining[0]["amount"] == 22.0

    def test_unknown_id_404(self, client, auth_headers):
        res = client.delete("/api/expenses/12345", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_test_user_cannot_see_lakhotia_expenses(
        self, client, auth_headers, test_user_headers
    ):
        # Set up data on lakhotia
        client.post("/api/categories/", headers=auth_headers, json={"name": "Lk"})
        client.post(
            "/api/expenses/",
            headers=auth_headers,
            json=_expense(category="Lk", amount=999),
        )
        res = client.get("/api/expenses/", headers=test_user_headers)
        assert res.status_code == 200
        assert res.json() == []
