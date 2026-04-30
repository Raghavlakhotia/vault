from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

router = APIRouter()

BOOKS_DIR = Path(__file__).parent.parent.parent / "book_summaries"


class BookMeta(BaseModel):
    slug: str
    title: str
    author: str
    order: int


def _parse_meta(path: Path) -> BookMeta:
    order = int(path.stem.split("_")[0]) if path.stem.split("_")[0].isdigit() else 0
    title, author = path.stem.replace("_", " ").title(), ""
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            raw = line[2:].strip()
            if " — " in raw:
                title, author = raw.split(" — ", 1)
            else:
                title = raw
            break
    return BookMeta(slug=path.stem, title=title.strip(), author=author.strip(), order=order)


@router.get("/", response_model=list[BookMeta])
def list_books():
    books = [
        _parse_meta(p)
        for p in BOOKS_DIR.glob("*.md")
        if not p.stem.startswith("00")
    ]
    return sorted(books, key=lambda b: b.order)


@router.get("/{slug}", response_class=PlainTextResponse)
def get_book(slug: str):
    path = BOOKS_DIR / f"{slug}.md"
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Book not found.")
    return path.read_text(encoding="utf-8")
