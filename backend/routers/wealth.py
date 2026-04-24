import math
import statistics
from collections import defaultdict
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models import WealthRow, WealthTotals, WealthDashboardResponse
from storage import get_assets, get_holdings

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=422, detail="Month must be YYYY-MM.")


@router.get("/ratios")
def get_wealth_ratios(risk_free: float = Query(default=6.5, description="Annual risk-free rate in %")):
    """
    Sharpe and Sortino ratios computed from monthly portfolio returns across all recorded months.
    Returns null for both when fewer than 3 months of data exist.
    risk_free: annual rate used as the hurdle (default 6.5% — approximate India govt bond yield).
    """
    assets = get_assets()
    all_holdings = get_holdings()
    if not assets or not all_holdings:
        return {"sharpe": None, "sortino": None, "months": 0, "risk_free": risk_free}

    asset_map = {a["asset_id"]: a for a in assets}

    # Group holdings by month, compute portfolio return for each month
    by_month: dict[str, list] = defaultdict(list)
    for h in all_holdings:
        by_month[h["month_year"]].append(h)

    monthly_returns: list[float] = []
    for month in sorted(by_month):
        month_holdings = by_month[month]
        total_inv = sum(h["invested_value"] for h in month_holdings)
        if total_inv == 0:
            continue
        weighted_ret = 0.0
        for h in month_holdings:
            inv = h["invested_value"]
            use_exp = h.get("use_expected_return", False)
            a = asset_map.get(h["asset_id"])
            if use_exp and a:
                ret = a["expected_return"]
            elif inv > 0:
                ret = (h["market_value"] - inv) / inv * 100
            else:
                ret = 0.0
            weighted_ret += ret * inv
        monthly_returns.append(weighted_ret / total_inv)

    n = len(monthly_returns)
    if n < 3:
        return {"sharpe": None, "sortino": None, "months": n, "risk_free": risk_free}

    mean_ret = statistics.mean(monthly_returns)
    std_ret = statistics.stdev(monthly_returns)

    sharpe = round((mean_ret - risk_free) / std_ret, 2) if std_ret > 0 else None

    # Downside deviation: RMS of returns below the risk-free hurdle
    below_rfr = [r - risk_free for r in monthly_returns if r < risk_free]
    if below_rfr:
        downside_dev = math.sqrt(sum(x ** 2 for x in below_rfr) / len(below_rfr))
        sortino = round((mean_ret - risk_free) / downside_dev, 2) if downside_dev > 0 else None
    else:
        # All periods beat the hurdle — Sortino is positive infinite; show a high value
        sortino = None

    return {"sharpe": sharpe, "sortino": sortino, "months": n, "risk_free": risk_free}


@router.get("/{month_year}", response_model=WealthDashboardResponse)
def get_wealth_dashboard(month_year: str):
    _validate_month(month_year)
    assets = get_assets()
    holdings_map = {
        h["asset_id"]: h
        for h in get_holdings()
        if h["month_year"] == month_year
    }

    rows: list[WealthRow] = []
    for a in assets:
        h = holdings_map.get(a["asset_id"])
        inv = h["invested_value"] if h else 0.0
        use_exp = h.get("use_expected_return", False) if h else False
        # When use_expected_return, market value mirrors invested and return = expected
        mkt = inv if use_exp else (h["market_value"] if h else 0.0)
        if h and use_exp:
            ret = a["expected_return"]
        elif h and inv > 0:
            ret = (mkt - inv) / inv * 100
        else:
            ret = None
        rows.append(WealthRow(
            asset_id=a["asset_id"],
            asset_name=a["asset_name"],
            category=a["category"],
            expected_return=a["expected_return"],
            holding_id=h["id"] if h else None,
            invested_value=inv,
            market_value=mkt,
            returns=round(ret, 2) if ret is not None else None,
            use_expected_return=use_exp,
        ))

    total_inv = sum(r.invested_value for r in rows)
    total_mkt = sum(r.market_value for r in rows)

    if total_inv > 0:
        w_exp = sum(r.expected_return * r.invested_value for r in rows) / total_inv
        rows_with_ret = [r for r in rows if r.returns is not None and r.invested_value > 0]
        w_real = (
            sum(r.returns * r.invested_value for r in rows_with_ret) / total_inv
            if rows_with_ret else None
        )
    else:
        w_exp = None
        w_real = None

    return WealthDashboardResponse(
        month_year=month_year,
        rows=rows,
        totals=WealthTotals(
            weighted_expected_return=round(w_exp, 2) if w_exp is not None else None,
            total_invested=total_inv,
            total_market=total_mkt,
            weighted_realized_return=round(w_real, 2) if w_real is not None else None,
        ),
    )
