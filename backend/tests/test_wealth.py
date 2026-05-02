"""
Wealth router — dashboard rows, totals, and Sharpe/Sortino ratios.

Tests pin the actual return arithmetic so future refactors don't
silently change it.
"""

import math

import pytest


def _asset(client, headers, name="Nifty50", category="Equity", expected_return=12.0):
    return client.post(
        "/api/assets/",
        headers=headers,
        json={
            "asset_name": name,
            "category": category,
            "expected_return": expected_return,
        },
    ).json()


def _holding(client, headers, asset_id, month="2026-04",
             invested=10000, market=11000, use_exp=False):
    return client.post(
        "/api/holdings/",
        headers=headers,
        json={
            "asset_id": asset_id,
            "month_year": month,
            "invested_value": invested,
            "market_value": market,
            "use_expected_return": use_exp,
        },
    ).json()


# ── Wealth dashboard ──────────────────────────────────────────────────────────

class TestWealthDashboard:
    def test_invalid_month(self, client, auth_headers):
        res = client.get("/api/wealth/2026-13", headers=auth_headers)
        assert res.status_code == 422

    def test_empty_no_assets(self, client, auth_headers):
        res = client.get("/api/wealth/2026-04", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["rows"] == []
        assert res.json()["totals"]["total_invested"] == 0

    def test_asset_without_holding_for_month_returns_zero_row(
        self, client, auth_headers
    ):
        a = _asset(client, auth_headers)
        body = client.get("/api/wealth/2026-04", headers=auth_headers).json()
        assert len(body["rows"]) == 1
        row = body["rows"][0]
        assert row["asset_id"] == a["asset_id"]
        assert row["invested_value"] == 0
        assert row["market_value"] == 0
        assert row["returns"] is None
        assert row["holding_id"] is None

    def test_realized_return_pct(self, client, auth_headers):
        a = _asset(client, auth_headers)
        _holding(client, auth_headers, a["asset_id"], invested=10000, market=11000)

        body = client.get("/api/wealth/2026-04", headers=auth_headers).json()
        row = body["rows"][0]
        assert row["invested_value"] == 10000
        assert row["market_value"] == 11000
        assert row["returns"] == 10.0  # (11000-10000)/10000 * 100

    def test_use_expected_return_substitutes_market_value(
        self, client, auth_headers
    ):
        a = _asset(client, auth_headers, expected_return=8.5)
        # market_value of 0 should still report 8.5% with use_expected_return
        _holding(client, auth_headers, a["asset_id"],
                 invested=10000, market=0, use_exp=True)

        row = client.get("/api/wealth/2026-04", headers=auth_headers).json()["rows"][0]
        assert row["use_expected_return"] is True
        assert row["market_value"] == 10000  # mirrored from invested
        assert row["returns"] == 8.5

    def test_totals_weight_returns_by_invested(self, client, auth_headers):
        a1 = _asset(client, auth_headers, name="A1", expected_return=10.0)
        a2 = _asset(client, auth_headers, name="A2", expected_return=5.0)
        # A1: 10000 invested, +10% = 11000
        _holding(client, auth_headers, a1["asset_id"],
                 invested=10000, market=11000)
        # A2: 30000 invested, +20% = 36000
        _holding(client, auth_headers, a2["asset_id"],
                 invested=30000, market=36000)

        body = client.get("/api/wealth/2026-04", headers=auth_headers).json()
        totals = body["totals"]
        assert totals["total_invested"] == 40000
        assert totals["total_market"] == 47000

        # weighted_realized = (10*10000 + 20*30000) / 40000 = 17.5
        assert totals["weighted_realized_return"] == 17.5
        # weighted_expected = (10*10000 + 5*30000) / 40000 = 6.25
        assert totals["weighted_expected_return"] == 6.25


# ── Wealth ratios (Sharpe / Sortino) ──────────────────────────────────────────

class TestWealthRatios:
    def test_ratios_null_when_no_data(self, client, auth_headers):
        res = client.get("/api/wealth/ratios", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert body["sharpe"] is None
        assert body["sortino"] is None
        assert body["months"] == 0

    def test_ratios_null_with_fewer_than_three_months(
        self, client, auth_headers
    ):
        a = _asset(client, auth_headers)
        _holding(client, auth_headers, a["asset_id"],
                 month="2026-01", invested=10000, market=11000)
        _holding(client, auth_headers, a["asset_id"],
                 month="2026-02", invested=10000, market=11500)

        body = client.get("/api/wealth/ratios", headers=auth_headers).json()
        assert body["months"] == 2
        assert body["sharpe"] is None

    def test_ratios_computed_with_three_or_more_months(
        self, client, auth_headers
    ):
        a = _asset(client, auth_headers)
        for m, mkt in (("2026-01", 11000), ("2026-02", 11500), ("2026-03", 12000)):
            _holding(client, auth_headers, a["asset_id"],
                     month=m, invested=10000, market=mkt)

        body = client.get("/api/wealth/ratios?risk_free=6.5",
                          headers=auth_headers).json()
        assert body["months"] == 3
        # Returns: 10%, 15%, 20% — mean=15, stdev=5
        # sharpe = (15 - 6.5) / 5 = 1.7
        assert body["sharpe"] == pytest.approx(1.7, rel=1e-3)
        # All months above hurdle → sortino = None
        assert body["sortino"] is None

    def test_sortino_when_some_returns_below_hurdle(self, client, auth_headers):
        a = _asset(client, auth_headers)
        # Returns: 15%, 5%, 20% — one below 6.5% hurdle
        for m, mkt in (("2026-01", 11500), ("2026-02", 10500), ("2026-03", 12000)):
            _holding(client, auth_headers, a["asset_id"],
                     month=m, invested=10000, market=mkt)

        body = client.get("/api/wealth/ratios?risk_free=6.5",
                          headers=auth_headers).json()
        # Only 5% is below 6.5; downside_dev = sqrt((5-6.5)^2 / 1) = 1.5
        # mean = 13.333..., sortino = (13.333 - 6.5) / 1.5 ≈ 4.56
        assert body["sortino"] is not None
        assert body["sortino"] > 0
