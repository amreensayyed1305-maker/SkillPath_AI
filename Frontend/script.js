"use strict";

/* =========================================================
   SKILLPATH AI / GROWVIA AI — FRONTEND APPLICATION
   HTML + CSS + JavaScript | Full Backend Integration
========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// API Base URL configuration: relative if served on port 5000, otherwise http://127.0.0.1:5000/api
const API_BASE = window.location.port === "5000"
  ? "/api"
  : (window.location.protocol === "file:" || window.location.port !== "5000" ? "http://127.0.0.1:5000/api" : "/api");

const STORAGE_KEY = "skillpath_ai_v1";
const RESUME_STORAGE_KEY = "skillpath_resume_v1";
const TOKEN_KEY = "growvia_token";

let currentUser = null;
let backendAvailable = true;

const defaultState = {
  profile: {
    name: "Student", degree: "B.Tech CSE (AI)", year: "3rd Year",
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
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", error);
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 3200);
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
   API CLIENT & AUTHENTICATION
========================================================= */

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, { ...options, headers });
    backendAvailable = true;

    // Handle JSON or Blob
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } else if (contentType.includes("application/pdf")) {
      const blob = await response.blob();
      return { ok: response.ok, status: response.status, blob };
    } else {
      const text = await response.text();
      return { ok: response.ok, status: response.status, text };
    }
  } catch (error) {
    console.warn(`API request to ${endpoint} failed. Using offline state.`, error);
    backendAvailable = false;
    return { ok: false, error: error.message };
  }
}

async function checkAuth() {
  const token = getToken();
  if (!token) {
    updateAuthUI(null);
    return false;
  }

  const res = await apiRequest("/auth/me");
  if (res.ok && res.data?.user) {
    currentUser = res.data.user;
    updateAuthUI(currentUser);
    await syncAllUserData();
    return true;
  } else {
    // Invalid/expired token
    setToken(null);
    currentUser = null;
    updateAuthUI(null);
    return false;
  }
}

function updateAuthUI(user) {
  const topName = $("#topName");
  const topAvatar = $("#topAvatar");
  const miniName = $("#miniName");
  const miniAvatar = $("#miniAvatar");
  const welcomeName = $("#welcomeName");
  const dropdownUserName = $("#dropdownUserName");
  const dropdownUserEmail = $("#dropdownUserEmail");
  const logoutBtn = $("#logoutBtn");
  const dropdownDivider = $("#dropdownDivider");
  const authActionItem = $("#authActionItem");

  if (user) {
    const displayName = (user.profile?.name || user.email.split("@")[0] || "Student");
    const initial = displayName.charAt(0).toUpperCase();

    if (topName) topName.textContent = displayName.split(" ")[0];
    if (topAvatar) topAvatar.textContent = initial;
    if (miniName) miniName.textContent = displayName;
    if (miniAvatar) miniAvatar.textContent = initial;
    if (welcomeName) welcomeName.textContent = displayName.split(" ")[0];

    if (dropdownUserName) dropdownUserName.textContent = displayName;
    if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;

    if (logoutBtn) logoutBtn.style.display = "flex";
    if (dropdownDivider) dropdownDivider.style.display = "block";
    if (authActionItem) authActionItem.style.display = "none";
  } else {
    if (topName) topName.textContent = "Log In";
    if (topAvatar) topAvatar.textContent = "?";
    if (miniName) miniName.textContent = "Guest Student";
    if (miniAvatar) miniAvatar.textContent = "G";
    if (welcomeName) welcomeName.textContent = "Student";

    if (dropdownUserName) dropdownUserName.textContent = "Guest Student";
    if (dropdownUserEmail) dropdownUserEmail.textContent = "Log in to save progress";

    if (logoutBtn) logoutBtn.style.display = "none";
    if (dropdownDivider) dropdownDivider.style.display = "none";
    if (authActionItem) {
      authActionItem.style.display = "flex";
      authActionItem.innerHTML = "<span>🔑</span> Log In / Register";
    }
  }
}

async function syncAllUserData() {
  if (!currentUser) return;

  // 1. Fetch dashboard metrics
  const dashRes = await apiRequest("/dashboard");
  if (dashRes.ok && dashRes.data) {
    const d = dashRes.data;
    state.streak = d.streak || 0;
    renderStatsFromData(d);
  }

  // 2. Fetch completed roadmap progress
  const progRes = await apiRequest("/progress");
  if (progRes.ok && progRes.data) {
    state.completed = progRes.data.completed || {};
  }

  // 3. Fetch user projects
  const projRes = await apiRequest("/projects");
  if (projRes.ok && projRes.data) {
    state.projects = projRes.data.projects || [];
  }

  // 4. Fetch user certifications
  const certRes = await apiRequest("/certifications");
  if (certRes.ok && certRes.data) {
    state.certifications = certRes.data.certifications || [];
  }

  // 5. Fetch user profile
  const profRes = await apiRequest("/profile");
  if (profRes.ok && profRes.data) {
    state.profile = {
      name: profRes.data.name || "",
      degree: profRes.data.degree || "",
      year: profRes.data.year || "3rd Year",
      email: profRes.data.email || currentUser.email,
      location: profRes.data.location || "",
      bio: profRes.data.bio || "",
      github: profRes.data.github || "",
      linkedin: profRes.data.linkedin || "",
      skills: profRes.data.skills || []
    };
    populateProfileForm();
  }

  // 6. Fetch assessment history
  const histRes = await apiRequest("/assessments/history");
  if (histRes.ok && histRes.data) {
    state.quizHistory = histRes.data.history || [];
  }

  // 7. Fetch notifications
  loadNotifications();

  // 8. Load saved resume from backend
  await loadBackendResume();

  saveState();
  renderAll();
}

