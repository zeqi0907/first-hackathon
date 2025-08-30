# App.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import json
import os
import logging
import random
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# SQLite DB file next to app.py
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///company.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


# -----------------------
# Models
# -----------------------
class Candidate(db.Model):
    __tablename__ = "candidate"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    ic_number = db.Column(db.String(100), nullable=False, unique=True)
    position = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    mentor = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(100), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    years_exp = db.Column(db.Integer, default=0)
    skills_csv = db.Column(db.Text, default="")      # comma separated skills
    projects_json = db.Column(db.Text, default="[]") # json list of projects
    education_json = db.Column(db.Text, default="[]")
    certifications_json = db.Column(db.Text, default="[]")
    summary = db.Column(db.Text, default="")
    # languages: comma-separated (keeps compatibility with older DBs)
    languages = db.Column(db.String(300), nullable=True, default="")  # comma separated


class User(db.Model):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    # plain text for demo only (do NOT use in production)
    password = db.Column(db.String(200), nullable=True)
    # password_hash support (fixes NOT NULL constraint in older DBs that have password_hash)
    password_hash = db.Column(db.String(200), nullable=True)
    email = db.Column(db.String(200), nullable=True)
    full_name = db.Column(db.String(200), nullable=True)
    role = db.Column(db.String(50), default="user")  # 'user', 'hr', 'new', etc.


class Idea(db.Model):
    __tablename__ = "idea"
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="Pending Review")
    submitted_at = db.Column(db.String(20), default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))


class Task(db.Model):
    __tablename__ = "task"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)  # YYYY-MM-DD
    task = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default="Not Started")
    priority = db.Column(db.String(30), default="Medium")


# Feedback model
class Feedback(db.Model):
    __tablename__ = "feedback"
    id = db.Column(db.Integer, primary_key=True)
    employee_name = db.Column(db.String(100), nullable=False)
    feedback_text = db.Column(db.Text, nullable=False)


# Todo model
class Todo(db.Model):
    __tablename__ = "todo"
    id = db.Column(db.Integer, primary_key=True)
    employee_name = db.Column(db.String(100), nullable=False)
    task = db.Column(db.String(255), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.String(30), nullable=True)  # store as YYYY-MM-DD string


# -----------------------
# Migration helper: inspect and add missing columns (best effort)
# -----------------------
def ensure_table_and_columns():
    """
    Create tables if missing and add missing columns to existing tables.
    Best-effort migrations via PRAGMA table_info + ALTER TABLE ADD COLUMN.
    """
    db.create_all()

    expected = {
        "user": {
            "username": "VARCHAR(120)",
            "password": "VARCHAR(200) DEFAULT ''",
            "password_hash": "VARCHAR(200) DEFAULT ''",
            "email": "VARCHAR(200)",
            "full_name": "VARCHAR(200)",
            "role": "VARCHAR(50) DEFAULT 'user'"
        },
        "candidate": {
            "name": "VARCHAR(200) NOT NULL",
            "ic_number": "VARCHAR(100) NOT NULL",
            "position": "VARCHAR(200)",
            "email": "VARCHAR(200)",
            "mentor": "VARCHAR(200)",
            "phone": "VARCHAR(100)",
            "location": "VARCHAR(200)",
            "years_exp": "INTEGER DEFAULT 0",
            "skills_csv": "TEXT DEFAULT ''",
            "projects_json": "TEXT DEFAULT '[]'",
            "education_json": "TEXT DEFAULT '[]'",
            "certifications_json": "TEXT DEFAULT '[]'",
            "summary": "TEXT DEFAULT ''",
            "languages": "VARCHAR(300) DEFAULT ''"
        },
        "idea": {
            "text": "TEXT",
            "status": "VARCHAR(50) DEFAULT 'Pending Review'",
            "submitted_at": "VARCHAR(20)"
        },
        "task": {
            "date": "VARCHAR(20)",
            "task": "TEXT",
            "status": "VARCHAR(50) DEFAULT 'Not Started'",
            "priority": "VARCHAR(30) DEFAULT 'Medium'"
        },
        "feedback": {
            "employee_name": "VARCHAR(100)",
            "feedback_text": "TEXT"
        },
        "todo": {
            "employee_name": "VARCHAR(100)",
            "task": "VARCHAR(255)",
            "is_completed": "BOOLEAN DEFAULT 0",
            "due_date": "VARCHAR(30)"
        }
    }

    for table, cols in expected.items():
        try:
            rows = db.session.execute(text(f"PRAGMA table_info('{table}')")).fetchall()
            existing = {r[1] for r in rows}
        except Exception as e:
            log.warning("PRAGMA table_info failed for table %s: %s", table, e)
            existing = set()

        for col, coldef in cols.items():
            if col in existing:
                continue
            sql = f"ALTER TABLE {table} ADD COLUMN {col} {coldef}"
            try:
                db.session.execute(text(sql))
                db.session.commit()
                log.info("Added column %s to %s", col, table)
            except Exception as e:
                db.session.rollback()
                log.warning("Failed to add column %s to %s: %s", col, table, e)


