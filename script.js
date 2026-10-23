
"use strict";

/* =========================================================
   SKILLPATH AI — FRONTEND APPLICATION
   HTML + CSS + JavaScript | Browser localStorage
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "skillpath_ai_v1";

const defaultState = {
  profile: {
    name: "", degree: "B.Tech CSE (AI)", year: "3rd Year",
    email: "", location: "", bio: "", github: "", linkedin: "",
    skills: ["Python", "SQL", "HTML", "CSS", "JavaScript"]
  },
  completed: {},
  quizHistory: [],
  projects: [],
  certifications: [],
  reality: {},
  lastActiveDate: "",
  streak: 0
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaultState);

    return {
      ...structuredClone(defaultState),
      ...saved,
      profile: { ...defaultState.profile, ...(saved.profile || {}) },
      completed: saved.completed || {},
      quizHistory: saved.quizHistory || [],
      projects: saved.projects || [],
      certifications: saved.certifications || [],
      reality: saved.reality || {}
    };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast("Unable to save data. Browser storage may be full.", true);
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

let toastTimer;

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.toggle("error", error);
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 2800);
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

/* =========================================================
   LEARNING ROADMAPS
========================================================= */

const roadmaps = {
  "Python": [
    ["Python setup and syntax", "Install Python, use VS Code, variables and print statements."],
    ["Variables and data types", "Numbers, strings, booleans, type conversion."],
    ["Operators and conditions", "Arithmetic, comparison, if, elif and else."],
    ["Loops", "For loops, while loops, break and continue."],
    ["Strings and collections", "Lists, tuples, sets, dictionaries and string methods."],
    ["Functions", "Parameters, return values, scope and reusable code."],
    ["File handling and exceptions", "Read files, write files and handle errors."],
    ["Object-oriented programming", "Classes, objects, inheritance and encapsulation."],
    ["Modules and libraries", "Imports, packages, pip and virtual environments."],
    ["Mini project", "Build a task manager, expense tracker or quiz application."]
  ],

  "SQL": [
    ["Database fundamentals", "Tables, rows, columns, schemas and relational databases."],
    ["SELECT and WHERE", "Retrieve records, filter results and use logical operators."],
    ["Sorting and limiting", "ORDER BY, DISTINCT and limiting result sets."],
    ["Aggregate functions", "COUNT, SUM, AVG, MIN and MAX."],
    ["GROUP BY and HAVING", "Summarize data and filter aggregated results."],
    ["Joins", "INNER JOIN, LEFT JOIN, RIGHT JOIN and relationships."],
    ["Subqueries", "Nested queries, IN, EXISTS and correlated queries."],
    ["Keys and constraints", "Primary keys, foreign keys, UNIQUE and NOT NULL."],
    ["Advanced SQL", "CTEs, window functions and CASE expressions."],
    ["SQL project", "Build a sales report and analyze business performance."]
  ],

  "Java": [
    ["Java setup and syntax", "JDK, JVM, compilation and your first program."],
    ["Variables and data types", "Primitive types, casting and operators."],
    ["Control flow", "Conditions, loops, switch and nested logic."],
    ["Arrays and strings", "Array operations, String methods and StringBuilder."],
    ["Methods", "Parameters, return values, overloading and recursion."],
    ["Object-oriented programming", "Classes, objects, constructors and encapsulation."],
    ["Inheritance and polymorphism", "Interfaces, abstract classes and overriding."],
    ["Collections framework", "List, Set, Map and common implementations."],
    ["Exceptions and file handling", "Try/catch, custom exceptions and file operations."],
    ["Java project", "Build a student management or library management system."]
  ],

  "JavaScript": [
    ["JavaScript fundamentals", "Variables, let, const, types and operators."],
    ["Conditions and loops", "Branching, iteration and common patterns."],
    ["Functions and scope", "Arrow functions, callbacks and closures."],
    ["Arrays and objects", "Methods, destructuring, spread and object manipulation."],
    ["DOM manipulation", "Select elements and update page content."],
    ["Events and forms", "Handle clicks, keyboard input and form submissions."],
    ["Modern JavaScript", "Modules, template strings and optional chaining."],
    ["Asynchronous JavaScript", "Promises, async/await and fetch."],
    ["Browser storage", "localStorage, sessionStorage and JSON."],
    ["JavaScript project", "Build an interactive task manager or quiz application."]
  ],

  "Data Structures & Algorithms": [
    ["Complexity analysis", "Big O notation, time and space complexity."],
    ["Arrays and strings", "Traversal, searching and common array problems."],
    ["Hashing", "Hash maps, sets, frequencies and lookup optimization."],
    ["Searching and sorting", "Binary search, merge sort and quicksort concepts."],
    ["Linked lists", "Insertion, deletion, traversal and reversal."],
    ["Stacks and queues", "LIFO, FIFO and practical applications."],
    ["Recursion and backtracking", "Recursive patterns, subsets and permutations."],
    ["Trees and binary search trees", "Traversals, search and tree properties."],
    ["Graphs", "BFS, DFS and graph representations."],
    ["Problem-solving project", "Solve timed problems and document solutions."]
  ],

  "AI / Machine Learning": [
    ["Python for data", "NumPy, pandas and notebook workflows."],
    ["Math foundations", "Vectors, matrices, probability and statistics."],
    ["Data cleaning", "Missing values, duplicates, types and outliers."],
    ["Exploratory data analysis", "Statistics, visualization and patterns."],
    ["Machine learning foundations", "Features, labels, training and testing."],
    ["Regression", "Linear regression and error metrics."],
    ["Classification", "Logistic regression, decision trees and evaluation."],
    ["Model evaluation", "Cross-validation, precision, recall and F1-score."],
    ["Model improvement", "Feature engineering and overfitting prevention."],
    ["ML project", "Build and evaluate a prediction or classification model."]
  ],

  "Web Development": [
    ["HTML foundations", "Semantic elements, headings, links and forms."],
    ["CSS foundations", "Selectors, colors, spacing and the box model."],
    ["Responsive design", "Flexbox, Grid, breakpoints and mobile layouts."],
    ["JavaScript basics", "Variables, functions, conditions and loops."],
    ["DOM and events", "Build interactive components and validate forms."],
    ["Git and GitHub", "Version control, commits, branches and repositories."],
    ["APIs and JSON", "HTTP basics, fetch and API responses."],
    ["Browser storage", "Save user preferences and application state."],
    ["Deployment", "Publish projects with GitHub Pages or another host."],
    ["Portfolio project", "Build and publish a responsive portfolio website."]
  ]
};

/* =========================================================
   CAREER EXPLORER DATA
========================================================= */

