from fastapi import APIRouter, HTTPException, status
from models import AssetCreate, AssetOut
from storage import get_assets, save_assets

router = APIRouter()


def _next_id(assets: list[dict]) -> int:
    return max((a["asset_id"] for a in assets), default=0) + 1


@router.get("/", response_model=list[AssetOut])
def list_assets():
    return get_assets()


@router.post("/", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(body: AssetCreate):
    assets = get_assets()
    record = {"asset_id": _next_id(assets), **body.model_dump()}
    assets.append(record)
    save_assets(assets)
    return AssetOut(**record)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int):
    assets = get_assets()
    updated = [a for a in assets if a["asset_id"] != asset_id]
    if len(updated) == len(assets):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    save_assets(updated)
