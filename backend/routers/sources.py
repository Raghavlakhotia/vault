from fastapi import APIRouter, Depends, HTTPException, status
from models import SourceCreate
from storage import get_sources, save_sources
from dependencies import require_auth

router = APIRouter()


@router.get("/", response_model=list[str])
def list_sources(current_user: str = Depends(require_auth)):
    return get_sources(current_user)


@router.post("/", response_model=list[str], status_code=status.HTTP_201_CREATED)
def create_source(body: SourceCreate, current_user: str = Depends(require_auth)):
    sources = get_sources(current_user)
    name = body.name.strip()
    if name in sources:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Source '{name}' already exists.",
        )
    sources.append(name)
    save_sources(current_user, sources)
    return sources


@router.delete("/{name}", response_model=list[str])
def delete_source(name: str, current_user: str = Depends(require_auth)):
    sources = get_sources(current_user)
    if name not in sources:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source '{name}' not found.",
        )
    sources.remove(name)
    save_sources(current_user, sources)
    return sources
