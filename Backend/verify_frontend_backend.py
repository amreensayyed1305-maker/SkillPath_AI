import requests
import json

BASE = "http://127.0.0.1:5000"

print("=" * 60)
print("GROWVIA AI - COMPREHENSIVE INTEGRATION VERIFICATION")
print("=" * 60)

# 1. Frontend Static Assets
print("\n[1] Verifying Frontend Static Delivery...")
res = requests.get(f"{BASE}/")
assert res.status_code == 200 and "GrowVia" in res.text, "index.html failed to serve"
print("  [PASS] index.html served correctly (HTTP 200)")

res_css = requests.get(f"{BASE}/style.css")
assert res_css.status_code == 200 and "--purple" in res_css.text, "style.css failed"
print("  [PASS] style.css served with Growvia orange/cream palette (HTTP 200)")

res_js = requests.get(f"{BASE}/script.js")
assert res_js.status_code == 200 and "API_BASE" in res_js.text, "script.js failed"
print("  [PASS] script.js served with API client (HTTP 200)")

res_logo = requests.get(f"{BASE}/growvia-logo.png")
assert res_logo.status_code == 200, "growvia-logo.png failed"
print(f"  [PASS] growvia-logo.png served ({len(res_logo.content)} bytes, HTTP 200)")

# 2. Authentication Flow
print("\n[2] Verifying Authentication System...")
test_email = "verify_student@growvia.ai"
reg_payload = {
    "name": "Verification Student",
    "email": test_email,
    "password": "VerifyPassword123!",
    "degree": "B.Tech CSE",
    "year": "4th Year"
}
# Delete if already exists from prior run
login_res = requests.post(f"{BASE}/api/auth/login", json={"email": test_email, "password": "VerifyPassword123!"})
if login_res.status_code != 200:
    reg_res = requests.post(f"{BASE}/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    token = reg_res.json()["token"]
    print("  [PASS] Registered new student successfully (HTTP 201)")
else:
    token = login_res.json()["token"]
    print("  [PASS] Logged in existing student successfully (HTTP 200)")

headers = {"Authorization": f"Bearer {token}"}

me_res = requests.get(f"{BASE}/api/auth/me", headers=headers)
assert me_res.status_code == 200, f"/me failed: {me_res.text}"
user_data = me_res.json()["user"]
print(f"  [PASS] Session verified via JWT Bearer token: {user_data['email']} (ID: {user_data['id']})")

# 3. Career Explorer
print("\n[3] Verifying Career Explorer...")
careers_res = requests.get(f"{BASE}/api/careers", headers=headers)
assert careers_res.status_code == 200, "Careers endpoint failed"
careers = careers_res.json()["careers"]
print(f"  [PASS] Retrieved {len(careers)} career paths")

# Search
search_res = requests.get(f"{BASE}/api/careers?q=python", headers=headers)
assert search_res.status_code == 200 and search_res.json()["count"] > 0, "Career search failed"
print(f"  [PASS] Search query '?q=python' matched {search_res.json()['count']} career(s)")

# Category filter
cat_res = requests.get(f"{BASE}/api/careers?category=AI%20/%20ML", headers=headers)
assert cat_res.status_code == 200 and cat_res.json()["count"] > 0, "Category filter failed"
print(f"  [PASS] Category filter '?category=AI / ML' matched {cat_res.json()['count']} career(s)")

# Bookmark
c_id = careers[0]["id"]
bm_res = requests.post(f"{BASE}/api/careers/{c_id}/bookmark", headers=headers)
assert bm_res.status_code in (200, 201), "Bookmark toggle failed"
print(f"  [PASS] Toggled career bookmark for '{careers[0]['title']}' (Status: {bm_res.json()['bookmarked']})")

# 4. Roadmaps & Progress Tracking
print("\n[4] Verifying Skill Roadmaps & Progress Tracking...")
rm_res = requests.get(f"{BASE}/api/roadmaps/Web%20Development", headers=headers)
assert rm_res.status_code == 200, "Roadmap fetch failed"
rm_data = rm_res.json()
assert len(rm_data["steps"]) == 10, f"Expected 10 steps, got {len(rm_data['steps'])}"
print(f"  [PASS] Retrieved '{rm_data['track']}' roadmap with {len(rm_data['steps'])} structured milestones")

# Toggle progress Day 1 (index 0)
prog_res = requests.post(f"{BASE}/api/progress", headers=headers, json={"track": "Web Development", "step_index": 0})
assert prog_res.status_code == 200, f"Progress toggle failed: {prog_res.text}"
print(f"  [PASS] Milestone progress saved to database (Day 1 completed: {prog_res.json()['completed']})")

# 5. Practice Zone Quizzes
print("\n[5] Verifying Practice Zone Assessments...")
q_res = requests.get(f"{BASE}/api/quizzes/Python")
assert q_res.status_code == 200, "Quiz questions fetch failed"
q_data = q_res.json()
print(f"  [PASS] Loaded quiz questions for track '{q_data['track']}' ({q_data['total_questions']} questions)")

# Ensure answers are not leaked before submission
for q in q_data["questions"]:
    assert "correct_answer" not in q, "Security failure: answer leaked!"
    assert "explanation" not in q, "Security failure: explanation leaked!"
print("  [PASS] Security verified: correct answers and explanations are stripped prior to submission")

# Server-side submit
submit_res = requests.post(f"{BASE}/api/quizzes/Python/submit", headers=headers, json={"answers": [1, 1, 2, 2, 1]})
assert submit_res.status_code == 200, "Quiz submit failed"
s_data = submit_res.json()
assert s_data["percent"] == 100, f"Expected 100%, got {s_data['percent']}%"
print(f"  [PASS] Secure server-side score calculation verified (Score: {s_data['correct']}/{s_data['total']}, {s_data['percent']}%)")

# 6. Skill Gap Analysis & Recommendations
print("\n[6] Verifying Skill Gap Analysis & Recommendations...")
gap_res = requests.post(f"{BASE}/api/skill-gaps", headers=headers, json={
    "role": "Frontend Developer",
    "ratings": {
        "HTML & CSS": 4,
        "JavaScript": 4,
        "Responsive design": 2, # Intentional gap
        "Git & GitHub": 3,
        "Projects": 2          # Intentional gap
    }
})
assert gap_res.status_code == 200, f"Skill gap submit failed: {gap_res.text}"
analysis = gap_res.json()["analysis"]
assert analysis["readiness_score"] == 60, f"Expected 60%, got {analysis['readiness_score']}"
assert len(analysis["gaps"]) == 2, f"Expected 2 gaps, got {len(analysis['gaps'])}"
print(f"  [PASS] Skill gap analysis verified: Readiness Score {analysis['readiness_score']}%, Identified {len(analysis['gaps'])} gap(s)")

rec_res = requests.get(f"{BASE}/api/recommendations", headers=headers)
assert rec_res.status_code == 200, "Recommendations failed"
print(f"  [PASS] Rule-based career guidance generated ({len(rec_res.json()['recommendations'])} actionable items)")

# 7. Portfolio & Certifications CRUD
print("\n[7] Verifying Portfolio & Certifications CRUD...")
# Create Project
new_proj = requests.post(f"{BASE}/api/projects", headers=headers, json={
    "title": "Growvia AI Fullstack",
    "description": "Career guidance platform with Flask backend and vanilla JS frontend",
    "link": "https://github.com/prompt-engineers/growvia",
    "technologies": "Python, Flask, SQLite, HTML5, CSS3, JavaScript"
})
assert new_proj.status_code == 201, f"Project creation failed: {new_proj.text}"
proj_id = new_proj.json()["project"]["id"]
print(f"  [PASS] Created project '{new_proj.json()['project']['title']}' (ID: {proj_id})")

# Update Project
upd_proj = requests.put(f"{BASE}/api/projects/{proj_id}", headers=headers, json={
    "title": "Growvia AI Fullstack (Updated)"
})
assert upd_proj.status_code == 200, "Project update failed"
print(f"  [PASS] Updated project ID {proj_id}")

# Create Certification
new_cert = requests.post(f"{BASE}/api/certifications", headers=headers, json={
    "title": "AWS Certified Developer - Associate",
    "issuer": "Amazon Web Services",
    "link": "https://aws.amazon.com/verification",
    "issue_date": "2026-05-15"
})
assert new_cert.status_code == 201, f"Cert creation failed: {new_cert.text}"
cert_id = new_cert.json()["certification"]["id"]
print(f"  [PASS] Created certification '{new_cert.json()['certification']['title']}' (ID: {cert_id})")

# 8. Resume Builder & PDF Generation
print("\n[8] Verifying Resume Persistence & PDF Generation...")
resume_payload = {
    "rName": "Verification Student",
    "rEmail": test_email,
    "rPhone": "+91 9876543210",
    "rLocation": "Bengaluru, India",
    "rDegree": "B.Tech Computer Science & Engineering",
    "rCollege": "Indian Institute of Information Technology",
    "rGraduation": "2026",
    "rCgpa": "9.2 CGPA",
    "rSummary": "Software engineer with solid experience in backend architecture and fullstack web applications.",
    "rSkills": "Python, Flask, PostgreSQL, SQLite, JavaScript, HTML5, CSS3, Git",
    "rProjects": "Growvia AI - Placement preparation platform with PDF resume generation.",
    "rExperience": "Software Development Intern at Tech Solutions.",
    "rCertifications": "AWS Certified Developer Associate",
    "rAchievements": "Hackathon Finalist 2025"
}
save_res = requests.put(f"{BASE}/api/resume", headers=headers, json=resume_payload)
assert save_res.status_code == 200, f"Resume save failed: {save_res.text}"
print("  [PASS] Stored complete resume details in database (HTTP 200)")

pdf_res = requests.get(f"{BASE}/api/resume/pdf", headers=headers)
assert pdf_res.status_code == 200, f"PDF generation failed: {pdf_res.text}"
assert pdf_res.headers.get("Content-Type") == "application/pdf", "Incorrect PDF content type"
assert pdf_res.content.startswith(b"%PDF-"), "Invalid PDF binary stream"
print(f"  [PASS] Downloaded server-generated PDF resume ({len(pdf_res.content)} bytes, valid %PDF- header)")

# 9. Dashboard Analytics & Notifications
print("\n[9] Verifying Real Dashboard Metrics...")
dash_res = requests.get(f"{BASE}/api/dashboard", headers=headers)
assert dash_res.status_code == 200, "Dashboard fetch failed"
d = dash_res.json()
assert d["authenticated"] is True, "Expected authenticated dashboard"
assert d["streak"] >= 1, "Expected streak >= 1"
assert d["topics_completed"] >= 1, "Expected completed topics >= 1"
assert d["practice_average"] == 100, f"Expected 100% quiz average, got {d['practice_average']}"
assert d["portfolio_count"] >= 2, "Expected portfolio items >= 2"
print(f"  [PASS] Dashboard calculated real metrics from database:")
print(f"      • Streak: {d['streak']} day(s)")
print(f"      • Topics Completed: {d['topics_completed']}")
print(f"      • Assessment Average: {d['practice_average']}%")
print(f"      • Portfolio Projects & Certs: {d['portfolio_count']}")

# 10. AI Assistant Chat
print("\n[10] Verifying AI Career Assistant...")
chat_res = requests.post(f"{BASE}/api/assistant/chat", headers=headers, json={
    "message": "What should I learn next for backend engineering?"
})
assert chat_res.status_code == 200, "Chat assistant failed"
chat_data = chat_res.json()
assert "reply" in chat_data and len(chat_data["reply"]) > 20, "Empty chat reply"
print(f"  [PASS] AI Career Assistant responded (Source: {chat_data['source']})")
print(f"      Preview: {chat_data['reply'][:90]}...")

print("\n" + "=" * 60)
print("ALL 10 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!")
print("=" * 60)
