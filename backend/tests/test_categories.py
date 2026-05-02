"""Categories router."""


class TestList:
    def test_empty_for_new_user(self, client, auth_headers):
        res = client.get("/api/categories/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []


class TestCreate:
    def test_creates_and_returns_full_list(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Groceries"},
        )
        assert res.status_code == 201
        assert res.json() == ["Groceries"]

        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "Rent"},
        )
        assert res.status_code == 201
        assert res.json() == ["Groceries", "Rent"]

    def test_strips_whitespace(self, client, auth_headers):
        res = client.post(
            "/api/categories/",
            headers=auth_headers,
            json={"name": "  Travel  "},
        )
        assert res.status_code == 201
        assert "Travel" in res.json()

    def test_duplicate_rejected(self, client, auth_headers):
        client.post("/api/categories/", headers=auth_headers, json={"name": "Food"})
        res = client.post("/api/categories/", headers=auth_headers, json={"name": "Food"})
        assert res.status_code == 409
        assert "exists" in res.json()["detail"].lower()


class TestDelete:
    def test_removes_existing_category(self, client, auth_headers):
        client.post("/api/categories/", headers=auth_headers, json={"name": "X"})
        client.post("/api/categories/", headers=auth_headers, json={"name": "Y"})
        res = client.delete("/api/categories/X", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == ["Y"]

    def test_unknown_category_404(self, client, auth_headers):
        res = client.delete("/api/categories/Nonexistent", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_users_have_independent_category_lists(
        self, client, auth_headers, test_user_headers
    ):
        client.post("/api/categories/", headers=auth_headers, json={"name": "OnlyForLakhotia"})
        client.post("/api/categories/", headers=test_user_headers, json={"name": "OnlyForTest"})

        lak = client.get("/api/categories/", headers=auth_headers).json()
        tst = client.get("/api/categories/", headers=test_user_headers).json()
        assert "OnlyForLakhotia" in lak
        assert "OnlyForLakhotia" not in tst
        assert "OnlyForTest" in tst
        assert "OnlyForTest" not in lak