# -----------------------
# Create tables & seed demo users
# -----------------------
with app.app_context():
    try:
        ensure_table_and_columns()
    except Exception as e:
        log.exception("ensure_table_and_columns raised: %s", e)

    # Seed demo users if missing (safe-guarded)
    try:
        rows = db.session.execute(text("PRAGMA table_info('user')")).fetchall()
        existing = {r[1] for r in rows}
        if "username" in existing:
            # create demo accounts if they do not exist
            def seed_user(uname, pwd, email, fullname, role="user"):
                if not User.query.filter_by(username=uname).first():
                    newu = User(username=uname, password=pwd, email=email, full_name=fullname, role=role)
                    # always store a hashed password too (for compatibility with DB constraints)
                    try:
                        newu.password_hash = generate_password_hash(pwd or "changeme")
                    except Exception:
                        newu.password_hash = None
                    try:
                        db.session.add(newu)
                        db.session.commit()
                        log.info("Seeded user %s", uname)
                    except Exception as e:
                        db.session.rollback()
                        log.warning("Seeding user %s failed: %s", uname, e)

            seed_user("new", "new123", "new@example.com", "Demo New", "new")
            seed_user("user", "user123", "user@example.com", "Demo User", "user")
            seed_user("hr", "hr123", "hr@example.com", "Demo HR", "hr")
        else:
            log.info("User table missing required columns; skipping seeding for safety.")
    except Exception as e:
        db.session.rollback()
        log.exception("Seeding demo users failed: %s", e)


# -----------------------
# Helpers
# -----------------------
def candidate_to_resume(c: Candidate):
    skills = [s.strip() for s in (c.skills_csv or "").split(",") if s.strip()]
    projects = json.loads(c.projects_json or "[]")
    education = json.loads(c.education_json or "[]")
    certifications = json.loads(c.certifications_json or "[]")
    languages = [s.strip() for s in (c.languages or "").split(",") if s.strip()]
    return {
        "id": c.id,
        "name": c.name,
        "email": c.email or "",
        "phone": c.phone or "",
        "location": c.location or "",
        "yearsExp": c.years_exp or 0,
        "education": education,
        "skills": skills,
        "projects": projects,
        "certifications": certifications,
        "summary": c.summary or "",
        "ic": c.ic_number,
        "mentor": c.mentor or "",
        "languages": languages
    }


# -----------------------
# Health
# -----------------------
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"}), 200


# -----------------------
# Authentication endpoint
# -----------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400

    try:
        user = User.query.filter_by(username=username).first()
    except Exception as e:
        log.exception("Error querying user in /login: %s", e)
        return jsonify({"error": "server error"}), 500

    if not user:
        return jsonify({"error": "invalid credentials"}), 401

    # prefer hashed password if present
    if getattr(user, "password_hash", None):
        try:
            if check_password_hash(user.password_hash or "", password):
                return jsonify({"username": user.username, "email": user.email, "role": user.role, "full_name": user.full_name}), 200
            else:
                return jsonify({"error": "invalid credentials"}), 401
        except Exception:
            # fallback to plain check if something unexpected
            pass

    # fallback to plain-text password check for demo only
    if (user.password or "") == password:
        return jsonify({"username": user.username, "email": user.email, "role": user.role, "full_name": user.full_name}), 200

    return jsonify({"error": "invalid credentials"}), 401


