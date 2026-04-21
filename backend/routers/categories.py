from fastapi import APIRouter, HTTPException, status
from models import CategoryCreate
from storage import get_categories, save_categories

router = APIRouter()


@router.get("/", response_model=list[str])
def list_categories():
    return get_categories()


@router.post("/", response_model=list[str], status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate):
    cats = get_categories()
    name = body.name.strip()
    if name in cats:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{name}' already exists.",
        )
    cats.append(name)
    save_categories(cats)
    return cats


@router.delete("/{name}", response_model=list[str])
def delete_category(name: str):
    cats = get_categories()
    if name not in cats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{name}' not found.",
        )
    cats.remove(name)
    save_categories(cats)
    return cats