/* =========================================================
   AUTH MODAL & DROPDOWNS HANDLING
========================================================= */

function openAuthModal(defaultTab = "login") {
  const modal = $("#authModal");
  if (!modal) return;
  modal.classList.add("open");

  if (defaultTab === "register") {
    switchAuthTab("register");
  } else {
    switchAuthTab("login");
  }
}

function closeAuthModal() {
  const modal = $("#authModal");
  if (modal) modal.classList.remove("open");
  const loginErr = $("#loginError");
  const regErr = $("#registerError");
  if (loginErr) loginErr.classList.remove("visible");
  if (regErr) regErr.classList.remove("visible");
}

function switchAuthTab(tab) {
  const tabLogin = $("#tabLogin");
  const tabRegister = $("#tabRegister");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");
  const authTitle = $("#authTitle");
  const authSubtitle = $("#authSubtitle");

  if (tab === "register") {
    tabRegister?.classList.add("active");
    tabLogin?.classList.remove("active");
    registerForm?.classList.remove("hidden");
    loginForm?.classList.add("hidden");
    if (authTitle) authTitle.textContent = "Create Student Account";
    if (authSubtitle) authSubtitle.textContent = "Join Growvia AI to build your career roadmaps & resume.";
  } else {
    tabLogin?.classList.add("active");
    tabRegister?.classList.remove("active");
    loginForm?.classList.remove("hidden");
    registerForm?.classList.add("hidden");
    if (authTitle) authTitle.textContent = "Student Sign In";
    if (authSubtitle) authSubtitle.textContent = "Log in to track your roadmaps, take quizzes and build your portfolio.";
  }
}

// Setup Auth Modal Event Listeners
$("#closeAuthModal")?.addEventListener("click", closeAuthModal);
$("#authModal")?.addEventListener("click", (e) => {
  if (e.target.id === "authModal") closeAuthModal();
});

$("#tabLogin")?.addEventListener("click", () => switchAuthTab("login"));
$("#tabRegister")?.addEventListener("click", () => switchAuthTab("register"));

$("#loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPassword").value.trim();
  const errBox = $("#loginError");
  const submitBtn = $("#loginSubmitBtn");

  errBox.classList.remove("visible");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  const res = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Log In →";

  if (res.ok && res.data?.token) {
    setToken(res.data.token);
    currentUser = res.data.user;
    updateAuthUI(currentUser);
    closeAuthModal();
    toast("Welcome back! Logged in successfully. 👋");
    await syncAllUserData();
  } else {
    errBox.textContent = res.data?.error || "Invalid credentials. Please verify your email and password.";
    errBox.classList.add("visible");
  }
});

$("#registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim();
  const password = $("#regPassword").value.trim();
  const degree = $("#regDegree").value.trim();
  const year = $("#regYear").value;
  const errBox = $("#registerError");
  const submitBtn = $("#registerSubmitBtn");

  errBox.classList.remove("visible");
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  const res = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, degree, year })
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Create Free Account ✓";

  if (res.ok && res.data?.token) {
    setToken(res.data.token);
    currentUser = res.data.user;
    updateAuthUI(currentUser);
    closeAuthModal();
    toast("Account created successfully! Welcome to Growvia AI. 🎉");
    await syncAllUserData();
  } else {
    errBox.textContent = res.data?.error || "Registration failed. Please check your information.";
    errBox.classList.add("visible");
  }
});

// Top Profile Dropdown Toggle
const topProfileBtn = $("#topProfile");
const userDropdown = $("#userDropdown");

if (topProfileBtn && userDropdown) {
  topProfileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!currentUser) {
      openAuthModal("login");
    } else {
      userDropdown.classList.toggle("show");
    }
  });
}

$("#authActionItem")?.addEventListener("click", () => {
  userDropdown?.classList.remove("show");
  openAuthModal("login");
});

$("#logoutBtn")?.addEventListener("click", async () => {
  userDropdown?.classList.remove("show");
  await apiRequest("/auth/logout", { method: "POST" });
  setToken(null);
  currentUser = null;
  updateAuthUI(null);
  toast("You have logged out.");
  navigate("dashboard");
});

// Notifications Bell & Dropdown
const notifButton = $("#notifButton");
const notifDropdown = $("#notifDropdown");

if (notifButton && notifDropdown) {
  notifButton.addEventListener("click", (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("show");
  });
}

$("#markAllRead")?.addEventListener("click", async () => {
  const badge = $("#notifBadge");
  if (badge) badge.classList.remove("visible");
  toast("Notifications cleared.");
});

// Close dropdowns on outside click
document.addEventListener("click", (e) => {
  if (userDropdown && !e.target.closest(".dropdown-container")) {
    userDropdown.classList.remove("show");
  }
  if (notifDropdown && !e.target.closest(".notif-button-wrapper")) {
    notifDropdown.classList.remove("show");
  }
});

async function loadNotifications() {
  if (!currentUser) return;
  const res = await apiRequest("/notifications");
  if (res.ok && res.data) {
    const notifs = res.data.notifications || [];
    const unread = res.data.unread_count || 0;
    const badge = $("#notifBadge");
    if (badge) {
      badge.classList.toggle("visible", unread > 0);
    }
    const list = $("#notifList");
    if (list && notifs.length) {
      list.innerHTML = notifs.map(n => `
        <div class="notif-item ${n.is_read ? '' : 'unread'}">
          <strong>${escapeHTML(n.title)}</strong>
          <p>${escapeHTML(n.message)}</p>
        </div>
      `).join("");
    }
  }
}

