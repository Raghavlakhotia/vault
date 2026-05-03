"""Income router tests."""


DEFAULT_ALLOCATIONS = {
    "Investment": {"amount": 0.0, "subs": []},
    "Need":       {"amount": 0.0, "subs": []},
    "Want":       {"amount": 0.0, "subs": []},
}


class TestGet:
    def test_default_config(self, client, auth_headers):
        res = client.get("/api/income/", headers=auth_headers)
        assert res.status_code == 200
        body = res.json()
        assert body["in_hand"] == 0.0
        assert body["allocations"] == DEFAULT_ALLOCATIONS


class TestPut:
    def test_replace_config_returns_same_body(self, client, auth_headers):
        payload = {
            "in_hand": 100000.0,
            "allocations": {
                "Investment": {"amount": 50000.0, "subs": []},
                "Need":       {"amount": 30000.0, "subs": []},
                "Want":       {"amount": 20000.0, "subs": []},
            },
        }
        res = client.put("/api/income/", headers=auth_headers, json=payload)
        assert res.status_code == 200
        assert res.json() == payload

    def test_invalid_in_hand_returns_422(self, client, auth_headers):
        payload = {
            "in_hand": -1,
            "allocations": {
                "Investment": {"amount": 0.0, "subs": []},
            },
        }
        res = client.put("/api/income/", headers=auth_headers, json=payload)
        assert res.status_code == 422


class TestRoundTrip:
    def test_put_then_get_returns_saved_data(self, client, auth_headers):
        payload = {
            "in_hand": 75000.0,
            "allocations": {
                "Investment": {
                    "amount": 30000.0,
                    "subs": [
                        {"name": "Mutual Funds", "amount": 20000.0},
                        {"name": "Stocks", "amount": 10000.0},
                    ],
                },
                "Need": {"amount": 30000.0, "subs": []},
                "Want": {"amount": 15000.0, "subs": []},
            },
        }
        put_res = client.put("/api/income/", headers=auth_headers, json=payload)
        assert put_res.status_code == 200

        get_res = client.get("/api/income/", headers=auth_headers)
        assert get_res.status_code == 200
        assert get_res.json() == payload


class TestPerUserIsolation:
    def test_users_have_independent_income_configs(
        self, client, auth_headers, test_user_headers
    ):
        lakhotia_payload = {
            "in_hand": 100000.0,
            "allocations": {
                "Investment": {"amount": 50000.0, "subs": []},
                "Need":       {"amount": 30000.0, "subs": []},
                "Want":       {"amount": 20000.0, "subs": []},
            },
        }
        client.put("/api/income/", headers=auth_headers, json=lakhotia_payload)

        lak = client.get("/api/income/", headers=auth_headers).json()
        tst = client.get("/api/income/", headers=test_user_headers).json()

        assert lak["in_hand"] == 100000.0
        assert tst["in_hand"] == 0.0
        assert tst["allocations"] == DEFAULT_ALLOCATIONS