const careers = [
  {
    title: "Frontend Developer", category: "Development",
    icon: "◈", description: "Build responsive interfaces and interactive web experiences.",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    roadmap: "Web Development",
    tasks: ["Create responsive pages", "Build accessible components", "Consume REST APIs", "Deploy a portfolio"]
  },
  {
    title: "Backend Developer", category: "Development",
    icon: "⌘", description: "Build APIs, server-side logic and database-driven applications.",
    skills: ["Python", "SQL", "APIs", "Git"],
    roadmap: "Python",
    tasks: ["Learn a backend framework", "Design REST APIs", "Work with databases", "Build an authenticated application"]
  },
  {
    title: "Data Analyst", category: "Data",
    icon: "▥", description: "Turn raw data into insights that support business decisions.",
    skills: ["SQL", "Excel", "Python", "Visualization"],
    roadmap: "SQL",
    tasks: ["Clean datasets", "Write analytical SQL queries", "Create dashboards", "Present findings"]
  },
  {
    title: "AI / ML Engineer", category: "AI / ML",
    icon: "✧", description: "Develop machine learning solutions and intelligent applications.",
    skills: ["Python", "Statistics", "ML", "Data"],
    roadmap: "AI / Machine Learning",
    tasks: ["Prepare datasets", "Train baseline models", "Evaluate model quality", "Deploy a model demo"]
  },
  {
    title: "Python Developer", category: "Development",
    icon: "🐍", description: "Create scripts, automation tools and software using Python.",
    skills: ["Python", "OOP", "APIs", "SQL"],
    roadmap: "Python",
    tasks: ["Master core Python", "Practise object-oriented programming", "Build an API", "Create a documented project"]
  },
  {
    title: "Java Developer", category: "Development",
    icon: "☕", description: "Develop Java applications and enterprise software.",
    skills: ["Java", "OOP", "SQL", "DSA"],
    roadmap: "Java",
    tasks: ["Learn core Java", "Practise collections", "Build database integration", "Create a Java project"]
  },
  {
    title: "Software Engineer", category: "Core CS",
    icon: "⚙", description: "Design, build, test and maintain software systems.",
    skills: ["DSA", "Programming", "Git", "Testing"],
    roadmap: "Data Structures & Algorithms",
    tasks: ["Practise algorithms", "Learn software design", "Use version control", "Build and test an application"]
  },
  {
    title: "Full Stack Developer", category: "Development",
    icon: "▣", description: "Work across frontend interfaces, backend services and databases.",
    skills: ["HTML", "JavaScript", "APIs", "SQL"],
    roadmap: "Web Development",
    tasks: ["Build a responsive frontend", "Create an API", "Connect a database", "Deploy a full-stack project"]
  },
  {
    title: "Data Engineer", category: "Data",
    icon: "⇄", description: "Build pipelines that collect, transform and deliver data.",
    skills: ["SQL", "Python", "ETL", "Databases"],
    roadmap: "SQL",
    tasks: ["Write advanced SQL", "Clean and transform data", "Build a simple ETL pipeline", "Document data quality"]
  }
];

/* =========================================================
   QUIZ QUESTIONS
========================================================= */

const quizzes = {
  "Python": [
    { q: "Which keyword defines a function in Python?", options: ["function", "def", "func", "define"], answer: 1, explanation: "Python uses the def keyword to define a function." },
    { q: "What is the result of len([10, 20, 30])?", options: ["2", "3", "4", "30"], answer: 1, explanation: "The list contains three elements." },
    { q: "Which data structure stores unique values?", options: ["List", "Tuple", "Set", "String"], answer: 2, explanation: "A set stores unique elements and removes duplicates." },
    { q: "Which keyword is used to handle an exception?", options: ["catch", "error", "except", "handle"], answer: 2, explanation: "Python uses try and except blocks to handle exceptions." },
    { q: "What does range(3) generate?", options: ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "3 only"], answer: 1, explanation: "range(3) generates 0, 1 and 2." }
  ],
  "SQL": [
    { q: "Which SQL command retrieves records?", options: ["GET", "SELECT", "FETCH ALL", "OPEN"], answer: 1, explanation: "SELECT retrieves data from one or more tables." },
    { q: "Which clause filters grouped results?", options: ["WHERE", "ORDER BY", "HAVING", "DISTINCT"], answer: 2, explanation: "HAVING filters groups after aggregation." },
    { q: "What does an INNER JOIN return?", options: ["All rows from left table", "Matching rows from both tables", "All rows from both tables", "Only duplicate columns"], answer: 1, explanation: "INNER JOIN returns rows satisfying the join condition." },
    { q: "Which constraint uniquely identifies each row?", options: ["DEFAULT", "CHECK", "PRIMARY KEY", "INDEX only"], answer: 2, explanation: "A primary key uniquely identifies each row and cannot be NULL." },
    { q: "Which function counts rows?", options: ["SUM()", "COUNT()", "TOTAL()", "NUMBER()"], answer: 1, explanation: "COUNT(*) counts rows in a result set." }
  ],
  "Java": [
    { q: "Which keyword creates a class in Java?", options: ["struct", "class", "define", "object"], answer: 1, explanation: "The class keyword declares a class in Java." },
    { q: "Which method is the usual Java application entry point?", options: ["start()", "run()", "main()", "init()"], answer: 2, explanation: "Execution commonly starts at public static void main(String[] args)." },
    { q: "Which type stores true or false?", options: ["int", "char", "boolean", "String"], answer: 2, explanation: "The primitive boolean type represents true or false." },
    { q: "Which keyword supports inheritance between classes?", options: ["extends", "inherits", "implements", "superclass"], answer: 0, explanation: "A Java class extends another class using extends." },
    { q: "Which collection typically stores key-value pairs?", options: ["ArrayList", "HashMap", "HashSet", "Queue"], answer: 1, explanation: "HashMap stores mappings from keys to values." }
  ],
  "JavaScript": [
    { q: "Which keyword declares a block-scoped variable that can be reassigned?", options: ["const", "let", "fixed", "static"], answer: 1, explanation: "let declares a block-scoped variable that can be reassigned." },
    { q: "Which method selects an element by CSS selector?", options: ["getCSS()", "querySelector()", "selectElement()", "findCSS()"], answer: 1, explanation: "document.querySelector() returns the first matching element." },
    { q: "Which method adds an element to the end of an array?", options: ["push()", "pop()", "shift()", "slice()"], answer: 0, explanation: "push() adds one or more elements to the end of an array." },
    { q: "What does JSON.parse() do?", options: ["Creates HTML", "Converts JSON text into a value", "Sends an API request", "Deletes an object"], answer: 1, explanation: "JSON.parse() parses JSON-formatted text into a JavaScript value." },
    { q: "Which keyword waits for a promise inside an async function?", options: ["defer", "wait", "await", "pause"], answer: 2, explanation: "await pauses the async function until the promise settles." }
  ],
  "Data Structures & Algorithms": [
    { q: "What is the average lookup complexity of a hash table?", options: ["O(n²)", "O(log n)", "O(1)", "O(n log n)"], answer: 2, explanation: "Hash-table lookups are typically O(1) on average, though worst cases can be slower." },
    { q: "Which data structure follows LIFO?", options: ["Queue", "Stack", "Graph", "Heap only"], answer: 1, explanation: "A stack follows last-in, first-out order." },
    { q: "What condition does binary search require?", options: ["A sorted search space", "A linked list only", "Unique values only", "No comparisons"], answer: 0, explanation: "Standard binary search requires a sorted collection or another suitable monotonic search space." },
    { q: "Which traversal explores a graph level by level?", options: ["DFS", "BFS", "Inorder", "Postorder"], answer: 1, explanation: "Breadth-first search explores nodes by distance from the starting node." },
    { q: "What is the time complexity of linear search in the worst case?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 2, explanation: "Linear search may inspect every element, so its worst-case time is O(n)." }
  ],
  "AI / Machine Learning": [
    { q: "Which Python library is widely used for tabular data?", options: ["pandas", "Turtle", "Pygame", "Tkinter"], answer: 0, explanation: "pandas provides DataFrame and Series structures for data analysis." },
    { q: "Why do we use a test dataset?", options: ["To train twice", "To estimate performance on unseen data", "To remove all features", "To increase row count"], answer: 1, explanation: "A separate test set helps evaluate generalization to unseen examples." },
    { q: "What is overfitting?", options: ["A model memorizes training patterns too closely", "A dataset has no rows", "A model has no parameters", "All predictions are identical"], answer: 0, explanation: "Overfitting occurs when a model fits training data too closely and generalizes poorly." },
    { q: "Which task is supervised learning?", options: ["Clustering without labels", "Learning from labeled examples", "Randomly sorting data", "Deleting missing values"], answer: 1, explanation: "Supervised learning uses examples with known target labels or values." },
    { q: "What does classification predict?", options: ["Always a continuous value", "A category or class", "A database key", "A file format"], answer: 1, explanation: "Classification predicts discrete labels such as spam or not spam." }
  ],
  "Web Development": [
    { q: "What is the main purpose of HTML?", options: ["Structure web content", "Store server passwords", "Style every element", "Run database queries"], answer: 0, explanation: "HTML defines the structure and meaning of web content." },
    { q: "Which CSS layout system is useful for two-dimensional grids?", options: ["Grid", "Float only", "Inline", "Outline"], answer: 0, explanation: "CSS Grid supports rows and columns for two-dimensional layouts." },
    { q: "What does responsive design aim to achieve?", options: ["Only desktop layouts", "Layouts adapting to different screens", "Disable CSS", "Increase image size only"], answer: 1, explanation: "Responsive design adapts layouts to screen size and device conditions." },
    { q: "What is Git used for?", options: ["Version control", "Image editing", "Database hosting only", "CSS compilation only"], answer: 0, explanation: "Git tracks changes to files and supports collaborative development." },
    { q: "What does an HTTP GET request usually do?", options: ["Retrieve a resource", "Delete a repository", "Compile Java", "Style a button"], answer: 0, explanation: "GET requests are intended to retrieve a resource." }
  ]
};