/* =========================================================
   LEARNING ROADMAPS DATA
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

let careersList = [
  {
    id: 1, title: "Frontend Developer", category: "Development",
    icon: "◈", description: "Build responsive interfaces and interactive web experiences.",
    skills: ["HTML", "CSS", "JavaScript", "Git"],
    roadmap: "Web Development",
    tasks: ["Create responsive pages", "Build accessible components", "Consume REST APIs", "Deploy a portfolio"],
    is_bookmarked: false
  },
  {
    id: 2, title: "Backend Developer", category: "Development",
    icon: "⌘", description: "Build APIs, server-side logic and database-driven applications.",
    skills: ["Python", "SQL", "APIs", "Git"],
    roadmap: "Python",
    tasks: ["Learn a backend framework", "Design REST APIs", "Work with databases", "Build an authenticated application"],
    is_bookmarked: false
  },
  {
    id: 3, title: "Data Analyst", category: "Data",
    icon: "▥", description: "Turn raw data into insights that support business decisions.",
    skills: ["SQL", "Excel", "Python", "Visualization"],
    roadmap: "SQL",
    tasks: ["Clean datasets", "Write analytical SQL queries", "Create dashboards", "Present findings"],
    is_bookmarked: false
  },
  {
    id: 4, title: "AI / ML Engineer", category: "AI / ML",
    icon: "✧", description: "Develop machine learning solutions and intelligent applications.",
    skills: ["Python", "Statistics", "ML", "Data"],
    roadmap: "AI / Machine Learning",
    tasks: ["Prepare datasets", "Train baseline models", "Evaluate model quality", "Deploy a model demo"],
    is_bookmarked: false
  },
  {
    id: 5, title: "Python Developer", category: "Development",
    icon: "🐍", description: "Create scripts, automation tools and software using Python.",
    skills: ["Python", "OOP", "APIs", "SQL"],
    roadmap: "Python",
    tasks: ["Master core Python", "Practise object-oriented programming", "Build an API", "Create a documented project"],
    is_bookmarked: false
  },
  {
    id: 6, title: "Java Developer", category: "Development",
    icon: "☕", description: "Develop Java applications and enterprise software.",
    skills: ["Java", "OOP", "SQL", "DSA"],
    roadmap: "Java",
    tasks: ["Learn core Java", "Practise collections", "Build database integration", "Create a Java project"],
    is_bookmarked: false
  },
  {
    id: 7, title: "Software Engineer", category: "Core CS",
    icon: "⚙", description: "Design, build, test and maintain software systems.",
    skills: ["DSA", "Programming", "Git", "Testing"],
    roadmap: "Data Structures & Algorithms",
    tasks: ["Practise algorithms", "Learn software design", "Use version control", "Build and test an application"],
    is_bookmarked: false
  },
  {
    id: 8, title: "Full Stack Developer", category: "Development",
    icon: "▣", description: "Work across frontend interfaces, backend services and databases.",
    skills: ["HTML", "JavaScript", "APIs", "SQL"],
    roadmap: "Web Development",
    tasks: ["Build a responsive frontend", "Create an API", "Connect a database", "Deploy a full-stack project"],
    is_bookmarked: false
  },
  {
    id: 9, title: "Data Engineer", category: "Data",
    icon: "⇄", description: "Build pipelines that collect, transform and deliver data.",
    skills: ["SQL", "Python", "ETL", "Databases"],
    roadmap: "SQL",
    tasks: ["Write advanced SQL", "Clean and transform data", "Build a simple ETL pipeline", "Document data quality"],
    is_bookmarked: false
  }
];

/* =========================================================
   QUIZZES
========================================================= */

