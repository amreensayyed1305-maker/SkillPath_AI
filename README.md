# Growvia AI — AI-Powered Career Guidance & Placement Readiness

**Team:** Prompt Engineers  
**Application Name:** Growvia AI (SkillPath AI)  
**Repository:** [https://github.com/amreensayyed1305-maker/SkillPath_AI.git](https://github.com/amreensayyed1305-maker/SkillPath_AI.git)

---

## 1. Project Overview

**Growvia AI** is a career guidance and placement readiness web platform built for engineering students and fresh graduates. It empowers students to:
- **Explore career paths** with realistic industry skills, day-to-day responsibilities, and preparation steps.
- **Follow structured learning roadmaps** organized into actionable daily milestones across Python, SQL, Java, JavaScript, DSA, AI/ML, and Web Development.
- **Practise concepts securely** through server-evaluated assessments, daily quizzes, and revision notes.
- **Diagnose skill gaps** with transparent rule-based comparisons against real career roles.
- **Showcase proof of work** through a project portfolio and verifiable certifications.
- **Generate a professional resume** with live in-browser preview and one-click server-side PDF download.
- **Track real learning analytics** including consecutive active streaks, completed milestones, and topic averages.

---

## 2. Architecture & Technology Stack

```
   ┌──────────────────────────────────────────────────────────────┐
   │                 Frontend (Vanilla HTML5 / CSS3 / JS)          │
   │  • Warm Orange & Cream Palette (#D96B43, #FFFAF4, #46352E)   │
   │  • Modular SPAs: Dashboard, Explorer, Roadmaps, Resume, etc. │
   │  • Fetch API + JWT Bearer Token Authentication               │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ JSON REST API
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                    Backend (Python / Flask)                  │
   │  • Application Factory (`app.py`), Modular Blueprints        │
   │  • PyJWT Authentication & Werkzeug Security Password Hashing │
   │  • ReportLab Server-side PDF Resume Generation               │
   │  • Rule-Based Recommendation Engine (Extensible for AI APIs) │
   └──────────────────────────────┬───────────────────────────────┘
                                  │ SQLAlchemy ORM
                                  ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                    Database (Relational)                     │
   │  • SQLite for local development (`instance/growvia.db`)       │
   │  • PostgreSQL compatible models for production               │
   │  • 18 Normalized tables with foreign keys and cascade rules  │
   └──────────────────────────────────────────────────────────────┘
```

- **Frontend:** Vanilla HTML5, CSS3, ES6+ JavaScript (Fetch API, responsive flexbox & CSS grid).
- **Backend:** Python 3.10+ with Flask 3.x.
- **Database ORM:** SQLAlchemy via Flask-SQLAlchemy (compatible with SQLite and PostgreSQL).
- **Authentication:** JWT (JSON Web Tokens) with HS256 algorithm and Werkzeug secure salted password hashing (`scrypt`).
- **PDF Engine:** ReportLab 5.x for server-side PDF resume generation.
- **Testing:** Python `unittest` test suite covering Auth, Careers, Roadmaps, Quizzes, Portfolio, Resume, and Dashboard.

---

## 3. Directory Structure

```text
SkillPath_AI/
├── Backend/
│   ├── app.py                     # Flask application factory & server entry point
│   ├── config.py                  # Environment-driven configuration (Dev, Test, Prod)
│   ├── extensions.py              # Flask extensions (db, cors)
│   ├── models.py                  # 18 Relational database models
│   ├── seed.py                    # Idempotent starter data seeder
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Template environment configuration
│   ├── instance/
│   │   └── growvia.db             # SQLite development database
│   ├── uploads/                   # Secure storage for uploaded resume photos
│   ├── routes/
│   │   ├── auth.py                # Register, login, logout, me
│   │   ├── careers.py             # Career Explorer & bookmarks
│   │   ├── roadmaps.py            # Roadmaps & user progress tracking
│   │   ├── quizzes.py             # Practice zone & server-side assessment
│   │   ├── skill_gap.py           # Skill Reality Check & recommendations
│   │   ├── portfolio.py           # Profile, project CRUD, certification CRUD
│   │   ├── resume.py              # Resume storage & server-side PDF generation
│   │   ├── dashboard.py           # Dashboard analytics & notifications
│   │   └── assistant.py           # Career Assistant guidance chat
│   ├── services/
│   │   ├── auth_service.py        # Token generation, decoding, & streak calculator
│   │   ├── pdf_service.py         # ReportLab PDF resume generator
│   │   └── recommendation_service.py # Rule-based recommendation engine
│   └── tests/
│       ├── test_auth.py           # Authentication & authorization tests
│       ├── test_careers.py        # Careers & bookmark tests
│       ├── test_roadmaps.py       # Roadmap tracks & progress tests
│       ├── test_quizzes.py        # Quiz question secrecy & scoring tests
│       └── test_portfolio_and_resume.py # Project/cert CRUD & PDF generation tests
├── Frontend/
│   ├── index.html                 # Complete Growvia AI single-page interface
│   ├── script.js                  # Frontend application logic & API integration
│   ├── style.css                  # Growvia AI design system & responsive styling
│   └── growvia-logo.png           # Growvia AI branding asset
└── README.md                      # Complete project documentation
```

---

## 4. Database Schema (18 Tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User credentials & roles | `id`, `email`, `password_hash`, `role`, `created_at` |
| `user_profiles` | Student personal details & skills | `id`, `user_id` (FK), `name`, `degree`, `year`, `bio`, `github`, `linkedin`, `skills_json` |
| `careers` | Target career roles | `id`, `title`, `category`, `icon`, `description`, `roadmap_track` |
| `career_skills` | Skills expected for each role | `id`, `career_id` (FK), `skill_name`, `importance` |
| `career_tasks` | Suggested preparation milestones | `id`, `career_id` (FK), `task_description`, `order` |
| `bookmarked_careers` | Student saved careers | `id`, `user_id` (FK), `career_id` (FK) [Unique Pair] |
| `roadmaps` | Learning tracks | `id`, `track`, `description`, `total_days` |
| `roadmap_steps` | Individual daily milestones | `id`, `roadmap_id` (FK), `day_number`, `title`, `description` |
| `user_progress` | Completed learning milestones | `id`, `user_id` (FK), `roadmap_track`, `step_index`, `completed` [Unique] |
| `quizzes` | Practice assessments | `id`, `track`, `title`, `description` |
| `questions` | Quiz questions | `id`, `quiz_id` (FK), `question_text`, `options_json`, `correct_answer_index`, `explanation` |
| `quiz_attempts` | Student assessment records | `id`, `user_id` (FK), `quiz_id` (FK), `score`, `total_questions`, `percentage` |
| `quiz_answers` | Submitted answers per attempt | `id`, `attempt_id` (FK), `question_id` (FK), `selected_option`, `is_correct` |
| `skill_ratings` | Self-ratings for reality check | `id`, `user_id` (FK), `role_name`, `skill_name`, `rating_value` (0-5) |
| `projects` | Portfolio projects | `id`, `user_id` (FK), `title`, `description`, `link`, `technologies` |
| `certifications` | Student certifications | `id`, `user_id` (FK), `title`, `issuer`, `link`, `issue_date` |
| `resumes` | Stored resume information | `id`, `user_id` (FK), `r_name`, `r_email`, `r_education`, `r_skills`, `r_projects`, etc. |
| `user_activity` | Activity records for streak logic | `id`, `user_id` (FK), `activity_type`, `activity_date` |
| `notifications` | In-app notification alerts | `id`, `user_id` (FK), `title`, `message`, `type`, `is_read` |

---

## 5. Prerequisites

- **Python:** Version 3.10, 3.11, 3.12, 3.13, or 3.14.
- **Git:** Version 2.20+
- **Browser:** Any modern browser (Chrome, Firefox, Safari, Edge).

---

## 6. Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/amreensayyed1305-maker/SkillPath_AI.git
cd SkillPath_AI
```

### Step 2: Set up a Python Virtual Environment
**On Windows:**
```powershell
cd Backend
python -m venv venv
venv\Scripts\activate
```

**On macOS / Linux:**
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

---

## 7. Database Initialization & Seeding

The database initializes and seeds automatically on first run! You can also run the seed script directly:
```bash
python seed.py
```
This populates:
- 9 Engineering Career Roles (Frontend, Backend, Data Analyst, AI/ML, Python, Java, Software Engineer, Full Stack, Data Engineer).
- 7 Learning Tracks (70 daily structured milestones).
- 35 Assessment Questions with answer keys and conceptual explanations.
- A pre-configured demo student account:
  - **Email:** `student@growvia.ai`
  - **Password:** `Student@123`

---

## 8. Running the Application

### Option A: Run Backend Server (Recommended)
From the `Backend/` directory:
```bash
python app.py
```
The server will start at:
- **Application URL:** [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **API Health Check:** [http://127.0.0.1:5000/api/health](http://127.0.0.1:5000/api/health)

The Flask app automatically serves the frontend at the root URL `http://127.0.0.1:5000`.

### Option B: Run Frontend Separately (e.g. Live Server or VS Code)
If you prefer opening `Frontend/index.html` via VS Code Live Server (port 5500) or double-clicking `index.html`:
- The frontend dynamically detects cross-origin mode and connects seamlessly to `http://127.0.0.1:5000/api` with full CORS support!

---

## 9. Running Automated Tests

Run the comprehensive unit test suite:
```bash
cd Backend
python -m unittest discover tests
```
**Test Results:**
- 16 automated tests covering authentication, token verification, route protection, career searches, bookmarks, roadmap progress toggling, server-side scoring secrecy, project ownership validation, and PDF generation.
- **Status:** `Ran 16 tests — OK (100% Pass Rate)`

---

## 10. Complete REST API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new student account | No |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT | No |
| `POST` | `/api/auth/logout` | Discard student session | No |
| `GET` | `/api/auth/me` | Fetch authenticated student data | Yes (Bearer) |

### Careers & Bookmarks
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/careers` | List careers with `?q=` search & `?category=` filter | Optional |
| `GET` | `/api/careers/<id>` | Retrieve single career details | Optional |
| `GET` | `/api/careers/<id>/skills` | List required skills for career | No |
| `POST` | `/api/careers/<id>/bookmark` | Toggle career bookmark | Yes (Bearer) |
| `GET` | `/api/careers/bookmarks` | List all saved careers | Yes (Bearer) |

### Skill Roadmaps & Progress
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/roadmaps` | List all available learning tracks | No |
| `GET` | `/api/roadmaps/<track>` | Get 10-day milestones & user status | Optional |
| `GET` | `/api/progress` | Get all completed milestones for user | Yes (Bearer) |
| `POST` | `/api/progress` | Toggle milestone complete/incomplete | Yes (Bearer) |
| `PATCH` | `/api/progress/<id>` | Update progress milestone status | Yes (Bearer) |

### Assessments & Quizzes
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/quizzes` | List available quiz tracks | No |
| `GET` | `/api/quizzes/<track>` | Get questions (**answers stripped for secrecy**) | No |
| `POST` | `/api/quizzes/<track>/submit` | Submit answers for server-side evaluation | Optional |
| `GET` | `/api/assessments/history` | Get student assessment history | Yes (Bearer) |
| `GET` | `/api/quizzes/revision-notes` | Retrieve quick revision cards | No |

### Skill Gap Analysis & AI Assistant
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/skill-gaps?role=<role>` | Get role competencies & student gap analysis | Optional |
| `POST` | `/api/skill-gaps` | Submit self-ratings and record gaps | Yes (Bearer) |
| `GET` | `/api/recommendations` | Get personalized career action recommendations | Optional |
| `POST` | `/api/assistant/chat` | AI Career Assistant guidance query | Optional |

### Student Portfolio
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/profile` | Get current student profile | Yes (Bearer) |
| `PUT` | `/api/profile` | Update student profile information | Yes (Bearer) |
| `GET` | `/api/projects` | List student's projects | Yes (Bearer) |
| `POST` | `/api/projects` | Create a new project | Yes (Bearer) |
| `PUT` | `/api/projects/<id>` | Update owned project (Ownership enforced) | Yes (Bearer) |
| `DELETE` | `/api/projects/<id>` | Remove owned project (Ownership enforced) | Yes (Bearer) |
| `GET` | `/api/certifications` | List student certifications | Yes (Bearer) |
| `POST` | `/api/certifications` | Create a new certification | Yes (Bearer) |
| `PUT` | `/api/certifications/<id>` | Update owned certification | Yes (Bearer) |
| `DELETE` | `/api/certifications/<id>` | Remove owned certification | Yes (Bearer) |

### Resume Builder & PDF Generation
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/resume` | Retrieve saved resume data | Yes (Bearer) |
| `PUT` | `/api/resume` | Save or update resume details | Yes (Bearer) |
| `GET` | `/api/resume/pdf` | Download official server-generated PDF | Yes (Bearer) |
| `POST` | `/api/resume/photo` | Upload profile photo (JPG, PNG, WebP) | Yes (Bearer) |

### Dashboard & Analytics
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard` | Aggregated metrics (Streak, topics, average) | Optional |
| `GET` | `/api/notifications` | List student in-app notifications | Yes (Bearer) |
| `PATCH` | `/api/notifications/<id>/read`| Mark notification as read | Yes (Bearer) |

---

## 11. Security Implementation

1. **Password Hashing:** Passwords are never stored in plain text. Hashed using Werkzeug `generate_password_hash` with secure salting.
2. **JWT Authentication:** Tokens expire after 72 hours (configurable). Requests validate token signature and user existence.
3. **Data Isolation & Ownership:** Students can only access and modify their own projects, certifications, progress, and resume records. Attempts to modify other users' records return `403 Forbidden`.
4. **Assessment Secrecy:** Quiz questions returned prior to submission never expose `correct_answer_index` or `explanation`. Scoring is executed strictly on the server.
5. **Input Validation & Sanitization:** Server validates URLs, email formats, password lengths, and numeric ranges. SQL injection is prevented via SQLAlchemy parameterized queries.
6. **Safe File Uploads:** Uploaded resume photos are validated for extension (`png`, `jpg`, `jpeg`, `webp`), capped at 5MB, and assigned randomized secure UUID filenames.
7. **CORS:** Configurable CORS origins allow safe communication across development and production domains.

---

## 12. Production Deployment Readiness

### Recommended Platforms
- **PaaS:** Render, Railway, Fly.io, or Heroku.
- **IaaS / VPS:** AWS EC2, DigitalOcean Droplet, or Ubuntu Server with Nginx + Gunicorn.

### Production WSGI Command
Run with Gunicorn (included in `requirements.txt`):
```bash
gunicorn --bind 0.0.0.0:$PORT "app:create_app('production')"
```

### PostgreSQL Migration
To use PostgreSQL in production, set the `DATABASE_URL` environment variable:
```bash
DATABASE_URL=postgresql://user:password@hostname:5432/growvia_production
```
SQLAlchemy handles table creation and schema operations identically across both SQLite and PostgreSQL.

### Persistent Storage for Uploads
For containerized deployments (such as Render or Docker), configure AWS S3, Cloudinary, or a persistent volume for the `uploads/` directory.

---

## 13. Team & Contribution

**Team Name:** Prompt Engineers  
**Project:** Growvia AI — AI-Powered Career Guidance & Placement Readiness  
*Developed with purpose. Preserving elegance, accuracy, and accessibility for college engineers everywhere.*
