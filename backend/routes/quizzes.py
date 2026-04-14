import re
import os
import json
from openai import OpenAI
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models.quiz import Quiz
from models.course import Course
from models.course_material import CourseMaterial
from models.quiz import QuizQuestion
from models.quiz_attempt import QuizAttempt
from extensions import db
from utils.decorators import instructor_required
from utils.ai_helpers import chunk_text
from utils.ai_helpers import clean_ai_json
from utils.ai_helpers import serialize_question
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import case

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/quizzes")

gemini_client =  OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

def normalize_choices(choices):
    if isinstance(choices, str):
        try:
            return json.loads(choices)
        except:
            return []
    return choices

def normalize_question(text):
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

@quizzes_bp.route("/courses/<int:course_id>/create_quiz", methods=["POST"])
@instructor_required
def create_quiz(course_id):
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])
    role = identity["role"]

    data = request.get_json() or {}
    title = data.get("title")
    due_date_str = data.get("due_date")  # optional ISO string
    time_limit = data.get("time_limit")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    
    if course.instructor_id != instructor_id or role != "instructor":
        return jsonify({"error": "Unauthorized", "course_owner": course.instructor_id, "fraud": instructor_id}), 403
    
    due_date = None
    if due_date_str:
        try:
            due_date = datetime.fromisoformat(due_date_str)
        except ValueError:
            return jsonify({"error": "Invalid due_date format"}), 400

    quiz = Quiz(
        title=title,
        course_id=course_id,
        instructor_id=course.instructor_id,
        due_date=due_date,
        time_limit_minutes=time_limit if time_limit else None,
    )

    db.session.add(quiz)
    db.session.commit()

    return jsonify({
        "message": "Quiz created", 
        "quiz_id": quiz.id,
        "time_limit": time_limit,
        }), 201

@quizzes_bp.route("/<int:quiz_id>/generate_questions", methods=["POST"])
@instructor_required
def generate_quiz_questions(quiz_id):
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    quiz = Quiz.query.get_or_404(quiz_id)

    course = Course.query.get(quiz.course_id)
    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()

    material_id = data.get("material_id")
    num_questions = int(data.get("num_questions", 5))

    if not material_id:
        return jsonify({"error": "material_id is required"}), 400

    material = CourseMaterial.query.filter_by(
        id=material_id,
        course_id=quiz.course_id
    ).first()

    if not material:
        return jsonify({"error": "Invalid material"}), 400

    text = getattr(material, "extracted_text", None)
    if not text:
        return jsonify({"error": "No extracted text found for material"}), 400

    chunks = chunk_text(text)

    all_questions = []
    seen_questions = set()

    for chunk in chunks:

        if len(all_questions) >= num_questions:
            break

        remaining = num_questions - len(all_questions)
        questions_per_call = min(5, remaining)

        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert instructor generating quiz questions.\n"
                    "Return ONLY valid JSON array.\n\n"
                    "Each object must include:\n"
                    "- question_text\n"
                    "- question_type (short_answer or multiple_choice)\n"
                    "- correct_answer\n\n"
                    "If multiple_choice:\n"
                    "- include 'choices' array\n"
                    "- correct_answer must match one choice\n"
                )
            },
            {
                "role": "user",
                "content": (
                    f"Material ID: {material.id}\n\n"
                    f"{chunk}\n\n"
                    f"Generate {questions_per_call} questions."
                )
            }
        ]

        try:
            response = gemini_client.chat.completions.create(
                model="gemini-2.5-flash",
                messages=messages,
                temperature=0.7,
                max_tokens=1200
            )

            raw_output = response.choices[0].message.content
            cleaned = clean_ai_json(raw_output)

            match = re.search(r"\[.*\]", cleaned, re.DOTALL)
            if not match:
                continue

            parsed = json.loads(match.group(0))

            for q in parsed:

                normalized = normalize_question(q["question_text"])

                if normalized in seen_questions:
                    continue

                seen_questions.add(normalized)

                all_questions.append({
                    "material_id": material.id,
                    "question_text": q["question_text"],
                    "question_type": q["question_type"],
                    "choices": normalize_choices(q.get("choices")),
                    "correct_answer": q["correct_answer"]
                })

                if len(all_questions) >= num_questions:
                    break

        except Exception:
            continue

    if not all_questions:
        return jsonify({"error": "No questions could be generated"}), 400

    # Persist to DB
    for q in all_questions:
        db.session.add(QuizQuestion(
            quiz_id=quiz.id,
            material_id=q["material_id"],
            question_text=q["question_text"],
            question_type=q["question_type"],
            choices=q["choices"],
            correct_answer=q["correct_answer"],
        ))

    db.session.commit()

    return jsonify({
        "quiz_id": quiz.id,
        "title": quiz.title,
        "questions": all_questions
    })

