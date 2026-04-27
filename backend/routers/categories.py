from fastapi import APIRouter, Depends, HTTPException, status
from models import CategoryCreate
from storage import get_categories, save_categories
from dependencies import require_auth

router = APIRouter()


@router.get("/", response_model=list[str])
def list_categories(current_user: str = Depends(require_auth)):
    return get_categories(current_user)


@router.post("/", response_model=list[str], status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, current_user: str = Depends(require_auth)):
    cats = get_categories(current_user)
    name = body.name.strip()
    if name in cats:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Category '{name}' already exists.")
    cats.append(name)
    save_categories(current_user, cats)
    return cats


@router.delete("/{name}", response_model=list[str])
def delete_category(name: str, current_user: str = Depends(require_auth)):
    cats = get_categories(current_user)
    if name not in cats:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category '{name}' not found.")
    cats.remove(name)
    save_categories(current_user, cats)
    return cats
