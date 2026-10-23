import json
from extensions import db
from models import User, UserProfile, Career, CareerSkill, CareerTask, Roadmap, RoadmapStep, Quiz, Question

CAREERS_DATA = [
    {
        "title": "Frontend Developer",
        "category": "Development",
        "icon": "◈",
        "description": "Build responsive interfaces and interactive web experiences.",
        "roadmap": "Web Development",
        "skills": ["HTML", "CSS", "JavaScript", "Git"],
        "tasks": ["Create responsive pages", "Build accessible components", "Consume REST APIs", "Deploy a portfolio"]
    },
    {
        "title": "Backend Developer",
        "category": "Development",
        "icon": "⌘",
        "description": "Build APIs, server-side logic and database-driven applications.",
        "roadmap": "Python",
        "skills": ["Python", "SQL", "APIs", "Git"],
        "tasks": ["Learn a backend framework", "Design REST APIs", "Work with databases", "Build an authenticated application"]
    },
    {
        "title": "Data Analyst",
        "category": "Data",
        "icon": "▥",
        "description": "Turn raw data into insights that support business decisions.",
        "roadmap": "SQL",
        "skills": ["SQL", "Excel", "Python", "Visualization"],
        "tasks": ["Clean datasets", "Write analytical SQL queries", "Create dashboards", "Present findings"]
    },
    {
        "title": "AI / ML Engineer",
        "category": "AI / ML",
        "icon": "✧",
        "description": "Develop machine learning solutions and intelligent applications.",
        "roadmap": "AI / Machine Learning",
        "skills": ["Python", "Statistics", "ML", "Data"],
        "tasks": ["Prepare datasets", "Train baseline models", "Evaluate model quality", "Deploy a model demo"]
    },
    {
        "title": "Python Developer",
        "category": "Development",
        "icon": "🐍",
        "description": "Create scripts, automation tools and software using Python.",
        "roadmap": "Python",
        "skills": ["Python", "OOP", "APIs", "SQL"],
        "tasks": ["Master core Python", "Practise object-oriented programming", "Build an API", "Create a documented project"]
    },
    {
        "title": "Java Developer",
        "category": "Development",
        "icon": "☕",
        "description": "Develop Java applications and enterprise software.",
        "roadmap": "Java",
        "skills": ["Java", "OOP", "SQL", "DSA"],
        "tasks": ["Learn core Java", "Practise collections", "Build database integration", "Create a Java project"]
    },
    {
        "title": "Software Engineer",
        "category": "Core CS",
        "icon": "⚙",
        "description": "Design, build, test and maintain software systems.",
        "roadmap": "Data Structures & Algorithms",
        "skills": ["DSA", "Programming", "Git", "Testing"],
        "tasks": ["Practise algorithms", "Learn software design", "Use version control", "Build and test an application"]
    },
    {
        "title": "Full Stack Developer",
        "category": "Development",
        "icon": "▣",
        "description": "Work across frontend interfaces, backend services and databases.",
        "roadmap": "Web Development",
        "skills": ["HTML", "JavaScript", "APIs", "SQL"],
        "tasks": ["Build a responsive frontend", "Create an API", "Connect a database", "Deploy a full-stack project"]
    },
    {
        "title": "Data Engineer",
        "category": "Data",
        "icon": "⇄",
        "description": "Build pipelines that collect, transform and deliver data.",
        "roadmap": "SQL",
        "skills": ["SQL", "Python", "ETL", "Databases"],
        "tasks": ["Write advanced SQL", "Clean and transform data", "Build a simple ETL pipeline", "Document data quality"]
    }
]

