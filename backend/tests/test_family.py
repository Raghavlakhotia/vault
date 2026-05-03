"""Family router."""


class TestList:
    def test_default_seeded_with_husband_and_wife(self, client, auth_headers):
        res = client.get("/api/family/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == ["Husband", "Wife"]


class TestCreate:
    def test_adds_new_member_and_returns_full_list(self, client, auth_headers):
        res = client.post(
            "/api/family/", headers=auth_headers, json={"name": "Daughter"},
        )
        assert res.status_code == 201
        assert res.json() == ["Husband", "Wife", "Daughter"]

    def test_strips_whitespace(self, client, auth_headers):
        res = client.post(
            "/api/family/", headers=auth_headers, json={"name": "  Son  "},
        )
        assert res.status_code == 201
        assert "Son" in res.json()

    def test_duplicate_rejected(self, client, auth_headers):
        # Husband already in default
        res = client.post(
            "/api/family/", headers=auth_headers, json={"name": "Husband"},
        )
        assert res.status_code == 409


class TestDelete:
    def test_removes_member(self, client, auth_headers):
        res = client.delete("/api/family/Wife", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == ["Husband"]

    def test_unknown_404(self, client, auth_headers):
        res = client.delete("/api/family/Nobody", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_users_have_independent_family_lists(
        self, client, auth_headers, test_user_headers
    ):
        client.post(
            "/api/family/", headers=auth_headers, json={"name": "OnlyForLakhotia"},
        )
        lak = client.get("/api/family/", headers=auth_headers).json()
        tst = client.get("/api/family/", headers=test_user_headers).json()
        assert "OnlyForLakhotia" in lak
        assert "OnlyForLakhotia" not in tst
        # Both still have the seeded defaults
        assert "Husband" in tst and "Wife" in tst
