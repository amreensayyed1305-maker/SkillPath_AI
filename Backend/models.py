from datetime import datetime, timezone, date
import json
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db

def utcnow():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default="student", nullable=False) # 'student', 'admin'
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    profile = db.relationship("UserProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    progress = db.relationship("UserProgress", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    quiz_attempts = db.relationship("QuizAttempt", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    projects = db.relationship("Project", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    certifications = db.relationship("Certification", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    resume = db.relationship("Resume", backref="user", uselist=False, cascade="all, delete-orphan")
    bookmarks = db.relationship("BookmarkedCareer", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    skill_ratings = db.relationship("SkillRating", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    activities = db.relationship("UserActivity", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "profile": self.profile.to_dict() if self.profile else None
        }


class UserProfile(db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), default="Student")
    degree = db.Column(db.String(100), default="B.Tech CSE (AI)")
    year = db.Column(db.String(50), default="3rd Year")
    email = db.Column(db.String(120), default="")
    location = db.Column(db.String(100), default="")
    bio = db.Column(db.Text, default="")
    github = db.Column(db.String(255), default="")
    linkedin = db.Column(db.String(255), default="")
    skills_json = db.Column(db.Text, default="[]") # JSON list of strings
    career_goals = db.Column(db.String(255), default="")
    avatar_url = db.Column(db.String(255), default="")
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    @property
    def skills(self):
        try:
            return json.loads(self.skills_json) if self.skills_json else []
        except Exception:
            return []

    @skills.setter
    def skills(self, skill_list):
        if isinstance(skill_list, list):
            self.skills_json = json.dumps(skill_list)
        else:
            self.skills_json = json.dumps([])

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "degree": self.degree,
            "year": self.year,
            "email": self.email,
            "location": self.location,
            "bio": self.bio,
            "github": self.github,
            "linkedin": self.linkedin,
            "skills": self.skills,
            "career_goals": self.career_goals,
            "avatar_url": self.avatar_url,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Career(db.Model):
    __tablename__ = "careers"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), unique=True, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False, index=True) # 'Development', 'Data', 'AI / ML', 'Core CS'
    icon = db.Column(db.String(20), default="◈")
    description = db.Column(db.Text, nullable=False)
    roadmap_track = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    skills = db.relationship("CareerSkill", backref="career", cascade="all, delete-orphan", lazy="joined")
    tasks = db.relationship("CareerTask", backref="career", cascade="all, delete-orphan", order_by="CareerTask.order")
    bookmarks = db.relationship("BookmarkedCareer", backref="career", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, user_id=None):
        is_bookmarked = False
        if user_id:
            is_bookmarked = BookmarkedCareer.query.filter_by(user_id=user_id, career_id=self.id).first() is not None

        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "icon": self.icon,
            "description": self.description,
            "roadmap": self.roadmap_track,
            "skills": [s.skill_name for s in self.skills],
            "tasks": [t.task_description for t in self.tasks],
            "is_bookmarked": is_bookmarked
        }


