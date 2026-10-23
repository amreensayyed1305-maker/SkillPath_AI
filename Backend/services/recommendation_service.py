import os
import requests
from flask import current_app
from models import Career, Roadmap, UserProgress, QuizAttempt, SkillRating, Project, Certification
from extensions import db

# Default skills mapped to roles
ROLE_SKILLS_MAP = {
    "Frontend Developer": ["HTML & CSS", "JavaScript", "Responsive design", "Git & GitHub", "Projects"],
    "Backend Developer": ["Programming fundamentals", "APIs", "SQL & databases", "Git & testing", "Projects"],
    "Data Analyst": ["SQL", "Spreadsheets", "Python & data cleaning", "Data visualization", "Projects"],
    "Python Developer": ["Python fundamentals", "Functions & OOP", "Data structures", "APIs & files", "Projects"],
    "Java Developer": ["Java fundamentals", "OOP", "Collections & DSA", "SQL", "Projects"],
    "AI / ML Engineer": ["Python", "Statistics", "Data preparation", "Machine learning", "Projects"],
    "Software Engineer": ["DSA", "Programming", "System Design", "Git & Testing", "Projects"],
    "Full Stack Developer": ["Frontend UI", "Backend APIs", "Databases", "Authentication", "Deployment"],
    "Data Engineer": ["SQL", "Python", "ETL Pipelines", "Data Warehousing", "Distributed Systems"]
}

SKILL_TO_ROADMAP_MAP = {
    "HTML & CSS": "Web Development",
    "JavaScript": "JavaScript",
    "Responsive design": "Web Development",
    "Frontend UI": "Web Development",
    "Programming fundamentals": "Python",
    "Python fundamentals": "Python",
    "Functions & OOP": "Python",
    "Python": "Python",
    "Python & data cleaning": "Python",
    "APIs": "Python",
    "Backend APIs": "Python",
    "SQL & databases": "SQL",
    "SQL": "SQL",
    "Databases": "SQL",
    "Data visualization": "AI / Machine Learning",
    "Statistics": "AI / Machine Learning",
    "Data preparation": "AI / Machine Learning",
    "Machine learning": "AI / Machine Learning",
    "Java fundamentals": "Java",
    "OOP": "Java",
    "Collections & DSA": "Java",
    "DSA": "Data Structures & Algorithms",
    "Data structures": "Data Structures & Algorithms",
    "Git & GitHub": "Web Development",
    "Git & testing": "Web Development",
    "Deployment": "Web Development",
    "Projects": "Web Development"
}

def analyze_skill_gaps(user_id, role_name):
    """
    Perform a transparent comparison of a student's self-assessed ratings
    and objective quiz performance against role requirements.
    """
    skills = ROLE_SKILLS_MAP.get(role_name, ROLE_SKILLS_MAP["Frontend Developer"])

    # Retrieve user's self-ratings
    user_ratings = {}
    if user_id:
        ratings_records = SkillRating.query.filter_by(user_id=user_id, role_name=role_name).all()
        for r in ratings_records:
            user_ratings[r.skill_name] = r.rating_value

    strengths = []
    gaps = []
    recommended_milestones = []

    total_possible = len(skills) * 5
    current_score = 0

    for s in skills:
        val = user_ratings.get(s, 0)
        current_score += val
        rec_track = SKILL_TO_ROADMAP_MAP.get(s, "Python")

        if val >= 3:
            strengths.append({
                "skill": s,
                "rating": val,
                "status": "Proficient" if val >= 4 else "Competent"
            })
        else:
            gaps.append({
                "skill": s,
                "rating": val,
                "status": "Needs Improvement" if val > 0 else "Not Started",
                "recommended_track": rec_track
            })
            recommended_milestones.append(f"Focus on {s} via the '{rec_track}' learning roadmap.")

    readiness_percentage = round((current_score / total_possible) * 100) if total_possible else 0

    # Retrieve objective quiz history if available
    objective_history = []
    if user_id:
        attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
        for att in attempts:
            objective_history.append({
                "track": att.track,
                "percent": att.percentage,
                "date": att.completed_at.strftime("%b %d, %Y") if att.completed_at else None
            })

    return {
        "role": role_name,
        "skills": skills,
        "ratings": user_ratings,
        "readiness_score": readiness_percentage,
        "strengths": strengths,
        "gaps": gaps,
        "recommendations": recommended_milestones,
        "objective_history": objective_history,
        "is_objective": False, # Distinguishes self-report
        "disclaimer": "This readiness indicator reflects self-reported proficiency and initial quiz samples. Validate with projects and code reviews."
    }

