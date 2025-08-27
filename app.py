from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import random


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///company.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 数据模型
class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    ic_number = db.Column(db.String(50), nullable=False, unique=True)
    position = db.Column(db.String(100), nullable=False)
    languages = db.Column(db.String(15), nullable=False)
    areaExperts = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=True)
    mentor = db.Column(db.String(100), nullable=True)


with app.app_context():
    db.create_all()

# API 1: 添加候选人
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
    new_candidate = Candidate(name=name, ic_number=ic_number, position=position, email=email, languages=languages, areaExperts=areaExperts)
    db.session.add(new_candidate)
    db.session.commit()

    return jsonify({
        "message": f"Candidate {name} added successfully.",
        "candidate": {"name" : name, "ic_number" : ic_number, "position" : position, "email" : email, "languages" : languages, "areaExperts" : areaExperts}
    })

# API 2: 分配导师

mentors = {
    "Alice" : {"roles" : ["Software Engineer"], "languages" : ["Python", "C++", "Java"], "areaExperts" : ["Web", "Backend"], "email" : ["alice123@npc.com"]},
    "Bob" : {"roles" : ["Data Scientist"], "languages" : ["Python", "R", "SQL"], "areaExperts" : ["AI", "Machine Language"], "email" : ["bobatea@npc.com"]},
    "Charlie" : {"roles" : ["Firmware Engineer"], "languages" : ["C", "C++"], "areaExperts" : ["Embedded Systems", "Hardware Interface", "Device Drivers"], "email" : ["charlieputh.fake@npc.com"]}
}

def match_mentor(candidate):
    best_match = None
    max_score = -1
    
    candidate_langs = [s.strip() for s in candidate.programming_languages.split(",")]
    candidate_areas = [s.strip() for s in candidate.area_expertise.split(",")]

    for name, info in mentors.items():
        score = 0
        
        # 职位匹配
        if candidate.position in info["roles"]:
            score += 1
        
        # 编程语言匹配
        if candidate_langs:
            lang_match = len(set(candidate_langs) & set(info["programming_languages"]))
            score += lang_match
        
        # 领域匹配
        area_match = len(set(candidate_areas) & set(info["area_expertise"]))
        score += area_match
        
        if score > max_score:
            max_score = score
            best_match = name

    # 如果 max_score <= 0，随机挑一个 mentor
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
        "candidate": {"name": candidate.name, "position": candidate.position, "languages" : candidate.languages, "areaExperts" : candidate.areaExperts,"mentor": mentor, "mentor_email" : mentor_email}
    })

# API 3: 核对注册账号是否匹配
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

if __name__ == "__main__":
    app.run(debug=True)