# -----------------------
# API: create_user (used by onboarding)
# -----------------------
@app.route("/create_user", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    # accept multiple casing variants
    full_name = data.get("fullName") or data.get("full_name") or data.get("full") or ""
    preferred_username = (data.get("preferredUsername") or data.get("preferred_username") or "").strip()
    preferred_password = data.get("preferredPassword") or data.get("preferred_password") or data.get("password") or ""
    personal_email = data.get("personalEmail") or data.get("personal_email") or ""
    position = data.get("positionTitle") or data.get("position") or "Employee"
    phone = data.get("phone") or data.get("telephone") or ""
    location = data.get("address") or ""
    languages_in = data.get("languages") or data.get("spokenLanguages") or ""
    skills_in = data.get("skills") or ""

    if not preferred_username:
        if full_name:
            preferred_username = full_name.strip().lower().replace(" ", ".")
        else:
            preferred_username = f"user{int(datetime.utcnow().timestamp())%10000}"

    # ensure unique username (best-effort)
    base = preferred_username
    uname = base
    suffix = 1
    try:
        while User.query.filter_by(username=uname).first():
            uname = f"{base}{suffix}"
            suffix += 1
    except Exception as e:
        log.warning("Username uniqueness check failed, falling back: %s", e)
        uname = f"{base}{int(datetime.utcnow().timestamp())%100000}"

    # create user
    try:
        new_user = User(username=uname, password=(preferred_password or "changeme"), email=personal_email, full_name=(full_name or uname), role="user")
        # always store password_hash to be compatible with DB constraints that expect it
        try:
            new_user.password_hash = generate_password_hash(preferred_password or "changeme")
        except Exception:
            new_user.password_hash = None
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log.exception("Failed to create User: %s", e)
        return jsonify({"error": "failed to create user", "details": str(e)}), 500

    # create candidate record for HR screener
    try:
        temp_ic = f"IC-TEMP-{int(datetime.utcnow().timestamp())}"
        candidate = Candidate(
            name=(full_name or uname),
            ic_number=temp_ic,
            position=position,
            email=personal_email,
            phone=phone,
            location=location or "",
            years_exp=0,
            skills_csv=(skills_in or ""),
            projects_json=json.dumps([]),
            education_json=json.dumps([]),
            certifications_json=json.dumps([]),
            summary="",
            languages=(languages_in or "")
        )
        db.session.add(candidate)
        db.session.commit()

        # set a stable IC (e.g., IC-0001)
        candidate.ic_number = f"IC-{candidate.id:04d}"
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log.exception("Failed to create Candidate: %s", e)
        # user exists; return created username/password anyway
        return jsonify({
            "username": uname,
            "password": new_user.password,
            "email": new_user.email or f"{uname}@gmail.com",
            "assignedMentor": None,
            "candidate": None
        }), 201

    # assign default mentor mapping
    mentor_mapping = {
        "Software Engineer": {"name": "Dr. Sarah Tan", "email": "sarah.tan@company.com", "dept": "AI & SWE"},
        "Data Scientist": {"name": "Jason Lim", "email": "jason.lim@company.com", "dept": "Frontend"},
        "Product Manager": {"name": "Divya Nair", "email": "divya.nair@company.com", "dept": "QA/Automation"}
    }
    assigned = mentor_mapping.get(position, {"name": "Ben Tan", "email": "ben.tan@company.com", "dept": "Platform"})
    candidate.mentor = assigned["name"]
    db.session.commit()

    return jsonify({
        "username": uname,
        "password": new_user.password,
        "email": new_user.email or f"{uname}@gmail.com",
        "assignedMentor": assigned,
        "candidate": candidate_to_resume(candidate)
    }), 201


# -----------------------
# Mentor matching helper (smarter)
# -----------------------
MENTORS = {
    "Alice": {"roles": ["Software Engineer"], "languages": ["Python", "C++", "Java"], "areas": ["Web", "Backend"], "email": "alice123@npc.com"},
    "Bob": {"roles": ["Data Scientist"], "languages": ["Python", "R", "SQL"], "areas": ["AI", "Machine Learning"], "email": "bobatea@npc.com"},
    "Charlie": {"roles": ["Firmware Engineer"], "languages": ["C", "C++"], "areas": ["Embedded Systems", "Hardware Interface"], "email": "charlieputh.fake@npc.com"},
    "Default Mentor": {"roles": [], "languages": [], "areas": [], "email": "mentor@company.com"}
}


def match_mentor(candidate: Candidate):
    best = None
    max_score = -1

    cand_langs = [s.strip().lower() for s in (candidate.languages or "").split(",") if s.strip()]
    cand_skills = [s.strip().lower() for s in (candidate.skills_csv or "").split(",") if s.strip()]
    cand_pos = (candidate.position or "").strip()

    for name, info in MENTORS.items():
        score = 0
        # role
        if cand_pos and cand_pos in info.get("roles", []):
            score += 2
        # language overlap
        mentor_langs = [l.lower() for l in info.get("languages", [])]
        score += len(set(cand_langs) & set(mentor_langs))
        # skills overlap
        mentor_areas = [a.lower() for a in info.get("areas", [])]
        score += len(set(cand_skills) & set(mentor_langs))
        score += len(set(cand_skills) & set(mentor_areas))
        # area overlap
        score += len(set(cand_langs) & set(mentor_areas))

        if score > max_score:
            max_score = score
            best = name

    if max_score <= 0:
        best = random.choice(list(MENTORS.keys()))
    return best


# -----------------------
# API: assign_mentor
# -----------------------
@app.route("/assign_mentor", methods=["POST"])
def assign_mentor():
    data = request.get_json() or {}
    ic_number = data.get("ic_number") or data.get("ic") or ""
    if not ic_number:
        return jsonify({"error": "ic_number is required"}), 400
    candidate = Candidate.query.filter_by(ic_number=ic_number).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    mentor = match_mentor(candidate)
    candidate.mentor = mentor
    db.session.commit()

    mentor_email = MENTORS.get(mentor, {}).get("email")

    return jsonify({
        "message": f"Mentor {mentor} assigned to {candidate.name}.",
        "candidate": {
            "name": candidate.name,
            "position": candidate.position,
            "languages": candidate.languages,
            "areaExperts": candidate.skills_csv,
            "mentor": candidate.mentor,
            "mentor_email": mentor_email,
            "ic": candidate.ic_number
        }
    }), 200


# -----------------------
# API: verify_candidate
# -----------------------
@app.route("/verify_candidate", methods=["POST"])
def verify_candidate():
    data = request.get_json() or {}
    name = data.get("name")
    ic_number = data.get("ic_number") or data.get("ic")
    if not name or not ic_number:
        return jsonify({"error": "name and ic_number are required"}), 400
    candidate = Candidate.query.filter_by(name=name, ic_number=ic_number).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify({
        "message": "Candidate verified successfully.",
        "candidate": {"name": candidate.name, "position": candidate.position, "email": candidate.email, "ic": candidate.ic_number}
    }), 200


# -----------------------
# API: add_candidate
# -----------------------
@app.route("/add_candidate", methods=["POST"])
def add_candidate():
    data = request.get_json() or {}
    name = data.get("name")
    ic_number = data.get("ic_number")
    position = data.get("position")
    email_prefix = data.get("email_prefix")

    if not name or not ic_number or not position:
        return jsonify({"error": "name, ic_number, and position are required"}), 400

    candidate = Candidate.query.filter_by(ic_number=ic_number).first()
    if candidate:
        return jsonify({"error": "Candidate already exists"}), 400

    email = f"{email_prefix}@company.com" if email_prefix else None
    try:
        new_candidate = Candidate(name=name, ic_number=ic_number, position=position, email=email)
        db.session.add(new_candidate)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "failed to add candidate", "details": str(e)}), 500

    return jsonify({
        "message": f"Candidate {name} added successfully.",
        "candidate": {"name": name, "ic_number": ic_number, "position": position, "email": email}
    }), 201