ROADMAPS_DATA = {
    "Python": [
        ("Python setup and syntax", "Install Python, use VS Code, variables and print statements."),
        ("Variables and data types", "Numbers, strings, booleans, type conversion."),
        ("Operators and conditions", "Arithmetic, comparison, if, elif and else."),
        ("Loops", "For loops, while loops, break and continue."),
        ("Strings and collections", "Lists, tuples, sets, dictionaries and string methods."),
        ("Functions", "Parameters, return values, scope and reusable code."),
        ("File handling and exceptions", "Read files, write files and handle errors."),
        ("Object-oriented programming", "Classes, objects, inheritance and encapsulation."),
        ("Modules and libraries", "Imports, packages, pip and virtual environments."),
        ("Mini project", "Build a task manager, expense tracker or quiz application.")
    ],
    "SQL": [
        ("Database fundamentals", "Tables, rows, columns, schemas and relational databases."),
        ("SELECT and WHERE", "Retrieve records, filter results and use logical operators."),
        ("Sorting and limiting", "ORDER BY, DISTINCT and limiting result sets."),
        ("Aggregate functions", "COUNT, SUM, AVG, MIN and MAX."),
        ("GROUP BY and HAVING", "Summarize data and filter aggregated results."),
        ("Joins", "INNER JOIN, LEFT JOIN, RIGHT JOIN and relationships."),
        ("Subqueries", "Nested queries, IN, EXISTS and correlated queries."),
        ("Keys and constraints", "Primary keys, foreign keys, UNIQUE and NOT NULL."),
        ("Advanced SQL", "CTEs, window functions and CASE expressions."),
        ("SQL project", "Build a sales report and analyze business performance.")
    ],
    "Java": [
        ("Java setup and syntax", "JDK, JVM, compilation and your first program."),
        ("Variables and data types", "Primitive types, casting and operators."),
        ("Control flow", "Conditions, loops, switch and nested logic."),
        ("Arrays and strings", "Array operations, String methods and StringBuilder."),
        ("Methods", "Parameters, return values, overloading and recursion."),
        ("Object-oriented programming", "Classes, objects, constructors and encapsulation."),
        ("Inheritance and polymorphism", "Interfaces, abstract classes and overriding."),
        ("Collections framework", "List, Set, Map and common implementations."),
        ("Exceptions and file handling", "Try/catch, custom exceptions and file operations."),
        ("Java project", "Build a student management or library management system.")
    ],
    "JavaScript": [
        ("JavaScript fundamentals", "Variables, let, const, types and operators."),
        ("Conditions and loops", "Branching, iteration and common patterns."),
        ("Functions and scope", "Arrow functions, callbacks and closures."),
        ("Arrays and objects", "Methods, destructuring, spread and object manipulation."),
        ("DOM manipulation", "Select elements and update page content."),
        ("Events and forms", "Handle clicks, keyboard input and form submissions."),
        ("Modern JavaScript", "Modules, template strings and optional chaining."),
        ("Asynchronous JavaScript", "Promises, async/await and fetch."),
        ("Browser storage", "localStorage, sessionStorage and JSON."),
        ("JavaScript project", "Build an interactive task manager or quiz application.")
    ],
    "Data Structures & Algorithms": [
        ("Complexity analysis", "Big O notation, time and space complexity."),
        ("Arrays and strings", "Traversal, searching and common array problems."),
        ("Hashing", "Hash maps, sets, frequencies and lookup optimization."),
        ("Searching and sorting", "Binary search, merge sort and quicksort concepts."),
        ("Linked lists", "Insertion, deletion, traversal and reversal."),
        ("Stacks and queues", "LIFO, FIFO and practical applications."),
        ("Recursion and backtracking", "Recursive patterns, subsets and permutations."),
        ("Trees and binary search trees", "Traversals, search and tree properties."),
        ("Graphs", "BFS, DFS and graph representations."),
        ("Problem-solving project", "Solve timed problems and document solutions.")
    ],
    "AI / Machine Learning": [
        ("Python for data", "NumPy, pandas and notebook workflows."),
        ("Math foundations", "Vectors, matrices, probability and statistics."),
        ("Data cleaning", "Missing values, duplicates, types and outliers."),
        ("Exploratory data analysis", "Statistics, visualization and patterns."),
        ("Machine learning foundations", "Features, labels, training and testing."),
        ("Regression", "Linear regression and error metrics."),
        ("Classification", "Logistic regression, decision trees and evaluation."),
        ("Model evaluation", "Cross-validation, precision, recall and F1-score."),
        ("Model improvement", "Feature engineering and overfitting prevention."),
        ("ML project", "Build and evaluate a prediction or classification model.")
    ],
    "Web Development": [
        ("HTML foundations", "Semantic elements, headings, links and forms."),
        ("CSS foundations", "Selectors, colors, spacing and the box model."),
        ("Responsive design", "Flexbox, Grid, breakpoints and mobile layouts."),
        ("JavaScript basics", "Variables, functions, conditions and loops."),
        ("DOM and events", "Build interactive components and validate forms."),
        ("Git and GitHub", "Version control, commits, branches and repositories."),
        ("APIs and JSON", "HTTP basics, fetch and API responses."),
        ("Browser storage", "Save user preferences and application state."),
        ("Deployment", "Publish projects with GitHub Pages or another host."),
        ("Portfolio project", "Build and publish a responsive portfolio website.")
    ]
}

