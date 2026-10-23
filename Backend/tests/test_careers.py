import unittest
from app import create_app
from extensions import db

class CareersTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_get_all_careers(self):
        res = self.client.get("/api/careers")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(data["count"], 9)
        titles = [c["title"] for c in data["careers"]]
        self.assertIn("Frontend Developer", titles)
        self.assertIn("AI / ML Engineer", titles)

    def test_search_and_filter_careers(self):
        # Search by keyword
        res = self.client.get("/api/careers?q=python")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["count"], 0)

        # Filter by category
        res = self.client.get("/api/careers?category=Data")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        for c in data["careers"]:
            self.assertEqual(c["category"], "Data")

    def test_bookmark_career(self):
        # Register user
        reg_res = self.client.post("/api/auth/register", json={
            "email": "bookmark_user@growvia.ai",
            "password": "Password123",
            "name": "Alex"
        })
        token = reg_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Bookmark career ID 1
        res = self.client.post("/api/careers/1/bookmark", headers=headers)
        self.assertIn(res.status_code, [200, 201])
        self.assertTrue(res.get_json()["bookmarked"])

        # Fetch bookmarks
        res = self.client.get("/api/careers/bookmarks", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["count"], 1)

        # Toggle unbookmark
        res = self.client.post("/api/careers/1/bookmark", headers=headers)
        self.assertFalse(res.get_json()["bookmarked"])

if __name__ == "__main__":
    unittest.main()
