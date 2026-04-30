from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from models import HoldingCreate, HoldingUpdate, HoldingOut
from storage import get_assets, get_holdings, save_holdings

router = APIRouter()


def _next_id(holdings: list[dict]) -> int:
    return max((h["id"] for h in holdings), default=0) + 1


@router.get("/", response_model=list[HoldingOut])
def list_holdings(month: Optional[str] = Query(None)):
    holdings = get_holdings()
    if month:
        holdings = [h for h in holdings if h["month_year"] == month]
    return holdings


@router.post("/", response_model=HoldingOut, status_code=status.HTTP_201_CREATED)
def create_holding(body: HoldingCreate):
    asset_ids = {a["asset_id"] for a in get_assets()}
    if body.asset_id not in asset_ids:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Asset not found.")
    holdings = get_holdings()
    if any(h["asset_id"] == body.asset_id and h["month_year"] == body.month_year for h in holdings):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Holding for this asset+month already exists. Edit it from the dashboard.",
        )
    record = {"id": _next_id(holdings), **body.model_dump()}
    holdings.append(record)
    save_holdings(holdings)
    return HoldingOut(**record)


@router.put("/{holding_id}", response_model=HoldingOut)
def update_holding(holding_id: int, body: HoldingUpdate):
    holdings = get_holdings()
    for h in holdings:
        if h["id"] == holding_id:
            h["invested_value"] = body.invested_value
            h["market_value"] = body.market_value
            h["use_expected_return"] = body.use_expected_return
            save_holdings(holdings)
            return HoldingOut(**h)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holding not found.")


@router.delete("/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holding(holding_id: int):
    holdings = get_holdings()
    updated = [h for h in holdings if h["id"] != holding_id]
    if len(updated) == len(holdings):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holding not found.")
    save_holdings(updated)