def get_career_recommendations(user):
    """
    Generate actionable career guidance based on user profile,
    roadmap progress, quiz scores, and portfolio.
    """
    if not user:
        return {
            "source": "rule-based",
            "recommendations": [
                "Create an account and set your career goals to receive personalized advice.",
                "Start with core fundamentals like Python or SQL.",
                "Complete practice quizzes to benchmark your concepts."
            ]
        }

    recs = []

    # 1. Check roadmap progress
    progress_count = UserProgress.query.filter_by(user_id=user.id, completed=True).count()
    if progress_count == 0:
        recs.append("You have not started any learning tracks yet. Select Python or Web Development in Skill Roadmap to begin.")
    elif progress_count < 5:
        recs.append(f"You have completed {progress_count} roadmap topics. Aim for at least 1 topic per day to build learning momentum.")
    else:
        recs.append(f"Strong dedication! You have completed {progress_count} topics across your learning roadmaps.")

    # 2. Check quiz performance
    attempts = QuizAttempt.query.filter_by(user_id=user.id).all()
    if not attempts:
        recs.append("Take a daily quiz in Practice Zone to benchmark your skill retention.")
    else:
        avg_score = round(sum(a.percentage for a in attempts) / len(attempts))
        low_tracks = [a.track for a in attempts if a.percentage < 60]
        if low_tracks:
            unique_low = list(set(low_tracks))
            recs.append(f"Your scores in {', '.join(unique_low)} are under 60%. Review the Revision Notes and re-attempt the quiz.")
        elif avg_score >= 80:
            recs.append(f"Great assessment performance with an overall average of {avg_score}%. You're ready to tackle hands-on projects!")

    # 3. Check portfolio
    proj_count = Project.query.filter_by(user_id=user.id).count()
    if proj_count == 0:
        recs.append("Build and showcase your first project in the Skill Portfolio to prove your practical ability to recruiters.")
    elif proj_count < 3:
        recs.append(f"You have {proj_count} project(s) showcased. Target 3 polished portfolio projects with live demo links.")

    # 4. Check resume
    if not user.resume or not user.resume.r_summary:
        recs.append("Complete your Resume Builder details and download the professional PDF resume.")

    return {
        "source": "rule-based",
        "recommendations": recs
    }

def generate_chat_response(message, user=None):
    """
    Generate assistant response for student queries.
    Uses contextual awareness if student is authenticated.
    """
    text = (message or "").strip().lower()

    # Rule-based contextual matching
    if any(k in text for k in ["frontend", "web developer", "website", "css", "html"]):
        return {
            "source": "rule-based",
            "reply": (
                "For Frontend Development, follow this proven roadmap:\n\n"
                "1. Master HTML5 semantic structure and accessible forms.\n"
                "2. Modern CSS: Flexbox, CSS Grid, custom properties, and responsive design.\n"
                "3. Core JavaScript: DOM manipulation, event handling, and Fetch API.\n"
                "4. Version Control: Git branching, pull requests, and GitHub Pages.\n"
                "5. Build 3 projects: a landing page, an API-powered dashboard, and an interactive web app.\n\n"
                "Next action: Switch to the 'Web Development' track in Skill Roadmap to begin Day 1."
            )
        }

    if any(k in text for k in ["backend", "server", "api", "database", "sql"]):
        return {
            "source": "rule-based",
            "reply": (
                "For Backend Development, prioritize these capabilities:\n\n"
                "1. Strong programming foundation in Python, Java, or Node.js.\n"
                "2. Relational Database Design: PostgreSQL or SQLite, normal forms, indexing, and joins.\n"
                "3. REST API architecture: HTTP status codes, JSON formatting, authentication (JWT/Sessions).\n"
                "4. Testing and ORM mastery: SQLAlchemy, pytest, and unit test suites.\n"
                "5. Secure coding: password hashing, input validation, and CORS security.\n\n"
                "Next action: Open the 'Python' or 'SQL' roadmap to complete server and query fundamentals."
            )
        }

    if any(k in text for k in ["resume", "cv", "hire", "recruiter"]):
        return {
            "source": "rule-based",
            "reply": (
                "To optimize your resume for campus placements and tech internships:\n\n"
                "• Highlight 2-3 substantial projects with GitHub links and tech stacks.\n"
                "• Quantify your impact (e.g., 'Reduced query latency by 30%', 'Implemented 15+ REST endpoints').\n"
                "• Ensure contact info, LinkedIn, and GitHub links are valid and active.\n"
                "• Match technical skills with job requirements (avoid listing skills you cannot explain).\n\n"
                "Next action: Head over to Resume Builder to enter your details and generate a clean PDF."
            )
        }

    if any(k in text for k in ["placement", "interview", "job", "dsa", "prep"]):
        return {
            "source": "rule-based",
            "reply": (
                "Placement Preparation Strategy:\n\n"
                "1. Data Structures & Algorithms: solve problems daily on arrays, strings, hash maps, two pointers, and trees.\n"
                "2. Core CS Fundamentals: revise DBMS, Operating Systems, Computer Networks, and OOP.\n"
                "3. System & API Knowledge: be ready to explain how an end-to-end web request works.\n"
                "4. Behavioral & Project Deep-Dive: practice articulating challenges you faced in your portfolio projects.\n\n"
                "Next action: Take today's Practice Zone quiz to test your conceptual recall."
            )
        }

    if any(k in text for k in ["gap", "weak", "reality", "readiness"]):
        return {
            "source": "rule-based",
            "reply": (
                "How to close skill gaps effectively:\n\n"
                "1. Go to 'Skill Reality Check' and honestly rate your proficiency for your target role.\n"
                "2. Note any skill rated below 3/5.\n"
                "3. Dedicate 45 minutes daily to the matching learning track in Skill Roadmap.\n"
                "4. After completing a milestone, attempt the corresponding Practice Zone quiz to verify comprehension."
            )
        }

    # Contextual fallback
    user_context = ""
    if user:
        name = user.profile.name if user.profile else "Student"
        prog = UserProgress.query.filter_by(user_id=user.id, completed=True).count()
        user_context = f"\n\nCurrent progress for {name}: {prog} roadmap topics completed."

    return {
        "source": "rule-based",
        "reply": (
            f"Here is a structured approach to your career goals:{user_context}\n\n"
            "1. Define your target career path in Career Explorer.\n"
            "2. Follow the step-by-step milestones in Skill Roadmap.\n"
            "3. Validate knowledge with daily Practice Zone assessments.\n"
            "4. Showcase projects in Skill Portfolio and download your resume.\n\n"
            "Feel free to ask specific questions about Frontend, Backend, SQL, Python, DSA, or interview preparation!"
        )
    }
