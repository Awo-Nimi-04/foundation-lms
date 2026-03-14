import re
import os
import json
from openai import OpenAI
from collections import defaultdict
from datetime import datetime
from flask import Blueprint, request, jsonify
from models.quiz import Quiz
from models.course import Course
from models.course_material import CourseMaterial
from models.quiz import QuizQuestion
from models.quiz_attempt import QuizAttempt, QuestionAttempt
from extensions import db
from utils.decorators import instructor_required
from utils.ai_helpers import clean_ai_json
from utils.ai_helpers import serialize_question
from flask_jwt_extended import get_jwt_identity, jwt_required

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/quizzes")

gemini_client =  OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

@quizzes_bp.route("/courses/<int:course_id>/create_quiz", methods=["POST"])
@instructor_required
def create_quiz(course_id):
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])
    role = identity["role"]

    data = request.get_json() or {}
    title = data.get("title")
    due_date_str = data.get("due_date")  # optional ISO string
    time_limit = data.get("time_limit_minutes")

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
        time_limit_minutes=time_limit,
    )

    db.session.add(quiz)
    db.session.commit()

    return jsonify({
        "message": "Quiz created", 
        "quiz_id": quiz.id,
        "time_limit_minutes": time_limit,
        }), 201

@quizzes_bp.route("/<int:quiz_id>/generate_questions", methods=["POST"])
@instructor_required
def generate_quiz_questions(quiz_id):

    """
    Generates a high-quality quiz based on course materials.
    Each question includes:
      - question_text
      - multiple choice (if applicable)
      - correct answer
      - material_id
    """

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    ## check if quiz already has questions
    ## error should be ai generation only for blank/new quizzes
    course = Course.query.get(quiz.course_id)
    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    num_questions = data.get("num_questions", 5)

    materials = CourseMaterial.query.filter_by(course_id = quiz.course_id).all()

    material_lookup = {
    m.source_name: m.id
    for m in materials
}

    if not materials:
        return jsonify({"error": "No course material found"}), 404
    
    formatted_materials = ""
    for m in materials:
        formatted_materials += f"\n--- {m.source_name} ---\n{m.content}\n"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert instructor generating quiz data for a software system.\n"
                "Return ONLY valid JSON.\n"
                "Do NOT include markdown, explanations, or text outside JSON.\n"
                "Output must be a JSON array.\n\n"

                "Each object MUST contain:\n"
                "- question_text\n"
                "- question_type (must be either 'short_answer' or 'multiple_choice')\n"
                "- correct_answer\n"
                "- material_id (must match the provided source_name exactly)\n\n"

                "If question_type is 'multiple_choice':\n"
                "- Include 'choices' as an array of answer options\n"
                "- The correct_answer must match one of the choices\n\n"

                "If question_type is 'short_answer':\n"
                "- Do NOT include choices\n"
            )
        },
        {
            "role": "user",
            "content": (
                f"Materials:\n{formatted_materials}\n\n"
                f"Generate {num_questions} quiz questions using the materials above.\n\n"
                "Each question must include:\n"
                "- question_text\n"
                "- question_type\n"
                "- correct_answer\n"
                "- material_id\n"
                "- choices (only if question_type is multiple_choice)\n"
            )
        }
    ]

    try:
        response = gemini_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=messages,
            temperature=0.6,
            max_tokens=1500
        )

        quiz_json_text = quiz_json_text = clean_ai_json(
            response.choices[0].message.content
            )

        # Remove code fences (```json ... ```)
        quiz_json_text = re.sub(r"^```json", "", quiz_json_text, flags=re.I)
        quiz_json_text = re.sub(r"```$", "", quiz_json_text)

        match = re.search(r"\[.*\]", quiz_json_text, re.DOTALL)
        if match:
            quiz_json_text = match.group(0)
        else:
            return jsonify({
                "error": "Could not extract JSON from AI Output",
                "raw_output": response.choices[0].message.content
            }), 500

        try:
            quiz_questions = json.loads(quiz_json_text)
        except json.JSONDecodeError:
            return jsonify({
                "error": "AI output could not be parsed as JSON",
                "raw_output": response.choices[0].message.content
            }), 500
        
        for q in quiz_questions:
            source_name = q['material_id']
            if source_name not in material_lookup:
                return jsonify({
                    "error": f"Unknown material: {source_name}"
                }), 400

            material_id = material_lookup[source_name]
            question = QuizQuestion(
                quiz_id = quiz.id,
                material_id = material_id,
                question_text = q['question_text'],
                choices=json.dumps(q.get("choices")) if q.get("choices") else None,
                correct_answer = q['correct_answer'],
                is_ai_generated = True,
            )
            db.session.add(question)
        db.session.commit()

        return jsonify({
            "quiz_id": quiz.id,
            "title": quiz.title,
            "questions": quiz_questions,
            })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=student_id,
        started_at = datetime.now()
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
            student_quiz_attempts.extend(QuizAttempt.query.filter_by(
                student_id = id,
                quiz_id = quiz.id
                ).all())
        quiz_list.append({
            "id": quiz.id,
            "title": quiz.title,
            "date_created": quiz.date_created,
            "instructor_id": quiz.instructor_id,
            "quiz_attempts": student_quiz_attempts,
            "status": quiz.status,
        })

    return jsonify({"message": quiz_list}), 200