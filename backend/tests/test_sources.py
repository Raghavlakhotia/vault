"""Sources router."""


class TestList:
    def test_default_seeded_with_credit_card_and_cash(self, client, auth_headers):
        res = client.get("/api/sources/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == ["Credit Card", "Cash"]


class TestCreate:
    def test_adds_new_source(self, client, auth_headers):
        res = client.post(
            "/api/sources/", headers=auth_headers, json={"name": "UPI"},
        )
        assert res.status_code == 201
        assert res.json() == ["Credit Card", "Cash", "UPI"]

    def test_strips_whitespace(self, client, auth_headers):
        res = client.post(
            "/api/sources/", headers=auth_headers, json={"name": "  Debit Card  "},
        )
        assert "Debit Card" in res.json()

    def test_duplicate_rejected(self, client, auth_headers):
        res = client.post(
            "/api/sources/", headers=auth_headers, json={"name": "Cash"},
        )
        assert res.status_code == 409


class TestDelete:
    def test_removes_source(self, client, auth_headers):
        res = client.delete("/api/sources/Cash", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == ["Credit Card"]

    def test_unknown_404(self, client, auth_headers):
        res = client.delete("/api/sources/Nope", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_users_isolated(self, client, auth_headers, test_user_headers):
        client.post(
            "/api/sources/", headers=auth_headers, json={"name": "OnlyForLakhotia"},
        )
        lak = client.get("/api/sources/", headers=auth_headers).json()
        tst = client.get("/api/sources/", headers=test_user_headers).json()
        assert "OnlyForLakhotia" in lak
        assert "OnlyForLakhotia" not in tst
        # Both still have defaults
        assert "Credit Card" in tst and "Cash" in tst
