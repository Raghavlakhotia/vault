from datetime import datetime
from fastapi import APIRouter, HTTPException
from models import WealthRow, WealthTotals, WealthDashboardResponse
from storage import get_assets, get_holdings

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=422, detail="Month must be YYYY-MM.")


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
