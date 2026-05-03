from fastapi import APIRouter, Depends, HTTPException, status
from models import FamilyMemberCreate
from storage import get_family, save_family
from dependencies import require_auth

router = APIRouter()


@router.get("/", response_model=list[str])
def list_family(current_user: str = Depends(require_auth)):
    return get_family(current_user)


@router.post("/", response_model=list[str], status_code=status.HTTP_201_CREATED)
def create_family_member(body: FamilyMemberCreate, current_user: str = Depends(require_auth)):
    members = get_family(current_user)
    name = body.name.strip()
    if name in members:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Family member '{name}' already exists.",
        )
    members.append(name)
    save_family(current_user, members)
    return members


@router.delete("/{name}", response_model=list[str])
def delete_family_member(name: str, current_user: str = Depends(require_auth)):
    members = get_family(current_user)
    if name not in members:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Family member '{name}' not found.",
        )
    members.remove(name)
    save_family(current_user, members)
    return members
