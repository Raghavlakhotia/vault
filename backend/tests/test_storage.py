"""Storage layer — per-user file paths, bootstrap, legacy migration, users.json."""

import json

import storage


class TestPerUserDirs:
    def test_creates_user_dir_on_first_access(self, data_dir):
        assert storage.get_categories("alice") == []
        assert (data_dir / "alice").is_dir()
        for name in ("categories.json", "budgets.json", "expenses.json",
                     "assets.json", "holdings.json"):
            assert (data_dir / "alice" / name).exists()

    def test_users_have_isolated_files(self, data_dir):
        storage.save_categories("alice", ["A1", "A2"])
        storage.save_categories("bob", ["B1"])
        assert storage.get_categories("alice") == [
            {"name": "A1", "kind": "Need"},
            {"name": "A2", "kind": "Need"},
        ]
        assert storage.get_categories("bob") == [{"name": "B1", "kind": "Need"}]
        # Files exist in different directories and are normalized dicts on disk
        a = json.loads((data_dir / "alice" / "categories.json").read_text())
        b = json.loads((data_dir / "bob" / "categories.json").read_text())
        assert a == [{"name": "A1", "kind": "Need"}, {"name": "A2", "kind": "Need"}]
        assert b == [{"name": "B1", "kind": "Need"}]

    def test_legacy_string_categories_auto_migrate(self, data_dir):
        user = "alice"
        storage._user_dir(user)  # ensure dir exists
        (data_dir / user / "categories.json").write_text(json.dumps(["X", "Y"]))
        cats = storage.get_categories(user)
        assert cats == [
            {"name": "X", "kind": "Need"},
            {"name": "Y", "kind": "Need"},
        ]

    def test_save_then_load_preserves_data(self, data_dir):
        storage.save_budgets("alice", {"2026-04": {"Groceries": 5000.0}})
        assert storage.get_budgets("alice") == {"2026-04": {"Groceries": 5000.0}}

    def test_empty_defaults(self, data_dir):
        assert storage.get_categories("fresh") == []
        assert storage.get_budgets("fresh") == {}
        assert storage.get_expenses("fresh") == []
        assert storage.get_assets("fresh") == []
        assert storage.get_holdings("fresh") == []


class TestUsersFile:
    def test_get_users_creates_file_if_missing(self, data_dir, monkeypatch):
        # Wipe users.json that the fixture seeded
        users_file = data_dir / "users.json"
        users_file.unlink()
        result = storage.get_users()
        assert result == {}
        assert users_file.exists()

    def test_save_then_get_users(self, data_dir):
        storage.save_users({"x": {"username": "x", "hashed_password": "h"}})
        assert storage.get_users() == {"x": {"username": "x", "hashed_password": "h"}}


class TestLegacyMigration:
    def test_migrates_flat_files_to_lakhotia_dir(self, data_dir):
        # Lay down legacy flat files
        (data_dir / "categories.json").write_text(json.dumps(["legacy"]))
        (data_dir / "expenses.json").write_text(json.dumps([{"id": 1, "amount": 100}]))

        storage.migrate_legacy_data()

        assert (data_dir / "lakhotia" / "categories.json").exists()
        assert (data_dir / "lakhotia" / "expenses.json").exists()
        assert not (data_dir / "categories.json").exists()
        assert not (data_dir / "expenses.json").exists()
        assert json.loads((data_dir / "lakhotia" / "categories.json").read_text()) == ["legacy"]

    def test_migration_does_not_overwrite_existing_user_files(self, data_dir):
        # Pre-existing per-user file
        (data_dir / "lakhotia").mkdir(exist_ok=True)
        (data_dir / "lakhotia" / "categories.json").write_text(json.dumps(["new"]))
        # Legacy flat file
        (data_dir / "categories.json").write_text(json.dumps(["old"]))

        storage.migrate_legacy_data()

        # User file preserved; legacy left in place
        assert json.loads((data_dir / "lakhotia" / "categories.json").read_text()) == ["new"]
        assert (data_dir / "categories.json").exists()

    def test_idempotent(self, data_dir):
        storage.save_categories("lakhotia", ["A"])
        storage.migrate_legacy_data()
        storage.migrate_legacy_data()
        assert storage.get_categories("lakhotia") == [{"name": "A", "kind": "Need"}]