const defaultQuizzes = {
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

$("#menuToggle")?.addEventListener("click", () => {
  $("#sidebar")?.classList.toggle("open");
});

document.addEventListener("click", event => {
  if (
    window.innerWidth <= 850 &&
    $("#sidebar")?.classList.contains("open") &&
    !event.target.closest("#sidebar") &&
    !event.target.closest("#menuToggle")
  ) {
    $("#sidebar")?.classList.remove("open");
  }
});

const floatingAIButton = document.getElementById("floatingAIButton");
if (floatingAIButton) {
  floatingAIButton.addEventListener("click", function () {
    navigate("assistant");
  });
}

/* =========================================================
   PROGRESS & METRICS HELPERS
========================================================= */

function isCompleted(track, index) {
  return !!state.completed[track]?.includes(index);
}

function completedCount(track) {
  return (state.completed[track] || []).length;
}

function progressFor(track) {
  const total = roadmaps[track]?.length || 10;
  return Math.round(completedCount(track) / total * 100);
}

function totalCompleted() {
  return Object.values(state.completed).reduce((total, items) => total + items.length, 0);
}

function averageScore() {
  if (!state.quizHistory.length) return null;
  return Math.round(
    state.quizHistory.reduce((sum, item) => sum + item.percent, 0) /
    state.quizHistory.length
  );
}

function updateStreakLocal() {
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

function renderStatsFromData(d) {
  $("#roadmapStat").textContent = (d.roadmap_progress || 0) + "%";
  $("#roadmapBar").style.width = (d.roadmap_progress || 0) + "%";
  $("#streakStat").textContent = d.streak || 0;
  $("#completedStat").textContent = d.topics_completed || 0;
  $("#scoreStat").textContent = d.practice_average === null || d.practice_average === undefined ? "—" : d.practice_average + "%";
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

async function renderDashboard() {
  // If backend available, fetch real dashboard metrics
  const dashRes = await apiRequest("/dashboard");
  if (dashRes.ok && dashRes.data) {
    renderStatsFromData(dashRes.data);
  } else {
    renderStats();
  }

  const track = $("#dashboardLanguage").value;
  const topics = roadmaps[track] || roadmaps["Python"];
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

$("#dashboardLanguage")?.addEventListener("change", renderDashboard);

document.addEventListener("click", async event => {
  const toggle = event.target.closest("[data-toggle-topic]");
  const open = event.target.closest("[data-open-topic]");

  if (toggle) {
    await toggleTopic(toggle.dataset.track, Number(toggle.dataset.toggleTopic));
  }

  if (open) {
    $("#roadmapLanguage").value = open.dataset.track;
    navigate("roadmap");
    renderRoadmap();
    toast("Opened " + (roadmaps[open.dataset.track]?.[Number(open.dataset.openTopic)]?.[0] || "topic"));
  }
});

async function toggleTopic(track, index) {
  if (!roadmaps[track] || !Number.isInteger(index)) return;

  if (!state.completed[track]) state.completed[track] = [];
  const list = state.completed[track];
  const position = list.indexOf(index);
  const willBeCompleted = position < 0;

  if (willBeCompleted) {
    list.push(index);
    updateStreakLocal();
    toast("Great work! Milestone completed ✓");
  } else {
    list.splice(position, 1);
    toast("Topic marked incomplete.");
  }

  saveState();
  renderDashboard();
  renderRoadmap();
  renderAnalytics();

  // Call backend API if user is logged in
  if (currentUser) {
    const res = await apiRequest("/progress", {
      method: "POST",
      body: JSON.stringify({ track, step_index: index })
    });
    if (res.ok && res.data) {
      state.completed[track] = res.data.completed_indices || [];
      saveState();
      renderDashboard();
      renderRoadmap();
      renderAnalytics();
    }
  }
}

/* =========================================================
   ROADMAP PAGE
========================================================= */

async function renderRoadmap() {
  const track = $("#roadmapLanguage").value;
  const topics = roadmaps[track] || roadmaps["Python"];
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

$("#roadmapLanguage")?.addEventListener("change", renderRoadmap);

/* =========================================================
   CAREER EXPLORER
========================================================= */

async function loadCareersFromBackend() {
  const res = await apiRequest("/careers");
  if (res.ok && res.data?.careers) {
    careersList = res.data.careers;
  }
}

function renderCareers() {
  const query = $("#careerSearch").value.trim().toLowerCase();
  const category = $("#careerFilter").value;

  const filtered = careersList.filter(career => {
    const text = [
      career.title, career.description, ...(career.skills || [])
    ].join(" ").toLowerCase();

    return text.includes(query) &&
      (category === "All" || career.category === category);
  });

  $("#careerGrid").innerHTML = filtered.length
    ? filtered.map(career => `
      <button class="career-card" data-career="${escapeHTML(career.title)}" data-career-id="${career.id}">
        <span class="career-icon">${career.icon || "◈"}</span>
        <h3>${escapeHTML(career.title)}</h3>
        <p>${escapeHTML(career.description)}</p>
        <div class="career-tags">
          ${(career.skills || []).map(skill => `<span>${escapeHTML(skill)}</span>`).join("")}
        </div>
        <div style="margin-top:16px;color:#D96B43;font-size:11px;font-weight:700;display:flex;justify-content:space-between;align-items:center;">
          <span>Explore role →</span>
          ${career.is_bookmarked ? '<span style="color:#F5A623;">★ Saved</span>' : ''}
        </div>
      </button>
    `).join("")
    : '<div class="panel empty-state">No matching careers. Try another search.</div>';
}

$("#careerSearch")?.addEventListener("input", renderCareers);
$("#careerFilter")?.addEventListener("change", renderCareers);

$("#careerGrid")?.addEventListener("click", event => {
  const card = event.target.closest("[data-career]");
  if (!card) return;

  const career = careersList.find(item => item.title === card.dataset.career);
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
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="bookmark-btn ${career.is_bookmarked ? 'saved' : ''}" id="bookmarkCareerBtn" data-career-id="${career.id}">
          ${career.is_bookmarked ? '★ Bookmarked' : '☆ Bookmark role'}
        </button>
        <button class="primary-btn" id="startCareerRoadmap">Start this roadmap →</button>
      </div>
    </div>
    <h3>Skills to develop</h3>
    <div class="skill-tags">${(career.skills || []).map(skill =>
      `<span>${escapeHTML(skill)}</span>`).join("")}</div>
    <h3 style="margin-top:20px">Suggested preparation milestones</h3>
    <ul>${(career.tasks || []).map(task => `<li>${escapeHTML(task)}</li>`).join("")}</ul>
    <p class="muted">These are general preparation suggestions, not a guarantee of employment. Review current job descriptions for your target market.</p>
  `;

  $("#startCareerRoadmap")?.addEventListener("click", () => {
    $("#roadmapLanguage").value = career.roadmap;
    navigate("roadmap");
    renderRoadmap();
  });

  $("#bookmarkCareerBtn")?.addEventListener("click", async () => {
    if (!currentUser) {
      toast("Please log in to bookmark career options.");
      openAuthModal("login");
      return;
    }

    const res = await apiRequest(`/careers/${career.id}/bookmark`, { method: "POST" });
    if (res.ok && res.data) {
      career.is_bookmarked = res.data.bookmarked;
      toast(res.data.message);
      renderCareers();
      const bBtn = $("#bookmarkCareerBtn");
      if (bBtn) {
        bBtn.classList.toggle("saved", career.is_bookmarked);
        bBtn.textContent = career.is_bookmarked ? "★ Bookmarked" : "☆ Bookmark role";
      }
    }
  });
});

/* =========================================================
   PRACTICE ZONE — QUIZZES & ASSESSMENTS
========================================================= */

let quizTrack = "Python";
let quizIndex = 0;
let quizAnswers = [];
let quizSubmitted = false;
let currentQuizData = null;

async function getQuizQuestions() {
  if (currentQuizData && currentQuizData.track === quizTrack) {
    return currentQuizData.questions;
  }

  // Fetch secure questions from backend (correct answers stripped)
  const res = await apiRequest(`/quizzes/${encodeURIComponent(quizTrack)}`);
  if (res.ok && res.data?.questions) {
    currentQuizData = res.data;
    return res.data.questions;
  }

  // Fallback to local default questions if offline
  return defaultQuizzes[quizTrack] || defaultQuizzes.Python;
}

async function renderPractice() {
  await renderQuiz();
  renderRevision();
  renderHistory();
}

async function renderQuiz() {
  const questions = await getQuizQuestions();
  const question = questions[quizIndex] || questions[0];

  $("#quizCategory").textContent = quizTrack.toUpperCase() + " BASICS";
  $("#quizCount").textContent = `Question ${Math.min(quizIndex + 1, questions.length)} of ${questions.length}`;
  $("#quizBar").style.width = ((quizIndex + (quizSubmitted ? 1 : 0)) / questions.length * 100) + "%";

  if (quizSubmitted) {
    return; // Already rendered result box in finishQuiz
  }

  $("#quizContent").innerHTML = `
    <h2 class="quiz-question">${escapeHTML(question.q || question.question)}</h2>
    <div class="quiz-options">
      ${(question.options || []).map((option, index) => `
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

  $("#previousQuestion")?.addEventListener("click", () => {
    if (quizIndex > 0) {
      quizIndex--;
      renderQuiz();
    }
  });

  $("#nextQuestion")?.addEventListener("click", () => {
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
  quizTrack = roadmaps[track] ? track : "Python";
  quizIndex = 0;
  quizAnswers = [];
  quizSubmitted = false;
  currentQuizData = null;
  renderQuiz();
}

async function finishQuiz() {
  const questions = await getQuizQuestions();

  // Perform secure score calculation via server API
  const res = await apiRequest(`/quizzes/${encodeURIComponent(quizTrack)}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers: quizAnswers })
  });

  let correct = 0;
  let percent = 0;
  let reviewItems = [];

  if (res.ok && res.data) {
    correct = res.data.correct;
    percent = res.data.percent;
    reviewItems = res.data.review || [];
  } else {
    // Offline local fallback calculation
    correct = questions.reduce(
      (sum, q, idx) => sum + (quizAnswers[idx] === q.answer ? 1 : 0), 0
    );
    percent = Math.round(correct / questions.length * 100);
    reviewItems = questions.map((item, idx) => ({
      question: item.q,
      options: item.options,
      selected_option: quizAnswers[idx],
      correct_answer: item.answer,
      is_correct: quizAnswers[idx] === item.answer,
      explanation: item.explanation
    }));
  }

  // Record history
  state.quizHistory.unshift({
    track: quizTrack,
    date: new Date().toISOString(),
    correct,
    total: questions.length,
    percent
  });
  state.quizHistory = state.quizHistory.slice(0, 100);
  quizSubmitted = true;
  updateStreakLocal();
  saveState();

  $("#quizContent").innerHTML = `
    <div class="result-box">
      <div class="eyebrow">ASSESSMENT COMPLETE</div>
      <div class="result-score">${percent}%</div>
      <h2>${percent >= 80 ? "Excellent work! 🎉" : percent >= 50 ? "Good effort! ✨" : "Keep practising! 💪"}</h2>
      <p>You answered ${correct} out of ${questions.length} questions correctly.</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap;">
        <button class="primary-btn" id="retryQuiz">Try again ↻</button>
        <button class="outline-btn" id="changeQuiz">Choose another topic</button>
      </div>
    </div>
    <div class="quiz-review">
      ${reviewItems.map((item, index) => `
        <div class="revision-card">
          <strong>${index + 1}. ${escapeHTML(item.question)}</strong>
          <p>Your answer: <strong>${escapeHTML(item.options[item.selected_option] ?? "Not answered")}</strong></p>
          <p>Correct answer: <strong>${escapeHTML(item.options[item.correct_answer])}</strong></p>
          <p class="muted">${escapeHTML(item.explanation || "")}</p>
        </div>
      `).join("")}
    </div>
  `;

  $("#retryQuiz")?.addEventListener("click", () => startQuiz());
  $("#changeQuiz")?.addEventListener("click", () => {
    const names = Object.keys(roadmaps);
    const next = (names.indexOf(quizTrack) + 1) % names.length;
    startQuiz(names[next]);
  });

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

$("#revisionList")?.addEventListener("click", event => {
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
    $("#" + button.dataset.practice + "View")?.classList.add("active");
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

async function renderRealityForm() {
  const role = $("#targetRole").value;
  const skills = roleSkills[role] || roleSkills["Frontend Developer"];

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
    if (!input || !output) return;

    output.textContent = input.value + " / 5";
    input.addEventListener("input", () => {
      output.textContent = input.value + " / 5";
    });
  });

  renderRealityResult();
}

$("#targetRole")?.addEventListener("change", renderRealityForm);

$("#realityForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const role = $("#targetRole").value;
  const skills = roleSkills[role] || roleSkills["Frontend Developer"];
  const ratings = {};

  skills.forEach((skill, index) => {
    ratings[skill] = Number($("#rating" + index).value);
  });

  state.reality[role] = ratings;
  updateStreakLocal();
  saveState();
  renderRealityResult();

  // If user is authenticated, save ratings to backend
  if (currentUser) {
    const res = await apiRequest("/skill-gaps", {
      method: "POST",
      body: JSON.stringify({ role, ratings })
    });
    if (res.ok && res.data?.analysis) {
      renderBackendRealityResult(res.data.analysis);
      toast("Your skill gap assessment has been saved to your account.");
      return;
    }
  }

  toast("Your self-assessment has been recorded.");
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

  const skills = roleSkills[role] || roleSkills["Frontend Developer"];
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
    <p class="muted">Based on your self-reported skill proficiency.</p>
    <div class="result-note">
      <strong>Important:</strong> This is a self-reported learning indicator, not an objective job-readiness score. Validate your skills with projects and timed assessments.
    </div>
    <h3 style="margin-top:20px;text-align:left">Recommended focus areas</h3>
    ${gaps.length ? gaps.map(skill => `
      <div class="gap-item"><strong>${escapeHTML(skill)}</strong>
      <small>Current rating: ${ratings[skill]}/5. Strengthen fundamentals and complete a practical project.</small></div>
    `).join("") : '<p class="muted">You rated all listed skills at 3 or higher. Validate them with practical projects.</p>'}
    <button class="outline-btn full-btn" id="realityPractice">Practise in the quiz zone →</button>
  `;

  $("#realityPractice")?.addEventListener("click", () => navigate("practice"));
}

function renderBackendRealityResult(analysis) {
  const score = analysis.readiness_score;
  const gaps = analysis.gaps || [];

  $("#realityResult").innerHTML = `
    <div class="eyebrow">VERIFIED SKILL ANALYSIS</div>
    <div class="score-ring" style="--score:${score * 3.6}deg">
      <div><strong>${score}%</strong><small>Readiness</small></div>
    </div>
    <h3>${escapeHTML(analysis.role)}</h3>
    <p class="muted">${escapeHTML(analysis.disclaimer)}</p>
    <div class="result-note">
      <strong>Rule-based Recommendation:</strong> Identified ${gaps.length} skill gap(s) to target before applying for ${escapeHTML(analysis.role)} roles.
    </div>
    <h3 style="margin-top:20px;text-align:left">Recommended Learning Actions</h3>
    ${gaps.length ? gaps.map(g => `
      <div class="gap-item"><strong>${escapeHTML(g.skill)}</strong>
      <small>Rating: ${g.rating}/5 · Recommendation: Follow the '${escapeHTML(g.recommended_track)}' learning path.</small></div>
    `).join("") : '<p class="muted">All core competencies are rated at 3/5 or higher. Focus on building complete end-to-end projects!</p>'}
    <button class="outline-btn full-btn" id="realityPractice">Practise in the quiz zone →</button>
  `;

  $("#realityPractice")?.addEventListener("click", () => navigate("practice"));
}

/* =========================================================
   AI CAREER ASSISTANT
========================================================= */

function addChatMessage(message, sender) {
  const element = document.createElement("div");
  element.className = "chat-bubble " + sender;
  element.textContent = message;
  const msgContainer = $("#chatMessages");
  if (msgContainer) {
    msgContainer.appendChild(element);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }
}

async function sendChat(message) {
  const clean = message.trim();
  if (!clean) return;

  addChatMessage(clean, "user");
  $("#chatInput").value = "";

  // Call backend assistant API
  const res = await apiRequest("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message: clean })
  });

  if (res.ok && res.data?.reply) {
    addChatMessage(res.data.reply, "bot");
  } else {
    // Fallback response if offline
    setTimeout(() => {
      addChatMessage("Here is a practical next step: choose a career track in Career Explorer, study today's milestone in Skill Roadmap, and complete a Practice Zone assessment.", "bot");
    }, 250);
  }
}

$("#chatForm")?.addEventListener("submit", event => {
  event.preventDefault();
  sendChat($("#chatInput").value);
});

$$("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => sendChat(button.dataset.prompt));
});

$("#clearChat")?.addEventListener("click", () => {
  const msgContainer = $("#chatMessages");
  if (msgContainer) {
    msgContainer.innerHTML = "";
    addChatMessage("Chat cleared. What career goal or skill would you like guidance on today?", "bot");
  }
});

/* =========================================================
   PORTFOLIO & PROFILE
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
  const name = profile.name || "Student";

  $("#welcomeName").textContent = name.split(" ")[0];
  $("#miniName").textContent = name;
  $("#topName").textContent = name.split(" ")[0];
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
  $("#portfolioSkillCount").textContent = (profile.skills || []).length;
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
            <button class="delete-btn" data-delete-project="${project.id ?? index}">Remove</button>
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
            <button class="delete-btn" data-delete-cert="${cert.id ?? index}">Remove</button>
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

$("#profileForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const profileData = {
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

  state.profile = profileData;
  saveState();
  renderPortfolio();
  renderDashboard();

  if (currentUser) {
    const res = await apiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify(profileData)
    });
    if (res.ok) {
      toast("Profile saved to database successfully ✓");
      return;
    }
  }

  toast("Your student profile has been saved ✓");
});

$("#projectForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const link = $("#projectLink").value.trim();
  if (link && !safeURL(link)) {
    toast("Enter a valid HTTP or HTTPS project URL.", true);
    return;
  }

  const projData = {
    title: $("#projectTitle").value.trim(),
    description: $("#projectDescription").value.trim(),
    link
  };

  if (currentUser) {
    const res = await apiRequest("/projects", {
      method: "POST",
      body: JSON.stringify(projData)
    });
    if (res.ok && res.data?.project) {
      state.projects.unshift(res.data.project);
    } else {
      state.projects.push(projData);
    }
  } else {
    state.projects.push(projData);
  }

  saveState();
  $("#projectForm").reset();
  renderPortfolio();
  renderAnalytics();
  toast("Project added to your portfolio.");
});

$("#certForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const link = $("#certLink").value.trim();
  if (link && !safeURL(link)) {
    toast("Enter a valid HTTP or HTTPS certificate URL.", true);
    return;
  }

  const certData = {
    title: $("#certTitle").value.trim(),
    issuer: $("#certIssuer").value.trim(),
    link
  };

  if (currentUser) {
    const res = await apiRequest("/certifications", {
      method: "POST",
      body: JSON.stringify(certData)
    });
    if (res.ok && res.data?.certification) {
      state.certifications.unshift(res.data.certification);
    } else {
      state.certifications.push(certData);
    }
  } else {
    state.certifications.push(certData);
  }

  saveState();
  $("#certForm").reset();
  renderPortfolio();
  renderAnalytics();
  toast("Certification added to your portfolio.");
});

document.addEventListener("click", async event => {
  const deleteProject = event.target.closest("[data-delete-project]");
  const deleteCert = event.target.closest("[data-delete-cert]");

  if (deleteProject) {
    const val = deleteProject.dataset.deleteProject;
    if (currentUser && Number.isInteger(Number(val)) && Number(val) > 0) {
      await apiRequest(`/projects/${val}`, { method: "DELETE" });
      state.projects = state.projects.filter(p => p.id !== Number(val));
    } else {
      state.projects.splice(Number(val), 1);
    }
    saveState();
    renderPortfolio();
    renderAnalytics();
    toast("Project removed.");
  }

  if (deleteCert) {
    const val = deleteCert.dataset.deleteCert;
    if (currentUser && Number.isInteger(Number(val)) && Number(val) > 0) {
      await apiRequest(`/certifications/${val}`, { method: "DELETE" });
      state.certifications = state.certifications.filter(c => c.id !== Number(val));
    } else {
      state.certifications.splice(Number(val), 1);
    }
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
body{font:16px 'DM Sans',sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#292318;background:#FFFAF4;line-height:1.7}
header,section{background:white;padding:24px;margin:18px 0;border-radius:16px;border:1px solid #F3DFCE}
h1{color:#D96B43}h2{color:#D96B43}article{padding:12px 0;border-bottom:1px solid #F3DFCE}
a{color:#D96B43}small{color:#777}
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
<footer><small>Created with Growvia AI.</small></footer>
</body></html>`;
}

$("#exportPortfolio")?.addEventListener("click", () => {
  downloadFile("growvia-portfolio.html", buildPortfolioHTML(), "text/html;charset=utf-8");
  toast("Portfolio HTML exported.");
});

/* =========================================================
   RESUME BUILDER & PDF GENERATION
========================================================= */

const resumeFieldIds = [
  "rName", "rEmail", "rPhone", "rLocation",
  "rLinkedin", "rGithub", "rDegree", "rCollege",
  "rGraduation", "rCgpa", "rSummary", "rSkills",
  "rProjects", "rExperience", "rCertifications",
  "rAchievements"
];

function getResumeData() {
  return Object.fromEntries(
    resumeFieldIds.map(id => [
      id,
      document.getElementById(id)?.value || ""
    ])
  );
}

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
  setText("pSummary", data.rSummary, "Your professional summary will appear here.");

  const education = [
    data.rDegree,
    data.rCollege,
    data.rGraduation ? "Graduation: " + data.rGraduation : "",
    data.rCgpa ? "CGPA / Percentage: " + data.rCgpa : ""
  ].filter(value => value.trim()).join("\n");

  setText("pEducation", education, "Your degree and college will appear here.");
  setText("pSkills", data.rSkills, "Your skills will appear here.");
  setText("pProjects", data.rProjects, "Your projects will appear here.");
  setText("pExperience", data.rExperience, "Your experience will appear here.");
  setText("pCertifications", data.rCertifications, "Your certifications will appear here.");
  setText("pAchievements", data.rAchievements, "Your achievements will appear here.");
}

async function loadBackendResume() {
  if (currentUser) {
    const res = await apiRequest("/resume");
    if (res.ok && res.data) {
      resumeFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field && res.data[id] !== undefined) {
          field.value = res.data[id] || "";
        }
      });
      renderResume();
      return;
    }
  }

  // Fallback to localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(RESUME_STORAGE_KEY) || "null");
    if (saved) {
      resumeFieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = saved[id] || "";
      });
    }
  } catch (e) {
    console.warn("Could not load local resume", e);
  }
  renderResume();
}