/* =========================================================
   REVISION NOTES
========================================================= */

const revisionNotes = [
  { track: "Python", title: "Lists vs tuples", note: "Lists are mutable; tuples are immutable. Both support indexing." },
  { track: "Python", title: "Dictionary lookup", note: "Dictionaries map keys to values. Use dict.get(key) when a missing key should return a default." },
  { track: "SQL", title: "WHERE vs HAVING", note: "WHERE filters individual rows before grouping; HAVING filters groups after aggregation." },
  { track: "SQL", title: "INNER vs LEFT JOIN", note: "INNER JOIN returns matching rows. LEFT JOIN preserves every left-table row, including unmatched rows." },
  { track: "Java", title: "Overloading vs overriding", note: "Overloading changes parameter lists. Overriding provides a subclass implementation of an inherited method." },
  { track: "JavaScript", title: "let vs const", note: "Both are block-scoped. let allows reassignment; const prevents rebinding the variable." },
  { track: "Data Structures & Algorithms", title: "Stack vs queue", note: "Stack: LIFO. Queue: FIFO. Choose the structure based on the required processing order." },
  { track: "AI / Machine Learning", title: "Training vs testing", note: "Train models on training data and reserve separate data to evaluate performance on unseen examples." },
  { track: "Web Development", title: "Flexbox vs Grid", note: "Flexbox is ideal for one-dimensional alignment; Grid is useful for two-dimensional row and column layouts." }
];

/* =========================================================
   NAVIGATION
========================================================= */

const pageTitles = {
  dashboard: "Dashboard",
  careers: "Career Explorer",
  roadmap: "Skill Roadmap",
  practice: "Practice Zone",
  reality: "Skill Reality Check",
  assistant: "AI Career Assistant",
  portfolio: "Skill Portfolio",
  resume: "Resume Builder",
  analytics: "Progress & Analytics"
};

function navigate(page) {
  if (!pageTitles[page]) return;

  $$(".page").forEach(element => {
    element.classList.toggle("active", element.id === page);
  });

  $$(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  $("#pageName").textContent = pageTitles[page];
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "dashboard") renderDashboard();
  if (page === "careers") renderCareers();
  if (page === "roadmap") renderRoadmap();
  if (page === "practice") renderPractice();
  if (page === "reality") renderRealityForm();
  if (page === "portfolio") renderPortfolio();
  if (page === "resume") renderResume();
  if (page === "analytics") renderAnalytics();
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-page]");
  if (target) {
    event.preventDefault();
    navigate(target.dataset.page);
  }
});

$("#menuToggle").addEventListener("click", () => {
  $("#sidebar").classList.toggle("open");
});

document.addEventListener("click", event => {
  if (
    window.innerWidth <= 850 &&
    $("#sidebar").classList.contains("open") &&
    !event.target.closest("#sidebar") &&
    !event.target.closest("#menuToggle")
  ) {
    $("#sidebar").classList.remove("open");
  }
});


const floatingAIButton = document.getElementById("floatingAIButton");

if (floatingAIButton) {
    floatingAIButton.addEventListener("click", function () {
        if (typeof navigate === "function") {
            navigate("assistant");
        }
    });
}


/* =========================================================
   PROGRESS HELPERS
========================================================= */

function trackKey(track) {
  return track;
}

function isCompleted(track, index) {
  return !!state.completed[trackKey(track)]?.includes(index);
}

function completedCount(track) {
  return (state.completed[trackKey(track)] || []).length;
}

function progressFor(track) {
  return Math.round(completedCount(track) / roadmaps[track].length * 100);
}

function totalCompleted() {
  return Object.values(state.completed)
    .reduce((total, items) => total + items.length, 0);
}

function averageScore() {
  if (!state.quizHistory.length) return null;
  return Math.round(
    state.quizHistory.reduce((sum, item) => sum + item.percent, 0) /
    state.quizHistory.length
  );
}

function updateStreak() {
  const today = new Date().toLocaleDateString("en-CA");

  if (state.lastActiveDate === today) return;

  if (state.lastActiveDate) {
    const previous = new Date(state.lastActiveDate + "T12:00:00");
    const current = new Date(today + "T12:00:00");
    const diff = Math.round((current - previous) / 86400000);

    state.streak = diff === 1 ? (state.streak || 0) + 1 : 1;
  } else {
    state.streak = 1;
  }

  state.lastActiveDate = today;
  saveState();
}

function renderStats() {
  const totalTopics = totalCompleted();
  const average = averageScore();
  const tracks = Object.keys(roadmaps);
  const total = tracks.reduce((sum, track) => sum + roadmaps[track].length, 0);
  const overall = Math.round(totalTopics / total * 100);

  $("#roadmapStat").textContent = overall + "%";
  $("#roadmapBar").style.width = overall + "%";
  $("#streakStat").textContent = state.streak || 0;
  $("#completedStat").textContent = totalTopics;
  $("#scoreStat").textContent = average === null ? "—" : average + "%";
}

