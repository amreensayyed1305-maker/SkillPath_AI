import unittest
from app import create_app
from extensions import db

class PortfolioAndResumeTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app("testing")
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        # Register User A
        res_a = self.client.post("/api/auth/register", json={
            "email": "user_a@growvia.ai",
            "password": "Password123",
            "name": "User Alpha"
        })
        self.token_a = res_a.get_json()["token"]
        self.headers_a = {"Authorization": f"Bearer {self.token_a}"}

        # Register User B
        res_b = self.client.post("/api/auth/register", json={
            "email": "user_b@growvia.ai",
            "password": "Password123",
            "name": "User Beta"
        })
        self.token_b = res_b.get_json()["token"]
        self.headers_b = {"Authorization": f"Bearer {self.token_b}"}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_project_crud_and_ownership_protection(self):
        # User A creates a project
        res = self.client.post("/api/projects", headers=self.headers_a, json={
            "title": "Alpha Project",
            "description": "Built an awesome AI pipeline",
            "link": "https://github.com/user_a/alpha",
            "technologies": "Python, Flask"
        })
        self.assertEqual(res.status_code, 201)
        proj_id = res.get_json()["project"]["id"]

        # User A can get their project
        list_res = self.client.get("/api/projects", headers=self.headers_a)
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(len(list_res.get_json()["projects"]), 1)

        # User B cannot see User A's project in their own project list
        list_b_res = self.client.get("/api/projects", headers=self.headers_b)
        self.assertEqual(len(list_b_res.get_json()["projects"]), 0)

        # User B cannot edit User A's project (Authorization check)
        edit_b_res = self.client.put(f"/api/projects/{proj_id}", headers=self.headers_b, json={
            "title": "Hacked Title"
        })
        self.assertEqual(edit_b_res.status_code, 403)

        # User B cannot delete User A's project (Authorization check)
        del_b_res = self.client.delete(f"/api/projects/{proj_id}", headers=self.headers_b)
        self.assertEqual(del_b_res.status_code, 403)

        # User A can edit their project
        edit_a_res = self.client.put(f"/api/projects/{proj_id}", headers=self.headers_a, json={
            "title": "Updated Alpha Project"
        })
        self.assertEqual(edit_a_res.status_code, 200)
        self.assertEqual(edit_a_res.get_json()["project"]["title"], "Updated Alpha Project")

        # User A can delete their project
        del_a_res = self.client.delete(f"/api/projects/{proj_id}", headers=self.headers_a)
        self.assertEqual(del_a_res.status_code, 200)

    def test_resume_save_and_pdf_generation(self):
        # Save resume details
        resume_payload = {
            "rName": "Alex Morgan",
            "rEmail": "alex@growvia.ai",
            "rPhone": "+91 9876543210",
            "rLocation": "Bengaluru, India",
            "rDegree": "B.Tech Computer Science",
            "rCollege": "Engineering Institute",
            "rGraduation": "2026",
            "rCgpa": "9.1",
            "rSummary": "Passionate software engineer skilled in full-stack web and machine learning.",
            "rSkills": "Python, JavaScript, SQL, Flask, React, Git",
            "rProjects": "Growvia AI - Full stack career roadmap platform with PDF export.",
            "rExperience": "Software Engineering Intern at Tech Corp.",
            "rCertifications": "AWS Certified Cloud Practitioner",
            "rAchievements": "1st Place in University Hackathon 2025"
        }

        save_res = self.client.put("/api/resume", headers=self.headers_a, json=resume_payload)
        self.assertEqual(save_res.status_code, 200)

        # Retrieve saved resume
        get_res = self.client.get("/api/resume", headers=self.headers_a)
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()["rName"], "Alex Morgan")

        # Download PDF
        pdf_res = self.client.get("/api/resume/pdf", headers=self.headers_a)
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.content_type, "application/pdf")
        self.assertGreater(len(pdf_res.data), 500) # Valid non-empty PDF bytes

    def test_dashboard_metrics(self):
        # Get dashboard for User A
        dash_res = self.client.get("/api/dashboard", headers=self.headers_a)
        self.assertEqual(dash_res.status_code, 200)
        dash_data = dash_res.get_json()
        self.assertTrue(dash_data["authenticated"])
        self.assertIn("roadmap_progress", dash_data)
        self.assertIn("streak", dash_data)
        self.assertIn("topics_completed", dash_data)

if __name__ == "__main__":
    unittest.main()
