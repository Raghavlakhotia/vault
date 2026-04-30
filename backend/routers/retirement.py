"""Retirement / FIRE calculator endpoint."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from dependencies import require_auth
from models import RetirementInput, RetirementResponse, RetirementScenario

router = APIRouter()

GROWTH_RATE = 0.12   # pre-retirement portfolio growth (annualised)
SWR         = 0.04   # safe withdrawal rate (4% / 25× rule)
STEP_UP     = 0.10   # annual SIP escalation


def _fv_corpus(corpus: float, years: int) -> float:
    return corpus * (1 + GROWTH_RATE) ** years


def _fv_sip(sip: float, years: int) -> float:
    r, n = GROWTH_RATE / 12, years * 12
    if r == 0 or n == 0:
        return sip * n
    return sip * ((1 + r) ** n - 1) / r


def _gap_sip_flat(gap: float, years: int) -> float:
    r, n = GROWTH_RATE / 12, years * 12
    if n == 0:
        return gap
    if r == 0:
        return gap / n
    return gap * r / ((1 + r) ** n - 1)


def _gap_sip_stepup(gap: float, years: int) -> float:
    """Starting monthly SIP with 10 % annual step-up to accumulate gap."""
    r = GROWTH_RATE / 12
    fv_factor = sum(
        (1 + STEP_UP) ** y * ((1 + r) ** ((years - y) * 12) - 1) / r
        for y in range(int(years))
    )
    return gap / fv_factor if fv_factor > 0 else 0


def _fire_age(
    current_age: int,
    corpus: float,
    sip: float,
    inflation_rate: float,
    monthly_expense: float,
) -> Optional[int]:
    """Earliest age at which projected assets >= corpus_needed (capped at 80)."""
    for yrs in range(1, 81 - current_age):
        inflated = monthly_expense * (1 + inflation_rate / 100) ** yrs
        needed   = inflated * 12 / SWR
        total    = _fv_corpus(corpus, yrs) + _fv_sip(sip, yrs)
        if total >= needed:
            return current_age + yrs
    return None


@router.post("/calculate", response_model=RetirementResponse)
def calculate_retirement(body: RetirementInput, current_user: str = Depends(require_auth)):
    years = body.target_retirement_age - body.current_age
    if years <= 0:
        raise HTTPException(status_code=400, detail="Target retirement age must exceed current age")

    current_year = datetime.now().year
    scenarios: list[RetirementScenario] = []

    for name, expense in [
        ("Lean FIRE",    body.expenses_lean),
        ("Regular FIRE", body.expenses_regular),
        ("Fat FIRE",     body.expenses_fat),
    ]:
        inflated      = expense * (1 + body.inflation_rate / 100) ** years
        corpus_needed = inflated * 12 / SWR
        projected     = _fv_corpus(body.current_corpus, years) + _fv_sip(body.monthly_sip, years)
        funded_pct    = min(projected / corpus_needed * 100, 100.0) if corpus_needed else 100.0
        gap           = max(corpus_needed - projected, 0.0)
        fire_age      = _fire_age(
            body.current_age, body.current_corpus,
            body.monthly_sip, body.inflation_rate, expense
        )
        scenarios.append(
            RetirementScenario(
                name=name,
                monthly_expense_today=expense,
                monthly_expense_at_retirement=round(inflated, 2),
                corpus_needed=round(corpus_needed, 2),
                projected_corpus=round(projected, 2),
                funded_pct=round(funded_pct, 2),
                gap=round(gap, 2),
                gap_sip_flat=round(_gap_sip_flat(gap, years), 2) if gap else 0.0,
                gap_sip_stepup=round(_gap_sip_stepup(gap, years), 2) if gap else 0.0,
                fire_age=fire_age,
                fire_year=(current_year + (fire_age - body.current_age)) if fire_age else None,
            )
        )

    return RetirementResponse(scenarios=scenarios, years_to_target=years)
