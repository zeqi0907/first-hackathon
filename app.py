from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///company.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# -----------------------------
# 数据模型
# -----------------------------
class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ic_number = db.Column(db.String(50), nullable=False, unique=True)
    position = db.Column(db.String(100), nullable=False)
    languages = db.Column(db.String(100), nullable=False)
    areaExperts = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(50), nullable=True)
    mentor = db.Column(db.String(100), nullable=True)

class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_name = db.Column(db.String(100), nullable=False)
    feedback_text = db.Column(db.Text, nullable=False)

class Todo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_name = db.Column(db.String(100), nullable=False)
    task = db.Column(db.String(255), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.DateTime, nullable=True)

with app.app_context():
    db.create_all()

# -----------------------------
# 登录 & 创建用户
# -----------------------------
USERS = {
    "new": {"username": "new", "password": "new123", "role": "new"},
    "user": {"username": "user", "password": "user123", "role": "user"},
    "hr": {"username": "hr", "password": "hr123", "role": "hr"},
}

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"username": user["username"], "role": user["role"]}), 200

@app.route("/create_user", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data.get("preferredUsername")
    password = data.get("preferredPassword")
    email = f"{username}@gmail.com"

    return jsonify({
        "username": username,
        "password": password,
        "email": email,
        "assignedMentor": {
            "name": "Dr. Sarah Tan",
            "email": "sarah.tan@company.com",
            "dept": "AI & SWE"
        }
    }), 201

# -----------------------------
# 候选人 API
# -----------------------------
@app.route("/add_candidate", methods=["POST"])
def add_candidate():
    data = request.get_json()
    name = data.get("name")
    ic_number = data.get("ic_number")
    position = data.get("position")
    email_prefix = data.get("email_prefix")
    languages = data.get("languages")
    areaExperts = data.get("areaExperts")

    if not name or not ic_number or not position or not languages or not areaExperts or not email_prefix:
        return jsonify({"error": "name, ic_number, position, email_prefix, languages and areaExperts are required"}), 400

    candidate = Candidate.query.filter_by(ic_number=ic_number).first()
    if candidate:
        return jsonify({"error": "Candidate already exists"}), 400

    email = f"{email_prefix}@company.com"
    new_candidate = Candidate(
        name=name,
        ic_number=ic_number,
        position=position,
        email=email,
        languages=languages,
        areaExperts=areaExperts
    )
    db.session.add(new_candidate)
    db.session.commit()

    return jsonify({
        "message": f"Candidate {name} added successfully.",
        "candidate": {
            "name": name,
            "ic_number": ic_number,
            "position": position,
            "email": email,
            "languages": languages,
            "areaExperts": areaExperts
        }
    })

# -----------------------------
# 分配导师
# -----------------------------
mentors = {
    "Alice": {
        "roles": ["Software Engineer"],
        "languages": ["Python", "C++", "Java"],
        "areaExperts": ["Web", "Backend"],
        "email": ["alice123@npc.com"]
    },
    "Bob": {
        "roles": ["Data Scientist"],
        "languages": ["Python", "R", "SQL"],
        "areaExperts": ["AI", "Machine Learning"],
        "email": ["bobatea@npc.com"]
    },
    "Charlie": {
        "roles": ["Firmware Engineer"],
        "languages": ["C", "C++"],
        "areaExperts": ["Embedded Systems", "Hardware Interface", "Device Drivers"],
        "email": ["charlieputh.fake@npc.com"]
    }
}

def match_mentor(candidate):
    best_match = None
    max_score = -1
    
    candidate_langs = [s.strip() for s in candidate.languages.split(",")]
    candidate_areas = [s.strip() for s in candidate.areaExperts.split(",")]

    for name, info in mentors.items():
        score = 0
        if candidate.position in info["roles"]:
            score += 1
        score += len(set(candidate_langs) & set(info["languages"]))
        score += len(set(candidate_areas) & set(info["areaExperts"]))
        
        if score > max_score:
            max_score = score
            best_match = name

    if max_score <= 0:
        best_match = random.choice(list(mentors.keys()))

    return best_match

@app.route("/assign_mentor", methods=["POST"])
def assign_mentor():
    data = request.get_json()
    ic_number = data.get("ic_number")

    if not ic_number:
        return jsonify({"error": "ic_number is required"}), 400

    candidate = Candidate.query.filter_by(ic_number=ic_number).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    mentor = match_mentor(candidate)
    candidate.mentor = mentor
    db.session.commit()

    mentor_email = mentors.get(mentor, {}).get("email")

    return jsonify({
        "message": f"Mentor {mentor} assigned to {candidate.name}.",
        "candidate": {
            "name": candidate.name,
            "position": candidate.position,
            "languages": candidate.languages,
            "areaExperts": candidate.areaExperts,
            "mentor": mentor,
            "mentor_email": mentor_email
        }
    })

# -----------------------------
# 核对候选人
# -----------------------------
@app.route("/verify_candidate", methods=["POST"])
def verify_candidate():
    data = request.get_json()
    name = data.get("name")
    ic_number = data.get("ic_number")

    if not name or not ic_number:
        return jsonify({"error": "name and ic_number are required"}), 400

    candidate = Candidate.query.filter_by(name=name, ic_number=ic_number).first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404

    return jsonify({
        "message": "Candidate verified successfully.",
        "candidate": {"name": candidate.name, "position": candidate.position, "email": candidate.email}
    })

# -----------------------------
# Feedback API
# -----------------------------
@app.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    try:
        data = request.get_json()
        employee_name = data.get("employee_name")
        feedback_text = data.get("feedback_text")

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
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

@app.route("/get_feedbacks", methods=["GET"])
def get_feedbacks():
    try:
        feedbacks = Feedback.query.all()
        results = [
            {
                "id": f.id,
                "employee_name": f.employee_name,
                "feedback_text": f.feedback_text
            }
            for f in feedbacks
        ]
        return jsonify({"feedbacks": results}), 200
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

# -----------------------------
# To-Do API
# -----------------------------
@app.route("/add_todo", methods=["POST"])
def add_todo():
    try:
        data = request.get_json()
        employee_name = data.get("employee_name")
        task = data.get("task")
        due_date = data.get("due_date")  # Expected Input: "2025-09-01"

        if not employee_name or not task:
            return jsonify({"error": "employee_name and task are required"}), 400

        due_date_obj = None
        if due_date:
            try:
                due_date_obj = datetime.strptime(due_date, "%Y-%m-%d")
            except ValueError:
                return jsonify({"error": "Invalid date format, use YYYY-MM-DD"}), 400

        new_todo = Todo(employee_name=employee_name, task=task, due_date=due_date_obj)
        db.session.add(new_todo)
        db.session.commit()

        return jsonify({
            "message": "To-Do added successfully.",
            "todo": {
                "id": new_todo.id,
                "employee_name": new_todo.employee_name,
                "task": new_todo.task,
                "is_completed": new_todo.is_completed,
                "due_date": str(new_todo.due_date) if new_todo.due_date else None
            }
        }), 201
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

@app.route("/get_todos/<employee_name>", methods=["GET"])
def get_todos(employee_name):
    try:
        todos = Todo.query.filter_by(employee_name=employee_name).all()
        results = [
            {
                "id": t.id,
                "task": t.task,
                "is_completed": t.is_completed,
                "due_date": str(t.due_date) if t.due_date else None
            }
            for t in todos
        ]
        return jsonify({"employee_name": employee_name, "todos": results}), 200
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

@app.route("/update_todo/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({"error": "To-Do not found"}), 404

        data = request.get_json()
        todo.is_completed = data.get("is_completed", todo.is_completed)
        db.session.commit()

        return jsonify({
            "message": "To-Do updated successfully.",
            "todo": {"id": todo.id, "task": todo.task, "is_completed": todo.is_completed}
        }), 200
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

@app.route("/delete_todo/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    try:
        todo = Todo.query.get(todo_id)
        if not todo:
            return jsonify({"error": "To-Do not found"}), 404

        db.session.delete(todo)
        db.session.commit()
        return jsonify({"message": f"To-Do {todo_id} deleted successfully."}), 200
    except Exception as error:
        return jsonify({"error": "Server error", "details": str(error)}), 500

# -----------------------------
# 首页
# -----------------------------
@app.route("/")
def index():
    return jsonify({"message": "Backend API is running!"}), 200

# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
