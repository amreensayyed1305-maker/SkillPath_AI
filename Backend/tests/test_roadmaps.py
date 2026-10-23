import unittest
from app import create_app
from extensions import db

class RoadmapsTestCase(unittest.TestCase):
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

    def test_get_roadmap_tracks(self):
        res = self.client.get("/api/roadmaps")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("Python", data["tracks"])
        self.assertIn("Web Development", data["tracks"])

    def test_get_track_details(self):
        res = self.client.get("/api/roadmaps/Python")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["track"], "Python")
        self.assertEqual(len(data["steps"]), 10)

    def test_toggle_progress(self):
        # Register user
        reg_res = self.client.post("/api/auth/register", json={
            "email": "roadmap_user@growvia.ai",
            "password": "Password123",
            "name": "Sam"
        })
        token = reg_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Toggle Day 1 (step_index 0) complete
        res = self.client.post("/api/progress", headers=headers, json={
            "track": "Python",
            "step_index": 0
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["completed"])
        self.assertIn(0, res.get_json()["completed_indices"])

        # Fetch progress
        res = self.client.get("/api/progress", headers=headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["total_completed"], 1)

        # Toggle incomplete
        res = self.client.post("/api/progress", headers=headers, json={
            "track": "Python",
            "step_index": 0
        })
        self.assertFalse(res.get_json()["completed"])

if __name__ == "__main__":
    unittest.main()