function renderDashboard() {
  renderStats();

  const track = $("#dashboardLanguage").value;
  const topics = roadmaps[track];
  const nextIndex = topics.findIndex((_, index) => !isCompleted(track, index));

  $("#dashboardRoadmap").innerHTML = topics.slice(0, 4).map((topic, index) => `
    <div class="topic-row">
      <button class="topic-check ${isCompleted(track, index) ? "done" : ""}"
        data-toggle-topic="${index}" data-track="${escapeHTML(track)}"
        aria-label="Toggle ${escapeHTML(topic[0])}">
        ${isCompleted(track, index) ? "✓" : index + 1}
      </button>
      <div class="topic-meta">
        <strong>${escapeHTML(topic[0])}</strong>
        <small>${isCompleted(track, index) ? "Completed" : "Day " + (index + 1)}</small>
      </div>
      <button class="topic-action" data-open-topic="${index}" data-track="${escapeHTML(track)}">
        ${isCompleted(track, index) ? "Review" : "Open →"}
      </button>
    </div>
  `).join("");

  const focusIndex = nextIndex === -1 ? 0 : nextIndex;
  $("#focusTitle").textContent = nextIndex === -1
    ? "Choose your next learning track"
    : topics[focusIndex][0];

  $("#focusDescription").textContent = nextIndex === -1
    ? "You've completed this roadmap. Keep practising or start another track."
    : topics[focusIndex][1];

  $("#roadmapLanguage").value = track;
}

$("#dashboardLanguage").addEventListener("change", renderDashboard);

document.addEventListener("click", event => {
  const toggle = event.target.closest("[data-toggle-topic]");
  const open = event.target.closest("[data-open-topic]");

  if (toggle) {
    toggleTopic(toggle.dataset.track, Number(toggle.dataset.toggleTopic));
  }

  if (open) {
    $("#roadmapLanguage").value = open.dataset.track;
    navigate("roadmap");
    renderRoadmap();
    toast("Opened " + roadmaps[open.dataset.track][Number(open.dataset.openTopic)][0]);
  }
});

function toggleTopic(track, index) {
  if (!roadmaps[track] || !Number.isInteger(index)) return;

  if (!state.completed[track]) state.completed[track] = [];

  const list = state.completed[track];
  const position = list.indexOf(index);

  if (position >= 0) {
    list.splice(position, 1);
    toast("Topic marked incomplete.");
  } else {
    list.push(index);
    updateStreak();
    toast("Great work! Topic completed ✓");
  }

  saveState();
  renderDashboard();
  renderRoadmap();
  renderAnalytics();
}

/* =========================================================
   ROADMAP PAGE
========================================================= */

function renderRoadmap() {
  const track = $("#roadmapLanguage").value;
  const topics = roadmaps[track];
  const done = completedCount(track);
  const percent = progressFor(track);

  $("#roadmapProgressLabel").textContent = percent + "% COMPLETED";

  $("#roadmapSummary").innerHTML = `
    <div class="summary-chip"><strong>${topics.length}</strong><small>Learning milestones</small></div>
    <div class="summary-chip"><strong>${done}</strong><small>Milestones completed</small></div>
    <div class="summary-chip"><strong>${percent}%</strong><small>Track completion</small></div>
  `;

  $("#roadmapTimeline").innerHTML = topics.map((topic, index) => `
    <article class="roadmap-day">
      <div class="day-marker ${isCompleted(track, index) ? "done" : ""}">
        ${isCompleted(track, index) ? "✓" : String(index + 1).padStart(2, "0")}
      </div>
      <div class="day-content">
        <div class="eyebrow">DAY ${index + 1} · ${escapeHTML(track.toUpperCase())}</div>
        <h3>${escapeHTML(topic[0])}</h3>
        <p>${escapeHTML(topic[1])}</p>
        <div class="day-bottom">
          <small>${isCompleted(track, index) ? "✓ Completed" : "Suggested study time: 30–45 min"}</small>
          <button class="${isCompleted(track, index) ? "outline-btn" : "primary-btn"}"
            data-toggle-topic="${index}" data-track="${escapeHTML(track)}">
            ${isCompleted(track, index) ? "Mark incomplete" : "Mark complete ✓"}
          </button>
        </div>
      </div>
    </article>
  `).join("");

  renderStats();
}

$("#roadmapLanguage").addEventListener("change", renderRoadmap);

/* =========================================================
   CAREER EXPLORER
========================================================= */

function renderCareers() {
  const query = $("#careerSearch").value.trim().toLowerCase();
  const category = $("#careerFilter").value;

  const filtered = careers.filter(career => {
    const text = [
      career.title, career.description, ...career.skills
    ].join(" ").toLowerCase();

    return text.includes(query) &&
      (category === "All" || career.category === category);
  });

  $("#careerGrid").innerHTML = filtered.length
    ? filtered.map(career => `
      <button class="career-card" data-career="${escapeHTML(career.title)}">
        <span class="career-icon">${career.icon}</span>
        <h3>${escapeHTML(career.title)}</h3>
        <p>${escapeHTML(career.description)}</p>
        <div class="career-tags">
          ${career.skills.map(skill => `<span>${escapeHTML(skill)}</span>`).join("")}
        </div>
        <div style="margin-top:16px;color:#7048e8;font-size:11px;font-weight:700">
          Explore role →
        </div>
      </button>
    `).join("")
    : '<div class="panel empty-state">No matching careers. Try another search.</div>';
}

$("#careerSearch").addEventListener("input", renderCareers);
$("#careerFilter").addEventListener("change", renderCareers);

$("#careerGrid").addEventListener("click", event => {
  const card = event.target.closest("[data-career]");
  if (!card) return;

  const career = careers.find(item => item.title === card.dataset.career);
  if (!career) return;

  $$(".career-card").forEach(item => item.classList.toggle(
    "selected", item.dataset.career === career.title
  ));

  $("#careerDetail").innerHTML = `
    <div class="detail-top">
      <div>
        <div class="eyebrow">CAREER PROFILE</div>
        <h2>${escapeHTML(career.title)}</h2>
        <p class="muted">${escapeHTML(career.description)}</p>
      </div>
      <button class="primary-btn" id="startCareerRoadmap">Start this roadmap →</button>
    </div>
    <h3>Skills to develop</h3>
    <div class="skill-tags">${career.skills.map(skill =>
      `<span>${escapeHTML(skill)}</span>`).join("")}</div>
    <h3 style="margin-top:20px">Suggested preparation milestones</h3>
    <ul>${career.tasks.map(task => `<li>${escapeHTML(task)}</li>`).join("")}</ul>
    <p class="muted">These are general preparation suggestions, not a guarantee of employment. Review current job descriptions for your target market.</p>
  `;

  $("#startCareerRoadmap").addEventListener("click", () => {
    $("#roadmapLanguage").value = career.roadmap;
    navigate("roadmap");
    renderRoadmap();
  });
});

/* =========================================================
   QUIZZES
========================================================= */

let quizTrack = "Python";
let quizIndex = 0;
let quizAnswers = [];
let quizSubmitted = false;

function getQuizQuestions() {
  return quizzes[quizTrack] || quizzes.Python;
}

function renderPractice() {
  renderQuiz();
  renderRevision();
  renderHistory();
}

