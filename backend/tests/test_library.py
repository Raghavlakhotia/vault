"""
Library router — book listing + content retrieval.

The library reads from book_summaries/ at the repo root. We patch
BOOKS_DIR to a tmp dir per test so we don't depend on the real
content.
"""

import pytest

from routers import library as lib_module


@pytest.fixture
def books_dir(tmp_path, monkeypatch):
    """Point library router at a tmp book_summaries dir with seeded markdown files."""
    monkeypatch.setattr(lib_module, "BOOKS_DIR", tmp_path)
    (tmp_path / "01_psychology_of_money.md").write_text(
        "# Psychology of Money — Morgan Housel\n\nIntro line.\n",
        encoding="utf-8",
    )
    (tmp_path / "02_atomic_habits.md").write_text(
        "# Atomic Habits\n\nNo author dash.\n",
        encoding="utf-8",
    )
    (tmp_path / "03_no_h1.md").write_text(
        "Some content without an H1.\n",
        encoding="utf-8",
    )
    # 00-prefixed files are excluded from the listing
    (tmp_path / "00_index.md").write_text("# Hidden", encoding="utf-8")
    return tmp_path


class TestList:
    def test_returns_books_sorted_by_order(self, client, auth_headers, books_dir):
        res = client.get("/api/library/", headers=auth_headers)
        assert res.status_code == 200
        slugs = [b["slug"] for b in res.json()]
        assert slugs == ["01_psychology_of_money", "02_atomic_habits", "03_no_h1"]

    def test_excludes_double_zero_prefixed(self, client, auth_headers, books_dir):
        res = client.get("/api/library/", headers=auth_headers)
        slugs = [b["slug"] for b in res.json()]
        assert "00_index" not in slugs

    def test_parses_title_and_author_when_em_dash_present(
        self, client, auth_headers, books_dir
    ):
        res = client.get("/api/library/", headers=auth_headers)
        psych = next(b for b in res.json() if b["slug"] == "01_psychology_of_money")
        assert psych["title"] == "Psychology of Money"
        assert psych["author"] == "Morgan Housel"

    def test_handles_missing_author(self, client, auth_headers, books_dir):
        res = client.get("/api/library/", headers=auth_headers)
        atomic = next(b for b in res.json() if b["slug"] == "02_atomic_habits")
        assert atomic["title"] == "Atomic Habits"
        assert atomic["author"] == ""

    def test_falls_back_to_slug_title_when_no_h1(
        self, client, auth_headers, books_dir
    ):
        res = client.get("/api/library/", headers=auth_headers)
        no_h1 = next(b for b in res.json() if b["slug"] == "03_no_h1")
        assert no_h1["title"] == "03 No H1"


class TestGetBook:
    def test_returns_raw_markdown(self, client, auth_headers, books_dir):
        res = client.get("/api/library/01_psychology_of_money", headers=auth_headers)
        assert res.status_code == 200
        assert "Psychology of Money" in res.text
        assert "Morgan Housel" in res.text
        assert res.headers["content-type"].startswith("text/plain")

    def test_unknown_slug_404(self, client, auth_headers, books_dir):
        res = client.get("/api/library/does_not_exist", headers=auth_headers)
        assert res.status_code == 404