# -----------------------
# API: resumes
# -----------------------
@app.route("/resumes", methods=["GET"])
def get_resumes():
    rows = Candidate.query.all()
    resumes = [candidate_to_resume(r) for r in rows]
    return jsonify(resumes), 200


# -----------------------
# API: ideas (GET, POST)
# -----------------------
@app.route("/ideas", methods=["GET", "POST"])
def ideas():
    if request.method == "GET":
        try:
            items = Idea.query.order_by(Idea.id.desc()).all()
            out = [{"id": i.id, "text": i.text, "status": i.status, "submittedAt": i.submitted_at} for i in items]
            return jsonify(out), 200
        except Exception as e:
            log.exception("Error fetching ideas: %s", e)
            return jsonify({"error": "failed to fetch ideas"}), 500
    else:
        data = request.get_json() or {}
        text_val = data.get("text") or data.get("idea") or data.get("description")
        if not text_val:
            return jsonify({"error": "text is required"}), 400
        it = Idea(text=text_val, status="Pending Review", submitted_at=datetime.utcnow().strftime("%Y-%m-%d"))
        db.session.add(it)
        db.session.commit()
        return jsonify({"id": it.id, "text": it.text, "status": it.status, "submittedAt": it.submitted_at}), 201


# -----------------------
# API: tasks (GET, POST)
# -----------------------
@app.route("/tasks", methods=["GET", "POST"])
def tasks_api():
    if request.method == "GET":
        items = Task.query.order_by(Task.id.asc()).all()
        out = [{"id": t.id, "date": t.date, "task": t.task, "status": t.status, "priority": t.priority} for t in items]
        return jsonify(out), 200
    else:
        data = request.get_json() or {}
        date = data.get("date")
        task_text = data.get("task") or data.get("taskText") or data.get("taskText")
        priority = data.get("priority") or "Medium"
        if not date or not task_text:
            return jsonify({"error": "date and task are required"}), 400
        t = Task(date=date, task=task_text, status="Not Started", priority=priority)
        db.session.add(t)
        db.session.commit()
        return jsonify({"id": t.id, "date": t.date, "task": t.task, "status": t.status, "priority": t.priority}), 201