QUIZZES_DATA = {
    "Python": [
        {"q": "Which keyword defines a function in Python?", "options": ["function", "def", "func", "define"], "answer": 1, "explanation": "Python uses the def keyword to define a function."},
        {"q": "What is the result of len([10, 20, 30])?", "options": ["2", "3", "4", "30"], "answer": 1, "explanation": "The list contains three elements."},
        {"q": "Which data structure stores unique values?", "options": ["List", "Tuple", "Set", "String"], "answer": 2, "explanation": "A set stores unique elements and removes duplicates."},
        {"q": "Which keyword is used to handle an exception?", "options": ["catch", "error", "except", "handle"], "answer": 2, "explanation": "Python uses try and except blocks to handle exceptions."},
        {"q": "What does range(3) generate?", "options": ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3 only"], "answer": 1, "explanation": "range(3) generates 0, 1 and 2."}
    ],
    "SQL": [
        {"q": "Which SQL command retrieves records?", "options": ["GET", "SELECT", "FETCH ALL", "OPEN"], "answer": 1, "explanation": "SELECT retrieves data from one or more tables."},
        {"q": "Which clause filters grouped results?", "options": ["WHERE", "ORDER BY", "HAVING", "DISTINCT"], "answer": 2, "explanation": "HAVING filters groups after aggregation."},
        {"q": "What does an INNER JOIN return?", "options": ["All rows from left table", "Matching rows from both tables", "All rows from both tables", "Only duplicate columns"], "answer": 1, "explanation": "INNER JOIN returns rows satisfying the join condition."},
        {"q": "Which constraint uniquely identifies each row?", "options": ["DEFAULT", "CHECK", "PRIMARY KEY", "INDEX only"], "answer": 2, "explanation": "A primary key uniquely identifies each row and cannot be NULL."},
        {"q": "Which function counts rows?", "options": ["SUM()", "COUNT()", "TOTAL()", "NUMBER()"], "answer": 1, "explanation": "COUNT(*) counts rows in a result set."}
    ],
    "Java": [
        {"q": "Which keyword creates a class in Java?", "options": ["struct", "class", "define", "object"], "answer": 1, "explanation": "The class keyword declares a class in Java."},
        {"q": "Which method is the usual Java application entry point?", "options": ["start()", "run()", "main()", "init()"], "answer": 2, "explanation": "Execution commonly starts at public static void main(String[] args)."},
        {"q": "Which type stores true or false?", "options": ["int", "char", "boolean", "String"], "answer": 2, "explanation": "The primitive boolean type represents true or false."},
        {"q": "Which keyword supports inheritance between classes?", "options": ["extends", "inherits", "implements", "superclass"], "answer": 0, "explanation": "A Java class extends another class using extends."},
        {"q": "Which collection typically stores key-value pairs?", "options": ["ArrayList", "HashMap", "HashSet", "Queue"], "answer": 1, "explanation": "HashMap stores mappings from keys to values."}
    ],
    "JavaScript": [
        {"q": "Which keyword declares a block-scoped variable that can be reassigned?", "options": ["const", "let", "fixed", "static"], "answer": 1, "explanation": "let declares a block-scoped variable that can be reassigned."},
        {"q": "Which method selects an element by CSS selector?", "options": ["getCSS()", "querySelector()", "selectElement()", "findCSS()"], "answer": 1, "explanation": "document.querySelector() returns the first matching element."},
        {"q": "Which method adds an element to the end of an array?", "options": ["push()", "pop()", "shift()", "slice()"], "answer": 0, "explanation": "push() adds one or more elements to the end of an array."},
        {"q": "What does JSON.parse() do?", "options": ["Creates HTML", "Converts JSON text into a value", "Sends an API request", "Deletes an object"], "answer": 1, "explanation": "JSON.parse() parses JSON-formatted text into a JavaScript value."},
        {"q": "Which keyword waits for a promise inside an async function?", "options": ["defer", "wait", "await", "pause"], "answer": 2, "explanation": "await pauses the async function until the promise settles."}
    ],
    "Data Structures & Algorithms": [
        {"q": "What is the average lookup complexity of a hash table?", "options": ["O(n²)", "O(log n)", "O(1)", "O(n log n)"], "answer": 2, "explanation": "Hash-table lookups are typically O(1) on average, though worst cases can be slower."},
        {"q": "Which data structure follows LIFO?", "options": ["Queue", "Stack", "Graph", "Heap only"], "answer": 1, "explanation": "A stack follows last-in, first-out order."},
        {"q": "What condition does binary search require?", "options": ["A sorted search space", "A linked list only", "Unique values only", "No comparisons"], "answer": 0, "explanation": "Standard binary search requires a sorted collection or another suitable monotonic search space."},
        {"q": "Which traversal explores a graph level by level?", "options": ["DFS", "BFS", "Inorder", "Postorder"], "answer": 1, "explanation": "Breadth-first search explores nodes by distance from the starting node."},
        {"q": "What is the time complexity of linear search in the worst case?", "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "answer": 2, "explanation": "Linear search may inspect every element, so its worst-case time is O(n)."}
    ],
    "AI / Machine Learning": [
        {"q": "Which Python library is widely used for tabular data?", "options": ["pandas", "Turtle", "Pygame", "Tkinter"], "answer": 0, "explanation": "pandas provides DataFrame and Series structures for data analysis."},
        {"q": "Why do we use a test dataset?", "options": ["To train twice", "To estimate performance on unseen data", "To remove all features", "To increase row count"], "answer": 1, "explanation": "A separate test set helps evaluate generalization to unseen examples."},
        {"q": "What is overfitting?", "options": ["A model memorizes training patterns too closely", "A dataset has no rows", "A model has no parameters", "All predictions are identical"], "answer": 0, "explanation": "Overfitting occurs when a model fits training data too closely and generalizes poorly."},
        {"q": "Which task is supervised learning?", "options": ["Clustering without labels", "Learning from labeled examples", "Randomly sorting data", "Deleting missing values"], "answer": 1, "explanation": "Supervised learning uses examples with known target labels or values."},
        {"q": "What does classification predict?", "options": ["Always a continuous value", "A category or class", "A database key", "A file format"], "answer": 1, "explanation": "Classification predicts discrete labels such as spam or not spam."}
    ],
    "Web Development": [
        {"q": "What is the main purpose of HTML?", "options": ["Structure web content", "Store server passwords", "Style every element", "Run database queries"], "answer": 0, "explanation": "HTML defines the structure and meaning of web content."},
        {"q": "Which CSS layout system is useful for two-dimensional grids?", "options": ["Grid", "Float only", "Inline", "Outline"], "answer": 0, "explanation": "CSS Grid supports rows and columns for two-dimensional layouts."},
        {"q": "What does responsive design aim to achieve?", "options": ["Only desktop layouts", "Layouts adapting to different screens", "Disable CSS", "Increase image size only"], "answer": 1, "explanation": "Responsive design adapts layouts to screen size and device conditions."},
        {"q": "What is Git used for?", "options": ["Version control", "Image editing", "Database hosting only", "CSS compilation only"], "answer": 0, "explanation": "Git tracks changes to files and supports collaborative development."},
        {"q": "What does an HTTP GET request usually do?", "options": ["Retrieve a resource", "Delete a repository", "Compile Java", "Style a button"], "answer": 0, "explanation": "GET requests are intended to retrieve a resource."}
    ]
}

def seed_database():
    """Seed initial careers, roadmaps, and quizzes if they do not exist."""
    print("Seeding database...")

    # 1. Careers
    for c_data in CAREERS_DATA:
        existing = Career.query.filter_by(title=c_data["title"]).first()
        if not existing:
            career = Career(
                title=c_data["title"],
                category=c_data["category"],
                icon=c_data["icon"],
                description=c_data["description"],
                roadmap_track=c_data["roadmap"]
            )
            db.session.add(career)
            db.session.flush()

            for s in c_data["skills"]:
                db.session.add(CareerSkill(career_id=career.id, skill_name=s))

            for idx, t in enumerate(c_data["tasks"]):
                db.session.add(CareerTask(career_id=career.id, task_description=t, order=idx))

    # 2. Roadmaps
    for track_name, steps in ROADMAPS_DATA.items():
        existing_rm = Roadmap.query.filter_by(track=track_name).first()
        if not existing_rm:
            rm = Roadmap(track=track_name, description=f"Structured {track_name} roadmap for students", total_days=len(steps))
            db.session.add(rm)
            db.session.flush()

            for day_idx, (title, desc) in enumerate(steps, start=1):
                step = RoadmapStep(
                    roadmap_id=rm.id,
                    day_number=day_idx,
                    title=title,
                    description=desc,
                    study_time_min=35
                )
                db.session.add(step)

    # 3. Quizzes
    for track_name, questions in QUIZZES_DATA.items():
        existing_quiz = Quiz.query.filter_by(track=track_name).first()
        if not existing_quiz:
            quiz = Quiz(track=track_name, title=f"{track_name} Assessment", description=f"Test your core {track_name} knowledge.")
            db.session.add(quiz)
            db.session.flush()

            for q_data in questions:
                q = Question(
                    quiz_id=quiz.id,
                    question_text=q_data["q"],
                    options_json=json.dumps(q_data["options"]),
                    correct_answer_index=q_data["answer"],
                    explanation=q_data["explanation"],
                    topic=f"{track_name} Fundamentals"
                )
                db.session.add(q)

    # 4. Create default demo user if none exists
    demo_user = User.query.filter_by(email="student@growvia.ai").first()
    if not demo_user:
        demo_user = User(email="student@growvia.ai", role="student")
        demo_user.set_password("Student@123")
        db.session.add(demo_user)
        db.session.flush()

        profile = UserProfile(
            user_id=demo_user.id,
            name="Alex Morgan",
            degree="B.Tech Computer Science",
            year="3rd Year",
            email="student@growvia.ai",
            location="San Francisco, CA",
            bio="Aspiring full-stack and AI software engineer excited about building resilient applications.",
            github="https://github.com",
            linkedin="https://linkedin.com",
            skills_json=json.dumps(["Python", "SQL", "JavaScript", "HTML & CSS", "Git"]),
            career_goals="Backend / AI Developer"
        )
        db.session.add(profile)

    db.session.commit()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        db.create_all()
        seed_database()
