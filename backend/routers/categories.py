from fastapi import APIRouter, Depends, HTTPException, status
from models import CategoryCreate, CategoryOut, CategoryKindUpdate
from storage import get_categories, save_categories
from dependencies import require_auth

router = APIRouter()


@router.get("/", response_model=list[CategoryOut])
def list_categories(current_user: str = Depends(require_auth)):
    return get_categories(current_user)


@router.post("/", response_model=list[CategoryOut], status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, current_user: str = Depends(require_auth)):
    cats = get_categories(current_user)
    name = body.name.strip()
    if any(c["name"] == name for c in cats):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{name}' already exists.",
        )
    cats.append({"name": name, "kind": body.kind})
    save_categories(current_user, cats)
    return cats


@router.put("/{name}", response_model=list[CategoryOut])
def update_category_kind(
    name: str,
    body: CategoryKindUpdate,
    current_user: str = Depends(require_auth),
):
    cats = get_categories(current_user)
    for c in cats:
        if c["name"] == name:
            c["kind"] = body.kind
            save_categories(current_user, cats)
            return cats
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Category '{name}' not found.")


@router.delete("/{name}", response_model=list[CategoryOut])
def delete_category(name: str, current_user: str = Depends(require_auth)):
    cats = get_categories(current_user)
    if not any(c["name"] == name for c in cats):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{name}' not found.",
        )
    cats = [c for c in cats if c["name"] != name]
    save_categories(current_user, cats)
    return cats