@quizzes_bp.route("/<int:quiz_id>/start", methods=["POST"])
@jwt_required()
def start_quiz_attempt(quiz_id):

    identity = json.loads(get_jwt_identity())

    if identity["role"] != "student":
        return jsonify({"error": "Students only"}), 403

    student_id = identity["id"]

    quiz = Quiz.query.get_or_404(quiz_id)

    if quiz.status != "published":
        return jsonify({"error": "Quiz not available"}), 403
    
    # Prevent multiple active attempts
    existing = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        student_id=student_id,
        status="in_progress"
    ).first()

    if existing:
        return jsonify({
            "attempt_id": existing.id,
            "message": "Resuming attempt"
        })
    
    # Temporary flow: cannot start another attempt until other attempts are graded, even if submitted
    latest_submitted_attempt = (
        QuizAttempt.query
        .filter_by(
            quiz_id=quiz_id,
            student_id=student_id,
            status="submitted",
        )
        .order_by(QuizAttempt.submitted_at.desc())  # or submitted_at
        .first()
    )

    if latest_submitted_attempt and latest_submitted_attempt.status == "submitted":
        return jsonify({
            "attempt_id": latest_submitted_attempt.id,
            "message": "Wait for instructor to grade latest attempt.",
        }), 500

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        started_at = datetime.now(timezone.utc)
    )

    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        "attempt_id": attempt.id,
        "message": "Attempt started"
    })

@quizzes_bp.route("/<int:quiz_id>/publish", methods=["POST"])
@instructor_required
def publish_quiz(quiz_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    quiz = Quiz.query.get_or_404(quiz_id)
    course = Course.query.get(quiz.course_id)

    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    if quiz.status == "published":
        return jsonify({"error": "Quiz already published"}), 400

    if not quiz.questions:
        return jsonify({"error": "Quiz has no questions"}), 400

    quiz.status = "published"
    db.session.commit()

    return jsonify({"message": "Quiz published successfully"})

@quizzes_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def get_quiz(quiz_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    quiz = Quiz.query.get_or_404(quiz_id)
    course = Course.query.get_or_404(quiz.course_id)

    if role == "instructor":
        if course.instructor_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

    elif role == "student":
        if quiz.status != "published":
            return jsonify({
                "error": "Quiz not available yet"
            }), 403

    questions = QuizQuestion.query.filter_by(
        quiz_id=quiz.id
    ).all()

    # Instructor sees answers, student does not
    include_answers = (role == "instructor")

    serialized_questions = [
        serialize_question(q, include_answers)
        for q in questions
    ]

    return jsonify({
        "quiz_id": quiz.id,
        "title": quiz.title,
        "course_id": quiz.course_id,
        "due_date": quiz.due_date.isoformat() if quiz.due_date else None,
        "status": quiz.status,
        "questions": serialized_questions,
        "time_limit": quiz.time_limit_minutes,
    })

@quizzes_bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_required()
def get_quizzes_for_course(course_id):
    identity = json.loads(get_jwt_identity())
    id = int(identity["id"])
    role = identity["role"]

    quizzes = Quiz.query.filter_by(course_id=course_id).all()

    if not quizzes:
        return jsonify({"message": []}), 200

    quiz_list = []

    for quiz in quizzes:
        student_quiz_attempts = []
        if role == "student" and quiz.status != "published":
            continue
        if role == "student":
            student_quiz_attempts.extend(
            QuizAttempt.query
            .filter_by(student_id=id, quiz_id=quiz.id)
            .order_by(
                    case(
                        (QuizAttempt.status == "in_progress", 1),
                        else_=0
                    ).desc(),
                    QuizAttempt.submitted_at.desc()
                ).all()
            )
        quiz_list.append({
            "id": quiz.id,
            "title": quiz.title,
            "date_created": quiz.date_created,
            "instructor_id": quiz.instructor_id,
            "quiz_attempts": [
                                {
                                    "id": attempt.id,
                                    "score": attempt.score,
                                    "status": attempt.status,
                                    "submitted_at": attempt.submitted_at,
                                }
                                for attempt in student_quiz_attempts
                            ],
            "status": quiz.status,
        })

    return jsonify({"message": quiz_list}), 200

@quizzes_bp.route("/quiz/<int:quiz_id>", methods=["DELETE"])
@instructor_required
def delete_quiz(quiz_id):
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    quiz = Quiz.query.get_or_404(quiz_id)

    if quiz.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        db.session.delete(quiz)
        db.session.commit()

        return jsonify({
            "message": "Quiz deleted successfully",
            "quiz_id": quiz_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    