# -----------------------
# Feedback endpoints
# -----------------------
@app.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.get_json() or {}
        employee_name = data.get("employee_name") or data.get("employeeName")
        feedback_text = data.get("feedback_text") or data.get("feedbackText")
        if not employee_name or not feedback_text:
            return jsonify({"error": "employee_name and feedback_text are required"}), 400

        new_feedback = Feedback(employee_name=employee_name, feedback_text=feedback_text)
        db.session.add(new_feedback)
        db.session.commit()

        return jsonify({
            "message": "Feedback submitted successfully",
            "feedback": {
                "id": new_feedback.id,
                "employee_name": new_feedback.employee_name,
                "feedback_text": new_feedback.feedback_text
            }
        }), 200
    except Exception as e:
        log.exception("submit_feedback error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


@app.route("/get_feedbacks", methods=["GET"])
def get_feedbacks():
    try:
        feedbacks = Feedback.query.order_by(Feedback.id.desc()).all()
        results = [
            {"id": f.id, "employee_name": f.employee_name, "feedback_text": f.feedback_text}
            for f in feedbacks
        ]
        return jsonify({"feedbacks": results}), 200
    except Exception as e:
        log.exception("get_feedbacks error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


# -----------------------
# Todo endpoints
# -----------------------
@app.route("/add_todo", methods=["POST"])
def add_todo():
    try:
        data = request.get_json() or {}
        employee_name = data.get("employee_name") or data.get("employeeName")
        task = data.get("task")
        due_date = data.get("due_date") or data.get("dueDate")  # expected YYYY-MM-DD
        if not employee_name or not task:
            return jsonify({"error": "employee_name and task are required"}), 400

        new_todo = Todo(employee_name=employee_name, task=task, due_date=due_date)
        db.session.add(new_todo)
        db.session.commit()
        return jsonify({
            "message": "To-Do added successfully.",
            "todo": {
                "id": new_todo.id,
                "employee_name": new_todo.employee_name,
                "task": new_todo.task,
                "is_completed": new_todo.is_completed,
                "due_date": new_todo.due_date
            }
        }), 201
    except Exception as e:
        log.exception("add_todo error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


@app.route("/get_todos/<employee_name>", methods=["GET"])
def get_todos(employee_name):
    try:
        todos = Todo.query.filter_by(employee_name=employee_name).order_by(Todo.id.asc()).all()
        results = [{"id": t.id, "task": t.task, "is_completed": t.is_completed, "due_date": t.due_date} for t in todos]
        return jsonify({"employee_name": employee_name, "todos": results}), 200
    except Exception as e:
        log.exception("get_todos error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


@app.route("/update_todo/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({"error": "To-Do not found"}), 404
        data = request.get_json() or {}
        if "is_completed" in data:
            todo.is_completed = bool(data.get("is_completed"))
        if "task" in data:
            todo.task = data.get("task")
        if "due_date" in data:
            todo.due_date = data.get("due_date")
        db.session.commit()
        return jsonify({"message": "To-Do updated successfully.", "todo": {"id": todo.id, "task": todo.task, "is_completed": todo.is_completed, "due_date": todo.due_date}}), 200
    except Exception as e:
        log.exception("update_todo error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


@app.route("/delete_todo/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({"error": "To-Do not found"}), 404
        db.session.delete(todo)
        db.session.commit()
        return jsonify({"message": f"To-Do {todo_id} deleted successfully."}), 200
    except Exception as e:
        log.exception("delete_todo error: %s", e)
        return jsonify({"error": "Server error", "details": str(e)}), 500


# -----------------------
# Root
# -----------------------
@app.route("/")
def index():
    return jsonify({"message": "Backend API is running!"}), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