function renderQuiz() {
  const questions = getQuizQuestions();
  const question = questions[quizIndex];

  $("#quizCategory").textContent = quizTrack.toUpperCase() + " BASICS";
  $("#quizCount").textContent = `Question ${Math.min(quizIndex + 1, questions.length)} of ${questions.length}`;
  $("#quizBar").style.width = ((quizIndex + (quizSubmitted ? 1 : 0)) / questions.length * 100) + "%";

  if (quizSubmitted) {
    const correct = questions.reduce(
      (sum, item, index) => sum + (quizAnswers[index] === item.answer ? 1 : 0), 0
    );
    const percent = Math.round(correct / questions.length * 100);

    $("#quizContent").innerHTML = `
      <div class="result-box">
        <div class="eyebrow">ASSESSMENT COMPLETE</div>
        <div class="result-score">${percent}%</div>
        <h2>${percent >= 80 ? "Excellent work! 🎉" : percent >= 50 ? "Good effort! ✨" : "Keep practising! 💪"}</h2>
        <p>You answered ${correct} out of ${questions.length} questions correctly.</p>
        <button class="primary-btn" id="retryQuiz">Try again ↻</button>
        <button class="outline-btn" id="changeQuiz">Choose another topic</button>
      </div>
      <div class="quiz-review">
        ${questions.map((item, index) => `
          <div class="revision-card">
            <strong>${index + 1}. ${escapeHTML(item.q)}</strong>
            <p>Your answer: ${escapeHTML(item.options[quizAnswers[index]] ?? "Not answered")}</p>
            <p>Correct answer: ${escapeHTML(item.options[item.answer])}</p>
            <p>${escapeHTML(item.explanation)}</p>
          </div>
        `).join("")}
      </div>
    `;

    $("#retryQuiz").addEventListener("click", startQuiz);
    $("#changeQuiz").addEventListener("click", () => {
      const names = Object.keys(quizzes);
      const next = (names.indexOf(quizTrack) + 1) % names.length;
      startQuiz(names[next]);
    });
    return;
  }

  $("#quizContent").innerHTML = `
    <h2 class="quiz-question">${escapeHTML(question.q)}</h2>
    <div class="quiz-options">
      ${question.options.map((option, index) => `
        <button class="quiz-option ${quizAnswers[quizIndex] === index ? "correct" : ""}"
          data-answer="${index}">
          <span class="option-letter">${String.fromCharCode(65 + index)}</span>
          ${escapeHTML(option)}
        </button>
      `).join("")}
    </div>
    <div class="quiz-actions">
      <button class="outline-btn" id="previousQuestion" ${quizIndex === 0 ? "disabled" : ""}>← Previous</button>
      <button class="primary-btn" id="nextQuestion" ${quizAnswers[quizIndex] === undefined ? "disabled" : ""}>
        ${quizIndex === questions.length - 1 ? "Finish quiz ✓" : "Next question →"}
      </button>
    </div>
  `;

  $$(".quiz-option").forEach(button => {
    button.addEventListener("click", () => {
      quizAnswers[quizIndex] = Number(button.dataset.answer);
      renderQuiz();
    });
  });

  $("#previousQuestion").addEventListener("click", () => {
    if (quizIndex > 0) {
      quizIndex--;
      renderQuiz();
    }
  });

  $("#nextQuestion").addEventListener("click", () => {
    if (quizAnswers[quizIndex] === undefined) return;

    if (quizIndex < questions.length - 1) {
      quizIndex++;
      renderQuiz();
    } else {
      finishQuiz();
    }
  });
}

function startQuiz(track = quizTrack) {
  quizTrack = quizzes[track] ? track : "Python";
  quizIndex = 0;
  quizAnswers = [];
  quizSubmitted = false;
  renderQuiz();
}

function finishQuiz() {
  const questions = getQuizQuestions();
  const correct = questions.reduce(
    (sum, question, index) => sum + (quizAnswers[index] === question.answer ? 1 : 0), 0
  );
  const percent = Math.round(correct / questions.length * 100);

  state.quizHistory.unshift({
    track: quizTrack,
    date: new Date().toISOString(),
    correct,
    total: questions.length,
    percent
  });

  state.quizHistory = state.quizHistory.slice(0, 100);
  quizSubmitted = true;
  updateStreak();
  saveState();
  renderQuiz();
  renderStats();
  renderHistory();
  renderAnalytics();
}

function renderRevision() {
  $("#revisionList").innerHTML = revisionNotes.map(note => `
    <article class="revision-card">
      <span class="pill">${escapeHTML(note.track)}</span>
      <h3 style="margin-top:10px">${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.note)}</p>
      <button class="text-button" data-revise-track="${escapeHTML(note.track)}">Open learning track →</button>
    </article>
  `).join("");
}

$("#revisionList").addEventListener("click", event => {
  const button = event.target.closest("[data-revise-track]");
  if (!button) return;

  const track = button.dataset.reviseTrack;
  if (!roadmaps[track]) return;

  $("#roadmapLanguage").value = track;
  navigate("roadmap");
});

function renderHistory() {
  $("#quizHistory").innerHTML = state.quizHistory.length
    ? state.quizHistory.map(item => `
      <div class="history-row">
        <div><strong>${escapeHTML(item.track)}</strong><small>${formatDate(new Date(item.date))} · ${item.correct}/${item.total} correct</small></div>
        <span class="pill">${item.percent}%</span>
      </div>
    `).join("")
    : '<div class="empty-state">Your completed quizzes will appear here.</div>';
}

$$("[data-practice]").forEach(button => {
  button.addEventListener("click", () => {
    $$(".tab-btn").forEach(item => item.classList.toggle("active", item === button));
    $$(".practice-view").forEach(view => view.classList.remove("active"));
    $("#" + button.dataset.practice + "View").classList.add("active");
  });
});

/* =========================================================
   SKILL REALITY CHECK
========================================================= */

const roleSkills = {
  "Frontend Developer": ["HTML & CSS", "JavaScript", "Responsive design", "Git & GitHub", "Projects"],
  "Backend Developer": ["Programming fundamentals", "APIs", "SQL & databases", "Git & testing", "Projects"],
  "Data Analyst": ["SQL", "Spreadsheets", "Python & data cleaning", "Data visualization", "Projects"],
  "Python Developer": ["Python fundamentals", "Functions & OOP", "Data structures", "APIs & files", "Projects"],
  "Java Developer": ["Java fundamentals", "OOP", "Collections & DSA", "SQL", "Projects"],
  "AI / ML Engineer": ["Python", "Statistics", "Data preparation", "Machine learning", "Projects"]
};

function renderRealityForm() {
  const role = $("#targetRole").value;
  const skills = roleSkills[role];

  $("#realitySkills").innerHTML = skills.map((skill, index) => `
    <div class="rating-row">
      <div class="rating-head"><strong>${escapeHTML(skill)}</strong><span id="ratingValue${index}">0 / 5</span></div>
      <input type="range" min="0" max="5" value="${state.reality[role]?.[skill] ?? 0}"
        id="rating${index}" data-skill="${escapeHTML(skill)}" aria-label="${escapeHTML(skill)} rating">
      <div class="rating-labels"><span>New to this</span><span>Confident</span></div>
    </div>
  `).join("");

  skills.forEach((skill, index) => {
    const input = $("#rating" + index);
    const output = $("#ratingValue" + index);

    output.textContent = input.value + " / 5";
    input.addEventListener("input", () => {
      output.textContent = input.value + " / 5";
    });
  });

  renderRealityResult();
}

