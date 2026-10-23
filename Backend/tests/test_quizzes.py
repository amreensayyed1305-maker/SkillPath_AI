import unittest
from app import create_app
from extensions import db

class QuizzesTestCase(unittest.TestCase):
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

    def test_quiz_questions_do_not_expose_correct_answers(self):
        res = self.client.get("/api/quizzes/Python")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreater(data["total_questions"], 0)

        for q in data["questions"]:
            self.assertNotIn("correct_answer", q, "Security failure: correct answer was leaked before submission!")
            self.assertNotIn("explanation", q, "Security failure: explanation was leaked before submission!")

    def test_quiz_submit_server_side_scoring(self):
        # Register user
        reg_res = self.client.post("/api/auth/register", json={
            "email": "quiz_user@growvia.ai",
            "password": "Password123",
            "name": "Devon"
        })
        token = reg_res.get_json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Python quiz correct answers:
        # Q1: def (index 1)
        # Q2: len (index 1)
        # Q3: Set (index 2)
        # Q4: except (index 2)
        # Q5: range(3) (index 1)
        submitted_answers = [1, 1, 2, 2, 1]

        res = self.client.post("/api/quizzes/Python/submit", headers=headers, json={
            "answers": submitted_answers
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["correct"], 5)
        self.assertEqual(data["percent"], 100)
        self.assertEqual(len(data["review"]), 5)

        # Check that assessment history recorded this attempt
        hist_res = self.client.get("/api/assessments/history", headers=headers)
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.get_json()
        self.assertEqual(hist_data["count"], 1)
        self.assertEqual(hist_data["history"][0]["percent"], 100)

if __name__ == "__main__":
    unittest.main()
