"""Assets router."""


def _asset(name="Nifty50", category="Equity", expected_return=12.0):
    return {
        "asset_name": name,
        "category": category,
        "expected_return": expected_return,
    }


class TestList:
    def test_empty_initially(self, client, auth_headers):
        res = client.get("/api/assets/", headers=auth_headers)
        assert res.status_code == 200
        assert res.json() == []


class TestCreate:
    def test_assigns_asset_id_starting_at_1(self, client, auth_headers):
        res = client.post("/api/assets/", headers=auth_headers, json=_asset())
        assert res.status_code == 201
        assert res.json()["asset_id"] == 1

    def test_ids_increment(self, client, auth_headers):
        client.post("/api/assets/", headers=auth_headers, json=_asset(name="A1"))
        res = client.post("/api/assets/", headers=auth_headers, json=_asset(name="A2"))
        assert res.json()["asset_id"] == 2

    def test_persists_all_fields(self, client, auth_headers):
        res = client.post(
            "/api/assets/",
            headers=auth_headers,
            json=_asset(name="EPF", category="Debt", expected_return=8.25),
        )
        body = res.json()
        assert body["asset_name"] == "EPF"
        assert body["category"] == "Debt"
        assert body["expected_return"] == 8.25


class TestDelete:
    def test_removes_asset(self, client, auth_headers):
        client.post("/api/assets/", headers=auth_headers, json=_asset(name="X"))
        client.post("/api/assets/", headers=auth_headers, json=_asset(name="Y"))
        res = client.delete("/api/assets/1", headers=auth_headers)
        assert res.status_code == 204

        remaining = client.get("/api/assets/", headers=auth_headers).json()
        assert {a["asset_name"] for a in remaining} == {"Y"}

    def test_unknown_id_404(self, client, auth_headers):
        res = client.delete("/api/assets/999", headers=auth_headers)
        assert res.status_code == 404


class TestPerUserIsolation:
    def test_assets_isolated_by_user(self, client, auth_headers, test_user_headers):
        client.post("/api/assets/", headers=auth_headers, json=_asset(name="LakAsset"))
        res = client.get("/api/assets/", headers=test_user_headers)
        assert res.status_code == 200
        assert res.json() == []