$("#targetRole").addEventListener("change", renderRealityForm);

$("#realityForm").addEventListener("submit", event => {
  event.preventDefault();

  const role = $("#targetRole").value;
  const skills = roleSkills[role];
  const ratings = {};

  skills.forEach((skill, index) => {
    ratings[skill] = Number($("#rating" + index).value);
  });

  state.reality[role] = ratings;
  updateStreak();
  saveState();
  renderRealityResult();
  toast("Your self-assessment has been saved.");
});

function renderRealityResult() {
  const role = $("#targetRole").value;
  const ratings = state.reality[role];

  if (!ratings) {
    $("#realityResult").innerHTML = `
      <div class="empty-illustration">◎</div>
      <h3>Your results will appear here</h3>
      <p class="muted">Rate your skills and run an assessment to see your self-reported readiness and recommended next steps.</p>
    `;
    return;
  }

  const skills = roleSkills[role];
  const score = Math.round(
    skills.reduce((sum, skill) => sum + (ratings[skill] || 0), 0) /
    (skills.length * 5) * 100
  );

  const gaps = skills.filter(skill => (ratings[skill] || 0) < 3);

  $("#realityResult").innerHTML = `
    <div class="eyebrow">YOUR SELF-ASSESSMENT</div>
    <div class="score-ring" style="--score:${score * 3.6}deg">
      <div><strong>${score}%</strong><small>Self-rating</small></div>
    </div>
    <h3>${escapeHTML(role)}</h3>
    <p class="muted">Based on the skill levels you reported.</p>
    <div class="result-note">
      <strong>Important:</strong> This is a self-reported learning indicator, not an objective job-readiness score. Validate your skills with projects, timed exercises, and role-specific interviews.
    </div>
    <h3 style="margin-top:20px;text-align:left">Recommended focus areas</h3>
    ${gaps.length ? gaps.map(skill => `
      <div class="gap-item"><strong>${escapeHTML(skill)}</strong>
      <small>Current rating: ${ratings[skill]}/5. Review the fundamentals and complete a practical exercise.</small></div>
    `).join("") : '<p class="muted">You rated all listed skills at 3 or higher. Test them with practical projects and timed assessments.</p>'}
    <button class="outline-btn full-btn" id="realityPractice">Practise in the quiz zone →</button>
  `;

  $("#realityPractice").addEventListener("click", () => navigate("practice"));
}

/* =========================================================
   CAREER ASSISTANT — RULE-BASED DEMO
========================================================= */

const assistantReplies = [
  {
    keys: ["frontend", "web developer", "website"],
    reply: "For frontend development, follow this sequence:\n\n1. Learn HTML semantics and forms.\n2. Practise CSS, Flexbox, Grid and responsive layouts.\n3. Learn JavaScript, DOM manipulation and events.\n4. Use Git and GitHub.\n5. Build three projects, then publish a portfolio.\n\nYour next step: complete a small responsive page and test it on mobile."
  },
  {
    keys: ["resume", "cv"],
    reply: "Make your resume evidence-focused:\n\n• Keep it concise and easy to scan.\n• List technical skills you can demonstrate.\n• Describe projects with the problem, technology and outcome.\n• Add GitHub repositories and live demos where possible.\n• Include relevant internships and certifications.\n• Tailor your skills and project descriptions to each role.\n\nYour next step: choose your target role and improve the most relevant project description."
  },
  {
    keys: ["placement", "interview", "job"],
    reply: "A practical placement preparation plan:\n\n1. Practise DSA regularly.\n2. Revise OOP, DBMS, OS and computer networks.\n3. Strengthen SQL and your primary programming language.\n4. Prepare two projects you can explain deeply.\n5. Practise aptitude and mock interviews.\n6. Review job descriptions before applying.\n\nYour next step: schedule one focused practice session today."
  },
  {
    keys: ["gap", "weak", "reality", "readiness"],
    reply: "Let's turn your skill gaps into an action plan:\n\n1. Select a target role in Career Explorer.\n2. Open Skill Reality Check and rate each skill honestly.\n3. Compare your skills with recent job descriptions.\n4. Build a project that tests your weakest area.\n5. Reassess using a quiz or practical challenge.\n\nRemember: self-ratings are a starting point. Projects and assessments provide stronger evidence."
  },
  {
    keys: ["python"],
    reply: "For Python, learn variables, conditions, loops, collections, functions, OOP, file handling and exceptions. Then practise problems and build a small project such as an expense tracker or automation script.\n\nOpen Skill Roadmap to follow the structured Python track."
  },
  {
    keys: ["sql", "database"],
    reply: "For SQL, start with SELECT, WHERE, sorting and aggregate functions. Next learn GROUP BY, HAVING, joins, subqueries, constraints and window functions.\n\nBuild a sales analysis project with realistic tables and document the insights you discover."
  },
  {
    keys: ["project", "portfolio", "github"],
    reply: "Choose projects that demonstrate skills required for your target role. Include a clear README, screenshots, setup instructions, meaningful commits and a working demo where practical.\n\nA smaller finished project with clear documentation is often more useful than many unfinished projects."
  },
  {
    keys: ["roadmap", "start", "beginner"],
    reply: "Start with one target role instead of learning everything at once.\n\n1. Review the required skills.\n2. Choose one primary learning track.\n3. Study a topic each day.\n4. Practise immediately after learning.\n5. Build projects to demonstrate what you know.\n\nOpen Career Explorer to select a role and Skill Roadmap to begin."
  }
];

function getAssistantReply(message) {
  const text = message.toLowerCase();
  const match = assistantReplies.find(item => item.keys.some(key => text.includes(key)));

  if (match) return match.reply;

  const completed = totalCompleted();
  const average = averageScore();

  return `Here's a practical way to approach your question:\n\n1. Define the career goal you want to reach.\n2. Identify the specific skill or concept you need.\n3. Learn the concept and practise it with an exercise.\n4. Save evidence of your work in your portfolio.\n5. Review your progress and decide on the next step.\n\nYour current SkillPath snapshot: ${completed} roadmap topics completed and ${average === null ? "no quiz scores recorded yet" : "a " + average + "% average quiz score"}.\n\nFor more relevant guidance, tell me your target role and the specific skill you're working on.`;
}

function addChatMessage(message, sender) {
  const element = document.createElement("div");
  element.className = "chat-bubble " + sender;
  element.textContent = message;
  $("#chatMessages").appendChild(element);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
}

function sendChat(message) {
  const clean = message.trim();
  if (!clean) return;

  addChatMessage(clean, "user");
  $("#chatInput").value = "";

  // Demo logic, not a call to an actual AI model.
  setTimeout(() => {
    addChatMessage(getAssistantReply(clean), "bot");
  }, 250);
}

$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();
  sendChat($("#chatInput").value);
});

$$("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => sendChat(button.dataset.prompt));
});

$("#clearChat").addEventListener("click", () => {
  $("#chatMessages").innerHTML = "";
  addChatMessage("Chat cleared. What career goal would you like help with today?", "bot");
});

/* =========================================================
   PORTFOLIO AND PROFILE
========================================================= */

