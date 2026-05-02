"""Holdings router."""

import pytest


@pytest.fixture
def asset_id(client, auth_headers):
    """Create one asset, return its asset_id."""
    res = client.post(
        "/api/assets/",
        headers=auth_headers,
        json={"asset_name": "Nifty50", "category": "Equity", "expected_return": 12.0},
    )
    return res.json()["asset_id"]


def _holding(asset_id, month="2026-04", invested=10000, market=11000, use_exp=False):
    return {
        "asset_id": asset_id,
        "month_year": month,
        "invested_value": invested,
        "market_value": market,
        "use_expected_return": use_exp,
    }


class TestCreate:
    def test_creates_holding(self, client, auth_headers, asset_id):
        res = client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id),
        )
        assert res.status_code == 201
        body = res.json()
        assert body["id"] == 1
        assert body["asset_id"] == asset_id
        assert body["invested_value"] == 10000

    def test_unknown_asset_rejected(self, client, auth_headers):
        res = client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id=9999),
        )
        assert res.status_code == 422

    def test_duplicate_asset_month_rejected(self, client, auth_headers, asset_id):
        client.post("/api/holdings/", headers=auth_headers, json=_holding(asset_id))
        res = client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id),
        )
        assert res.status_code == 409

    def test_same_asset_different_months_allowed(
        self, client, auth_headers, asset_id
    ):
        r1 = client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id, month="2026-03"),
        )
        r2 = client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id, month="2026-04"),
        )
        assert r1.status_code == 201
        assert r2.status_code == 201


class TestList:
    def test_empty_initially(self, client, auth_headers):
        res = client.get("/api/holdings/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []

    def test_filter_by_month(self, client, auth_headers, asset_id):
        client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id, month="2026-03"),
        )
        client.post(
            "/api/holdings/", headers=auth_headers, json=_holding(asset_id, month="2026-04"),
        )
        res = client.get("/api/holdings/?month=2026-04", headers=auth_headers)
        assert len(res.json()) == 1
        assert res.json()[0]["month_year"] == "2026-04"


class TestUpdate:
    def test_updates_invested_market_use_exp(
        self, client, auth_headers, asset_id
    ):
        client.post("/api/holdings/", headers=auth_headers, json=_holding(asset_id))
        res = client.put(
            "/api/holdings/1",
            headers=auth_headers,
            json={
                "invested_value": 20000,
                "market_value": 25000,
                "use_expected_return": True,
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["invested_value"] == 20000
        assert body["market_value"] == 25000
        assert body["use_expected_return"] is True

    def test_unknown_id_404(self, client, auth_headers):
        res = client.put(
            "/api/holdings/9999",
            headers=auth_headers,
            json={"invested_value": 1, "market_value": 1, "use_expected_return": False},
        )
        assert res.status_code == 404


class TestDelete:
    def test_removes_holding(self, client, auth_headers, asset_id):
        client.post("/api/holdings/", headers=auth_headers, json=_holding(asset_id))
        res = client.delete("/api/holdings/1", headers=auth_headers)
        assert res.status_code == 204
        assert client.get("/api/holdings/", headers=auth_headers).json() == []

    def test_unknown_id_404(self, client, auth_headers):
        res = client.delete("/api/holdings/9999", headers=auth_headers)
        assert res.status_code == 404