const resumeForm = document.getElementById("resumeForm");

if (resumeForm) {
  resumeForm.addEventListener("input", renderResume);

  resumeForm.addEventListener("submit", async event => {
    event.preventDefault();
    const data = getResumeData();

    try {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
    } catch {}

    renderResume();

    if (currentUser) {
      const res = await apiRequest("/resume", {
        method: "PUT",
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast("Resume saved to backend successfully! ✓");
        return;
      }
    }

    toast("Resume saved in browser storage!");
  });
}

$("#clearResume")?.addEventListener("click", () => {
  if (!confirm("Clear all details from your resume?")) return;
  if (resumeForm) resumeForm.reset();
  localStorage.removeItem(RESUME_STORAGE_KEY);
  renderResume();
  toast("Resume form cleared.");
});

$("#printResume")?.addEventListener("click", () => {
  renderResume();
  window.print();
});

// Download server-generated PDF
$("#downloadServerPdf")?.addEventListener("click", async () => {
  if (!currentUser) {
    toast("Log in to download your server-generated PDF resume.");
    openAuthModal("login");
    return;
  }

  // Ensure latest changes are saved first
  const resumeData = getResumeData();
  await apiRequest("/resume", {
    method: "PUT",
    body: JSON.stringify(resumeData)
  });

  toast("Generating professional PDF resume...");

  const res = await apiRequest("/resume/pdf");
  if (res.ok && res.blob) {
    const url = URL.createObjectURL(res.blob);
    const link = document.createElement("a");
    link.href = url;
    const studentName = resumeData.rName ? resumeData.rName.replace(/\s+/g, "_") : "Student";
    link.download = `${studentName}_Resume.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("PDF Resume downloaded successfully! 📄");
  } else {
    toast("Unable to generate PDF. You can also use the Print button to save as PDF.", true);
  }
});

// Profile photo upload handling
const resumePhotoInput = document.getElementById("resumePhoto");
if (resumePhotoInput) {
  resumePhotoInput.addEventListener("change", async function () {
    const file = this.files && this.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select a valid image (JPG, PNG, WebP).", true);
      this.value = "";
      return;
    }

    if (currentUser) {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await apiRequest("/resume/photo", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        toast("Resume photo uploaded successfully!");
      }
    }
  });
}

/* =========================================================
   PROGRESS & ANALYTICS
========================================================= */

async function renderAnalytics() {
  const tracks = Object.keys(roadmaps);
  let d = null;

  if (currentUser) {
    const dashRes = await apiRequest("/dashboard");
    if (dashRes.ok && dashRes.data) {
      d = dashRes.data;
    }
  }

  const average = averageScore();
  const topicsDone = d ? d.topics_completed : totalCompleted();
  const attemptsCount = d ? d.recent_quizzes.length : state.quizHistory.length;
  const avgText = d && d.practice_average !== null ? d.practice_average + "%" : (average === null ? "—" : average + "%");
  const portTotal = d ? d.portfolio_count : (state.projects.length + state.certifications.length);

  $("#analyticsTopics").textContent = topicsDone;
  $("#analyticsAttempts").textContent = attemptsCount;
  $("#analyticsScore").textContent = avgText;
  $("#analyticsPortfolio").textContent = portTotal;

  $("#analyticsTracks").innerHTML = tracks.map(track => {
    const pct = progressFor(track);
    return `
      <div class="track-row">
        <div class="track-row-top"><strong>${escapeHTML(track)}</strong><span>${pct}%</span></div>
        <div class="mini-progress"><span style="width:${pct}%"></span></div>
      </div>
    `;
  }).join("");

  $("#analyticsQuizzes").innerHTML = state.quizHistory.length
    ? state.quizHistory.slice(0, 7).map(item => `
      <div class="track-row">
        <div class="track-row-top">
          <strong>${escapeHTML(item.track)}</strong><span>${item.percent}%</span>
        </div>
        <div class="mini-progress"><span style="width:${item.percent}%"></span></div>
        <small style="color:#8C7B78">${formatDate(new Date(item.date))}</small>
      </div>
    `).join("")
    : '<div class="empty-state">Complete a quiz in Practice Zone to see results here.</div>';
}

$("#exportData")?.addEventListener("click", () => {
  downloadFile(
    "growvia-progress.json",
    JSON.stringify(state, null, 2),
    "application/json"
  );
  toast("Progress data exported.");
});

$("#resetData")?.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset all local app data in this browser? This removes your saved local profile, projects, and roadmap cache."
  );

  if (!confirmed) return;

  state = structuredClone(defaultState);
  saveState();
  populateProfileForm();
  renderAll();
  navigate("dashboard");
  toast("Local app data has been reset.");
});

/* =========================================================
   PROFILE SHORTCUTS
========================================================= */

$("#editProfile")?.addEventListener("click", () => {
  navigate("portfolio");
  $("#studentName")?.focus();
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

async function init() {
  const todayElement = $("#todayDate");
  if (todayElement) todayElement.textContent = formatDate();

  updateStreakLocal();
  populateProfileForm();

  // Keep dashboard and full roadmap track selectors synchronized
  if ($("#dashboardLanguage")) $("#dashboardLanguage").value = "Python";
  if ($("#roadmapLanguage")) $("#roadmapLanguage").value = "Python";

  // Load careers
  await loadCareersFromBackend();

  // Check auth session
  await checkAuth();

  // Render initial views
  renderAll();
}

init();