function populateProfileForm() {
  const profile = state.profile;

  $("#studentName").value = profile.name || "";
  $("#studentDegree").value = profile.degree || "";
  $("#studentYear").value = profile.year || "3rd Year";
  $("#studentEmail").value = profile.email || "";
  $("#studentLocation").value = profile.location || "";
  $("#studentBio").value = profile.bio || "";
  $("#githubUrl").value = profile.github || "";
  $("#linkedinUrl").value = profile.linkedin || "";
  $("#skillsInput").value = (profile.skills || []).join(", ");
}

function renderProfilePreview() {
  const profile = state.profile;
  const name = profile.name || "Your Name";

  $("#welcomeName").textContent = profile.name.split(" ")[0] || "Student";
  $("#miniName").textContent = name;
  $("#topName").textContent = profile.name ? profile.name.split(" ")[0] : "Student";
  $("#miniAvatar").textContent = name.charAt(0).toUpperCase();
  $("#topAvatar").textContent = name.charAt(0).toUpperCase();
  $("#previewAvatar").textContent = name.charAt(0).toUpperCase();
  $("#previewName").textContent = name;
  $("#previewDegree").textContent = [profile.degree, profile.year].filter(Boolean).join(" · ") || "Engineering Student";
  $("#previewBio").textContent = profile.bio || "Your professional summary will appear here.";

  $("#previewSkills").innerHTML = (profile.skills || []).map(skill =>
    `<span>${escapeHTML(skill)}</span>`
  ).join("");

  const socialLinks = [];
  const github = safeURL(profile.github);
  const linkedin = safeURL(profile.linkedin);

  if (github) socialLinks.push(`<a href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`);
  if (linkedin) socialLinks.push(`<a href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`);

  $("#previewSocial").innerHTML = socialLinks.join("");
  $("#projectCount").textContent = state.projects.length;
  $("#certCount").textContent = state.certifications.length;
  $("#portfolioSkillCount").textContent = profile.skills.length;
}

function renderProjects() {
  $("#projectList").innerHTML = state.projects.length
    ? state.projects.map((project, index) => {
      const link = safeURL(project.link);
      return `
        <article class="portfolio-item">
          <strong>${escapeHTML(project.title)}</strong>
          <p>${escapeHTML(project.description)}</p>
          <div class="item-actions">
            ${link ? `<a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">View project ↗</a>` : "<span></span>"}
            <button class="delete-btn" data-delete-project="${index}">Remove</button>
          </div>
        </article>
      `;
    }).join("")
    : '<div class="empty-state">Your projects will appear here.</div>';
}

function renderCertifications() {
  $("#certList").innerHTML = state.certifications.length
    ? state.certifications.map((cert, index) => {
      const link = safeURL(cert.link);
      return `
        <article class="portfolio-item">
          <strong>${escapeHTML(cert.title)}</strong>
          <p>${escapeHTML(cert.issuer)}</p>
          <div class="item-actions">
            ${link ? `<a href="${escapeHTML(link)}" target="_blank" rel="noopener noreferrer">View certificate ↗</a>` : "<span></span>"}
            <button class="delete-btn" data-delete-cert="${index}">Remove</button>
          </div>
        </article>
      `;
    }).join("")
    : '<div class="empty-state">Your certifications will appear here.</div>';
}

function renderPortfolio() {
  renderProfilePreview();
  renderProjects();
  renderCertifications();
}

$("#profileForm").addEventListener("submit", event => {
  event.preventDefault();

  state.profile = {
    name: $("#studentName").value.trim(),
    degree: $("#studentDegree").value.trim(),
    year: $("#studentYear").value,
    email: $("#studentEmail").value.trim(),
    location: $("#studentLocation").value.trim(),
    bio: $("#studentBio").value.trim(),
    github: $("#githubUrl").value.trim(),
    linkedin: $("#linkedinUrl").value.trim(),
    skills: [...new Set($("#skillsInput").value.split(",").map(s => s.trim()).filter(Boolean))]
  };

  saveState();
  renderPortfolio();
  renderDashboard();
  toast("Your student profile has been saved ✓");
});

$("#projectForm").addEventListener("submit", event => {
  event.preventDefault();

  const link = $("#projectLink").value.trim();
  if (link && !safeURL(link)) {
    toast("Enter a valid HTTP or HTTPS project URL.", true);
    return;
  }

  state.projects.push({
    title: $("#projectTitle").value.trim(),
    description: $("#projectDescription").value.trim(),
    link
  });

  saveState();
  $("#projectForm").reset();
  renderPortfolio();
  renderAnalytics();
  toast("Project added to your portfolio.");
});

$("#certForm").addEventListener("submit", event => {
  event.preventDefault();

  const link = $("#certLink").value.trim();
  if (link && !safeURL(link)) {
    toast("Enter a valid HTTP or HTTPS certificate URL.", true);
    return;
  }

  state.certifications.push({
    title: $("#certTitle").value.trim(),
    issuer: $("#certIssuer").value.trim(),
    link
  });

  saveState();
  $("#certForm").reset();
  renderPortfolio();
  renderAnalytics();
  toast("Certification added to your portfolio.");
});

document.addEventListener("click", event => {
  const deleteProject = event.target.closest("[data-delete-project]");
  const deleteCert = event.target.closest("[data-delete-cert]");

  if (deleteProject) {
    state.projects.splice(Number(deleteProject.dataset.deleteProject), 1);
    saveState();
    renderPortfolio();
    renderAnalytics();
    toast("Project removed.");
  }

  if (deleteCert) {
    state.certifications.splice(Number(deleteCert.dataset.deleteCert), 1);
    saveState();
    renderPortfolio();
    renderAnalytics();
    toast("Certification removed.");
  }
});

function buildPortfolioHTML() {
  const p = state.profile;

  const projects = state.projects.map(item => {
    const link = safeURL(item.link);
    return `<article><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description)}</p>${link ? `<a href="${escapeHTML(link)}">View project</a>` : ""}</article>`;
  }).join("");

  const certs = state.certifications.map(item => {
    const link = safeURL(item.link);
    return `<article><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.issuer)}</p>${link ? `<a href="${escapeHTML(link)}">View certificate</a>` : ""}</article>`;
  }).join("");

  const links = [
    ["GitHub", p.github],
    ["LinkedIn", p.linkedin]
  ].filter(item => safeURL(item[1])).map(item =>
    `<a href="${escapeHTML(safeURL(item[1]))}">${escapeHTML(item[0])}</a>`
  ).join(" · ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(p.name || "Student")} | Portfolio</title>
<style>
body{font:16px Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#29233e;background:#faf8ff;line-height:1.7}
header,section{background:white;padding:24px;margin:18px 0;border-radius:16px;border:1px solid #eee7f8}
h1{color:#7048e8}h2{color:#7048e8}article{padding:12px 0;border-bottom:1px solid #eee7f8}
a{color:#7048e8}small{color:#777}
</style>
</head>
<body>
<header>
<h1>${escapeHTML(p.name || "Student")}</h1>
<p>${escapeHTML(p.degree)} · ${escapeHTML(p.year)}</p>
<p>${escapeHTML(p.location)}</p>
<p>${escapeHTML(p.email)}</p>
<p>${escapeHTML(p.bio)}</p>
<p>${links}</p>
</header>
<section><h2>Skills</h2><p>${(p.skills || []).map(escapeHTML).join(" · ")}</p></section>
<section><h2>Projects</h2>${projects || "<p>Projects coming soon.</p>"}</section>
<section><h2>Certifications</h2>${certs || "<p>Certifications coming soon.</p>"}</section>
<footer><small>Created with SkillPath AI.</small></footer>
</body></html>`;
}

