import unittest
import json
from app import create_app
from extensions import db
from models import User

class AuthTestCase(unittest.TestCase):
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

    def test_register_success(self):
        res = self.client.post("/api/auth/register", json={
            "email": "newstudent@growvia.ai",
            "password": "Password123",
            "name": "Jordan Lee",
            "degree": "B.Tech IT",
            "year": "2nd Year"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["email"], "newstudent@growvia.ai")

    def test_register_duplicate_email(self):
        # Register once
        self.client.post("/api/auth/register", json={
            "email": "duplicate@growvia.ai",
            "password": "Password123",
            "name": "Jordan"
        })
        # Register twice
        res = self.client.post("/api/auth/register", json={
            "email": "duplicate@growvia.ai",
            "password": "DifferentPassword",
            "name": "Jordan"
        })
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertIn("already exists", data["error"])

    def test_login_success(self):
        # Register user
        self.client.post("/api/auth/register", json={
            "email": "logintest@growvia.ai",
            "password": "SecurePassword1",
            "name": "Taylor"
        })

        # Login
        res = self.client.post("/api/auth/login", json={
            "email": "logintest@growvia.ai",
            "password": "SecurePassword1"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("token", data)

    def test_login_invalid_password(self):
        self.client.post("/api/auth/register", json={
            "email": "wrongpass@growvia.ai",
            "password": "CorrectPassword",
            "name": "Taylor"
        })

        res = self.client.post("/api/auth/login", json={
            "email": "wrongpass@growvia.ai",
            "password": "IncorrectPassword"
        })
        self.assertEqual(res.status_code, 401)

    def test_me_endpoint_protected(self):
        # Unauthorized without token
        res = self.client.get("/api/auth/me")
        self.assertEqual(res.status_code, 401)

        # Register and get token
        reg_res = self.client.post("/api/auth/register", json={
            "email": "me_user@growvia.ai",
            "password": "Password123",
            "name": "Morgan"
        })
        token = reg_res.get_json()["token"]

        # Authorized with Bearer token
        res = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["user"]["email"], "me_user@growvia.ai")

if __name__ == "__main__":
    unittest.main()
