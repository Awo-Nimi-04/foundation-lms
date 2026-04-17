import os
from openai import OpenAI
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from extensions import db
from models.course_material import CourseMaterial 
from models.student_progress import  StudentProgress
from models.quiz import QuizQuestion
from models.quiz_attempt import QuizAttempt
from utils.decorators import instructor_required
from routes.assignments import assignments_bp
from routes.auth import auth_bp
from routes.courses import courses_bp
from routes.discussions import discussions_bp
from routes.study import study_bp
from routes.quizzes import quizzes_bp
from routes.quiz_questions import quiz_questions_bp
from routes.quiz_attempts import quiz_attempts_bp
from flask_migrate import Migrate

app = Flask(__name__)

migrate = Migrate(app, db)

origins = [
    "http://localhost:5173",
    "https://foundation-lms.vercel.app/",
    os.getenv("FRONTEND_URL")
]

CORS(
    app,
    resources={r"/*": {"origins": origins}},
    supports_credentials=True, 
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_TOKEN")
jwt = JWTManager(app)

gemini_client =  OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

#Database configuration
db_path = os.path.join(os.path.dirname(__file__), "foundation_lms.db")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

#Initialize db with app
db.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(study_bp)
app.register_blueprint(quizzes_bp)
app.register_blueprint(quiz_questions_bp)
app.register_blueprint(quiz_attempts_bp)
app.register_blueprint(assignments_bp)
app.register_blueprint(discussions_bp)

@app.route("/")
def home():
    return "Foundation LMS backend running"

@app.route("/health")
def health():
    return {"status": "ok", "message": "Flask is running"}

    
@app.route("/instructor/<int:course_id>/analytics")
@instructor_required
def class_analytics(course_id):

    materials = CourseMaterial.query.filter_by(course_id = course_id).all()

    quiz_weight = 0.7
    study_weight = 0.3

    report = []

    for m in materials:
        # Quiz Component
        question_ids = [q.id for q in QuizQuestion.query.filter_by(material_id = m.id).all()]
        attempts = QuizAttempt.query.filter(QuizAttempt.question_id.in_(question_ids)).all()
        avg_quiz_score = sum(a.score for a in attempts)/len(attempts) if attempts else 0

        # Study Component
        progresses = StudentProgress.query.filter_by(
            course_id = course_id,
            material_id = m.id,
        ).all()
        avg_study_score = sum(p.mastery_score for p in progresses) / len(progresses) if progresses else 0

        weighted_strength_score = quiz_weight * avg_quiz_score + study_weight * avg_study_score

        report.append({
            "material_id": m.id,
            "source_name": m.source_name,
            "average_mastery": round(weighted_strength_score, 2),
            "status": "Weak Area" if weighted_strength_score < 0.6 else "Strong Area"
        })
    
    return jsonify({"class_report": report})

if __name__ == "__main__":
    app.run(debug=True, port=5001)