$("#exportPortfolio").addEventListener("click", () => {
  downloadFile("skillpath-portfolio.html", buildPortfolioHTML(), "text/html;charset=utf-8");
  toast("Portfolio HTML exported.");
});


/* =========================================================
   RESUME BUILDER
========================================================= */

const RESUME_STORAGE_KEY = "skillpath_resume_v1";

const resumeFieldIds = [
  "rName", "rEmail", "rPhone", "rLocation",
  "rLinkedin", "rGithub", "rDegree", "rCollege",
  "rGraduation", "rCgpa", "rSummary", "rSkills",
  "rProjects", "rExperience", "rCertifications",
  "rAchievements"
];

// Collect all resume form values
function getResumeData() {
  return Object.fromEntries(
    resumeFieldIds.map(id => [
      id,
      document.getElementById(id)?.value || ""
    ])
  );
}

// Update the resume preview
function renderResume() {
  const data = getResumeData();

  const setText = (id, value, fallback = "") => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value.trim() || fallback;
    }
  };

  setText("pName", data.rName, "YOUR NAME");

  const contact = [
    data.rEmail,
    data.rPhone,
    data.rLocation
  ].filter(value => value.trim()).join(" · ");

  setText("pContact", contact, "Email · Phone · Location");

  const links = [
    data.rLinkedin,
    data.rGithub
  ].filter(value => value.trim()).join(" · ");

  setText("pLinks", links);

  setText(
    "pSummary",
    data.rSummary,
    "Your professional summary will appear here."
  );

  const education = [
    data.rDegree,
    data.rCollege,
    data.rGraduation
      ? "Graduation: " + data.rGraduation
      : "",
    data.rCgpa
  ].filter(value => value.trim()).join("\n");

  setText(
    "pEducation",
    education,
    "Your degree and college will appear here."
  );

  setText("pSkills", data.rSkills, "Your skills will appear here.");
  setText("pProjects", data.rProjects, "Your projects will appear here.");
  setText("pExperience", data.rExperience, "Your experience will appear here.");
  setText("pCertifications", data.rCertifications, "Your certifications will appear here.");
  setText("pAchievements", data.rAchievements, "Your achievements will appear here.");
}

// Load previously saved resume data
function loadResume() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(RESUME_STORAGE_KEY) || "null"
    );

    if (saved) {
      resumeFieldIds.forEach(id => {
        const field = document.getElementById(id);

        if (field) {
          field.value = saved[id] || "";
        }
      });
    }
  } catch (error) {
    console.error("Could not load resume:", error);
  }

  renderResume();
}

// Connect resume form events
const resumeForm = document.getElementById("resumeForm");

if (resumeForm) {
  // Update preview while typing
  resumeForm.addEventListener("input", renderResume);

  // Save resume details
  resumeForm.addEventListener("submit", event => {
    event.preventDefault();

    try {
      localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify(getResumeData())
      );

      renderResume();

      if (typeof toast === "function") {
        toast("Your resume has been saved!");
      } else {
        alert("Your resume has been saved!");
      }
    } catch (error) {
      alert("Unable to save your resume in this browser.");
    }
  });
}

// Clear resume form
const clearResumeButton = document.getElementById("clearResume");

if (clearResumeButton) {
  clearResumeButton.addEventListener("click", () => {
    if (!confirm("Clear all details from your resume?")) return;

    if (resumeForm) resumeForm.reset();

    localStorage.removeItem(RESUME_STORAGE_KEY);
    renderResume();
  });
}

// Print or save resume as PDF
const printResumeButton = document.getElementById("printResume");

if (printResumeButton) {
  printResumeButton.addEventListener("click", () => {
    renderResume();
    window.print();
  });
}


/* =========================================================
   ANALYTICS
========================================================= */

function renderAnalytics() {
  const tracks = Object.keys(roadmaps);
  const average = averageScore();

  $("#analyticsTopics").textContent = totalCompleted();
  $("#analyticsAttempts").textContent = state.quizHistory.length;
  $("#analyticsScore").textContent = average === null ? "—" : average + "%";
  $("#analyticsPortfolio").textContent = state.projects.length + state.certifications.length;

  $("#analyticsTracks").innerHTML = tracks.map(track => `
    <div class="track-row">
      <div class="track-row-top"><strong>${escapeHTML(track)}</strong><span>${progressFor(track)}%</span></div>
      <div class="mini-progress"><span style="width:${progressFor(track)}%"></span></div>
    </div>
  `).join("");

  $("#analyticsQuizzes").innerHTML = state.quizHistory.length
    ? state.quizHistory.slice(0, 7).map(item => `
      <div class="track-row">
        <div class="track-row-top">
          <strong>${escapeHTML(item.track)}</strong><span>${item.percent}%</span>
        </div>
        <div class="mini-progress"><span style="width:${item.percent}%"></span></div>
        <small style="color:#aaa5b8">${formatDate(new Date(item.date))}</small>
      </div>
    `).join("")
    : '<div class="empty-state">Complete a quiz to see your results here.</div>';
}

$("#exportData").addEventListener("click", () => {
  downloadFile(
    "skillpath-progress.json",
    JSON.stringify(state, null, 2),
    "application/json"
  );
  toast("Progress data exported.");
});

$("#resetData").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset all SkillPath data in this browser? This removes your saved profile, projects, certifications, roadmap progress and quiz history."
  );

  if (!confirmed) return;

  state = structuredClone(defaultState);
  saveState();
  populateProfileForm();
  renderAll();
  navigate("dashboard");
  toast("App data has been reset.");
});

/* =========================================================
   PROFILE SHORTCUTS
========================================================= */

$("#editProfile").addEventListener("click", () => {
  navigate("portfolio");
  $("#studentName").focus();
});

$("#topProfile").addEventListener("click", () => {
  navigate("portfolio");
  $("#studentName").focus();
});

/* =========================================================
   INITIALIZATION
========================================================= */

function renderAll() {
  renderProfilePreview();
  renderDashboard();
  renderCareers();
  renderRoadmap();
  renderPractice();
  renderRealityForm();
  renderPortfolio();
  renderResume();
  renderAnalytics();
}

function init() {
  $("#todayDate").textContent = formatDate();

  updateStreak();
  populateProfileForm();

  // Keep dashboard and full roadmap selectors synchronized.
  $("#dashboardLanguage").value = "Python";
  $("#roadmapLanguage").value = "Python";
loadResume();
  renderAll();
}

init();

const resumePhotoInput = document.getElementById("resumePhoto");
const previewResumePhoto = document.getElementById("previewResumePhoto");

if (resumePhotoInput && previewResumePhoto) {
    resumePhotoInput.addEventListener("change", function () {
        const file = this.files && this.files[0];

        if (!file) {
            previewResumePhoto.removeAttribute("src");
            previewResumePhoto.hidden = true;
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image.");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            previewResumePhoto.src = event.target.result;
            previewResumePhoto.hidden = false;
        };

        reader.readAsDataURL(file);
    });
}
