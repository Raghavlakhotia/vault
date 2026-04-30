from fastapi import APIRouter, Depends, HTTPException, status
from models import AssetCreate, AssetOut
from storage import get_assets, save_assets
from dependencies import require_auth

router = APIRouter()


def _next_id(assets: list[dict]) -> int:
    return max((a["asset_id"] for a in assets), default=0) + 1


@router.get("/", response_model=list[AssetOut])
def list_assets(current_user: str = Depends(require_auth)):
    return get_assets(current_user)


@router.post("/", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
def create_asset(body: AssetCreate, current_user: str = Depends(require_auth)):
    assets = get_assets(current_user)
    record = {"asset_id": _next_id(assets), **body.model_dump()}
    assets.append(record)
    save_assets(current_user, assets)
    return AssetOut(**record)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: int, current_user: str = Depends(require_auth)):
    assets = get_assets(current_user)
    updated = [a for a in assets if a["asset_id"] != asset_id]
    if len(updated) == len(assets):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    save_assets(current_user, updated)
