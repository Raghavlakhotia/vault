from fastapi import APIRouter, Depends
from models import IncomeConfig
from storage import get_income, save_income
from dependencies import require_auth

router = APIRouter()


@router.get("/", response_model=IncomeConfig)
def get_income_config(current_user: str = Depends(require_auth)):
    return IncomeConfig(**get_income(current_user))


@router.put("/", response_model=IncomeConfig)
def set_income_config(body: IncomeConfig, current_user: str = Depends(require_auth)):
    save_income(current_user, body.model_dump())
    return body
