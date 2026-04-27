from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from models import DashboardResponse
from services import build_dashboard
from dependencies import require_auth

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Month must be in YYYY-MM format.")


@router.get("/{month}", response_model=DashboardResponse)
def get_dashboard(month: str, current_user: str = Depends(require_auth)):
    _validate_month(month)
    return build_dashboard(month, current_user)