class CareerSkill(db.Model):
    __tablename__ = "career_skills"

    id = db.Column(db.Integer, primary_key=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_name = db.Column(db.String(100), nullable=False)
    importance = db.Column(db.String(20), default="required") # required, recommended, optional


class CareerTask(db.Model):
    __tablename__ = "career_tasks"

    id = db.Column(db.Integer, primary_key=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True)
    task_description = db.Column(db.String(255), nullable=False)
    order = db.Column(db.Integer, default=0)


class BookmarkedCareer(db.Model):
    __tablename__ = "bookmarked_careers"
    __table_args__ = (db.UniqueConstraint("user_id", "career_id", name="uq_user_career_bookmark"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    career_id = db.Column(db.Integer, db.ForeignKey("careers.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utcnow)


class Roadmap(db.Model):
    __tablename__ = "roadmaps"

    id = db.Column(db.Integer, primary_key=True)
    track = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, default="")
    total_days = db.Column(db.Integer, default=10)

    steps = db.relationship("RoadmapStep", backref="roadmap", cascade="all, delete-orphan", order_by="RoadmapStep.day_number")

    def to_dict(self):
        return {
            "id": self.id,
            "track": self.track,
            "description": self.description,
            "total_days": self.total_days,
            "steps": [s.to_dict() for s in self.steps]
        }


class RoadmapStep(db.Model):
    __tablename__ = "roadmap_steps"

    id = db.Column(db.Integer, primary_key=True)
    roadmap_id = db.Column(db.Integer, db.ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    study_time_min = db.Column(db.Integer, default=30)
    resources_json = db.Column(db.Text, default="[]")

    def to_dict(self):
        try:
            res = json.loads(self.resources_json) if self.resources_json else []
        except Exception:
            res = []
        return {
            "id": self.id,
            "day": self.day_number,
            "title": self.title,
            "description": self.description,
            "study_time_min": self.study_time_min,
            "resources": res
        }


class UserProgress(db.Model):
    __tablename__ = "user_progress"
    __table_args__ = (db.UniqueConstraint("user_id", "roadmap_track", "step_index", name="uq_user_track_step"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    roadmap_track = db.Column(db.String(100), nullable=False, index=True)
    step_index = db.Column(db.Integer, nullable=False)
    completed = db.Column(db.Boolean, default=True, nullable=False)
    completed_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "track": self.roadmap_track,
            "step_index": self.step_index,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    track = db.Column(db.String(100), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, default="")

    questions = db.relationship("Question", backref="quiz", cascade="all, delete-orphan")
    attempts = db.relationship("QuizAttempt", backref="quiz", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, include_answers=False):
        return {
            "id": self.id,
            "track": self.track,
            "title": self.title,
            "description": self.description,
            "question_count": len(self.questions),
            "questions": [q.to_dict(include_answer=include_answers) for q in self.questions]
        }


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = db.Column(db.Text, nullable=False)
    options_json = db.Column(db.Text, nullable=False) # JSON list of strings
    correct_answer_index = db.Column(db.Integer, nullable=False)
    explanation = db.Column(db.Text, nullable=False)
    topic = db.Column(db.String(100), default="Basics")
    difficulty = db.Column(db.String(20), default="easy") # easy, medium, hard

    @property
    def options(self):
        try:
            return json.loads(self.options_json) if self.options_json else []
        except Exception:
            return []

    def to_dict(self, include_answer=False):
        data = {
            "id": self.id,
            "question": self.question_text,
            "options": self.options,
            "topic": self.topic,
            "difficulty": self.difficulty
        }
        if include_answer:
            data["correct_answer"] = self.correct_answer_index
            data["explanation"] = self.explanation
        return data


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=True, index=True)
    track = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    percentage = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(db.DateTime, default=utcnow)

    answers = db.relationship("QuizAnswer", backref="attempt", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "track": self.track,
            "score": self.score,
            "total": self.total_questions,
            "percent": self.percentage,
            "date": self.completed_at.isoformat() if self.completed_at else None,
            "answers": [a.to_dict() for a in self.answers]
        }


class QuizAnswer(db.Model):
    __tablename__ = "quiz_answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_option = db.Column(db.Integer, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)

    def to_dict(self):
        return {
            "question_id": self.question_id,
            "selected_option": self.selected_option,
            "is_correct": self.is_correct
        }


class SkillRating(db.Model):
    __tablename__ = "skill_ratings"
    __table_args__ = (db.UniqueConstraint("user_id", "role_name", "skill_name", name="uq_user_role_skill"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_name = db.Column(db.String(100), nullable=False, index=True)
    skill_name = db.Column(db.String(100), nullable=False)
    rating_value = db.Column(db.Integer, default=0, nullable=False) # 0 to 5
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "role": self.role_name,
            "skill": self.skill_name,
            "rating": self.rating_value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(255), default="")
    technologies = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "link": self.link,
            "technologies": self.technologies,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Certification(db.Model):
    __tablename__ = "certifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    issuer = db.Column(db.String(150), nullable=False)
    link = db.Column(db.String(255), default="")
    issue_date = db.Column(db.String(50), default="")
    expiry_date = db.Column(db.String(50), default="")
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "issuer": self.issuer,
            "link": self.link,
            "issue_date": self.issue_date,
            "expiry_date": self.expiry_date,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    r_name = db.Column(db.String(150), default="")
    r_email = db.Column(db.String(120), default="")
    r_phone = db.Column(db.String(50), default="")
    r_location = db.Column(db.String(100), default="")
    r_linkedin = db.Column(db.String(255), default="")
    r_github = db.Column(db.String(255), default="")

    r_degree = db.Column(db.String(150), default="")
    r_college = db.Column(db.String(200), default="")
    r_graduation = db.Column(db.String(50), default="")
    r_cgpa = db.Column(db.String(50), default="")

    r_summary = db.Column(db.Text, default="")
    r_skills = db.Column(db.Text, default="")
    r_projects = db.Column(db.Text, default="")
    r_experience = db.Column(db.Text, default="")
    r_certifications = db.Column(db.Text, default="")
    r_achievements = db.Column(db.Text, default="")
    photo_path = db.Column(db.String(255), default="")

    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "rName": self.r_name or "",
            "rEmail": self.r_email or "",
            "rPhone": self.r_phone or "",
            "rLocation": self.r_location or "",
            "rLinkedin": self.r_linkedin or "",
            "rGithub": self.r_github or "",
            "rDegree": self.r_degree or "",
            "rCollege": self.r_college or "",
            "rGraduation": self.r_graduation or "",
            "rCgpa": self.r_cgpa or "",
            "rSummary": self.r_summary or "",
            "rSkills": self.r_skills or "",
            "rProjects": self.r_projects or "",
            "rExperience": self.r_experience or "",
            "rCertifications": self.r_certifications or "",
            "rAchievements": self.r_achievements or "",
            "photo_path": self.photo_path or "",
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class UserActivity(db.Model):
    __tablename__ = "user_activity"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = db.Column(db.String(50), nullable=False) # 'roadmap_step', 'quiz_completed', 'profile_update', 'project_added'
    activity_date = db.Column(db.Date, default=date.today, nullable=False, index=True)
    description = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=utcnow)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default="info") # 'info', 'milestone', 'quiz', 'resume'
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
