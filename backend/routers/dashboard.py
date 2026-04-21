from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from models import DashboardResponse
from services import build_dashboard

router = APIRouter()


def _validate_month(month: str) -> None:
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Month must be in YYYY-MM format.",
        )


@router.get("/{month}", response_model=DashboardResponse)
def get_dashboard(month: str):
    """Full dashboard: budget matrix + expense sheet for a given month."""
    _validate_month(month)
    return build_dashboard(month)
