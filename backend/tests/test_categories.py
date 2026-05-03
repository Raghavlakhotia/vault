"""Categories router."""


class TestList:
    def test_empty_for_new_user(self, client, auth_headers):
        res = client.get("/api/categories/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []


class TestCreate:
    def test_creates_with_default_kind(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Groceries"},
        )
        assert res.status_code == 201
        assert res.json() == [{"name": "Groceries", "kind": "Need"}]

    def test_creates_with_explicit_want_kind(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Travel", "kind": "Want"},
        )
        assert res.status_code == 201
        assert {"name": "Travel", "kind": "Want"} in res.json()

    def test_creates_and_returns_full_list(self, client, auth_headers):
        client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Groceries"},
        )
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Rent"},
        )
        assert res.status_code == 201
        names = [c["name"] for c in res.json()]
        assert names == ["Groceries", "Rent"]

    def test_strips_whitespace(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "  Travel  "},
        )
        assert res.status_code == 201
        names = [c["name"] for c in res.json()]
        assert "Travel" in names

    def test_invalid_kind_rejected(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Foo", "kind": "InvalidKind"},
        )
        assert res.status_code == 422

    def test_duplicate_rejected(self, client, auth_headers):
        client.post("/api/categories/", headers=auth_headers, json={"name": "Food"})
        res = client.post("/api/categories/", headers=auth_headers, json={"name": "Food"})
        assert res.status_code == 409
        assert "exists" in res.json()["detail"].lower()


class TestUpdateKind:
    def test_updates_kind_to_want(self, client, auth_headers):
        client.post("/api/categories/", headers=auth_headers, json={"name": "Groceries"})
        res = client.put(
            "/api/categories/Groceries",
            headers=auth_headers,
            json={"kind": "Want"},
        )
        assert res.status_code == 200
        updated = next(c for c in res.json() if c["name"] == "Groceries")
        assert updated["kind"] == "Want"

    def test_unknown_name_returns_404(self, client, auth_headers):
        res = client.put(
            "/api/categories/Nonexistent",
            headers=auth_headers,
            json={"kind": "Want"},
        )
        assert res.status_code == 404


class TestDelete:
    def test_removes_existing_category(self, client, auth_headers):
        client.post("/api/categories/", headers=auth_headers, json={"name": "X"})
        client.post("/api/categories/", headers=auth_headers, json={"name": "Y"})
        res = client.delete("/api/categories/X", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == [{"name": "Y", "kind": "Need"}]

    def test_unknown_category_404(self, client, auth_headers):
        res = client.delete("/api/categories/Nonexistent", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_users_have_independent_category_lists(
        self, client, auth_headers, test_user_headers
    ):
        client.post("/api/categories/", headers=auth_headers, json={"name": "OnlyForLakhotia"})
        client.post("/api/categories/", headers=test_user_headers, json={"name": "OnlyForTest"})

        lak = [c["name"] for c in client.get("/api/categories/", headers=auth_headers).json()]
        tst = [c["name"] for c in client.get("/api/categories/", headers=test_user_headers).json()]
        assert "OnlyForLakhotia" in lak
        assert "OnlyForLakhotia" not in tst
        assert "OnlyForTest" in tst
        assert "OnlyForTest" not in lak
