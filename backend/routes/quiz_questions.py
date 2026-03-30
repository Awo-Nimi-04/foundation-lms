import json
from extensions import db
from models.quiz import Quiz
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from utils.decorators import instructor_required
from models.quiz import QuizQuestion
from models.course import Course
from models.course_material import CourseMaterial

quiz_questions_bp = Blueprint("quiz_questions", __name__, url_prefix="/questions")

@quiz_questions_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def get_quiz_questions(quiz_id):

    quiz = Quiz.query.get(quiz_id)

    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404
    

    questions = (
        QuizQuestion.query
        .filter_by(quiz_id=quiz_id)
        .order_by(QuizQuestion.id)
        .all()
    )

    question_list = []

    for q in questions:
        question_list.append({
            "id": q.id,
            "quiz_id": q.quiz_id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "correct_answer": q.correct_answer,
            "material_id": q.material_id,
            "choices": q.choices,
            "is_ai_generated": q.is_ai_generated,
        })

    return jsonify({"message": question_list}), 200

@quiz_questions_bp.route("/<int:question_id>/edit_question", methods=["PATCH"])
@instructor_required
def edit_question(question_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    question = QuizQuestion.query.get_or_404(question_id)
    quiz = Quiz.query.get(question.quiz_id)
    course = Course.query.get_or_404(quiz.course_id)


    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    if quiz.status == "published":
        return jsonify({
            "error": "Cannot edit questions after quiz is published"
        }), 403

    data = request.get_json()

    question.question_text = data.get(
        "question_text",
        question.question_text
    )
    question.question_type = data.get("question_type", question.question_type)
    question.score_per_question = data.get("score_per_question", question.score_per_question)
    question.choices = data.get("choices", question.choices)
    question.correct_answer = data.get(
        "correct_answer",
        question.correct_answer
    )
    question.is_ai_generated = False

    quiz.update_max_score()
    db.session.commit()

    return jsonify({
        "message": "Question updated",             
        "id": question.id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "score_per_question": question.score_per_question,
        "is_ai_generated": question.is_ai_generated,
        "choices": question.choices,
        "correct_answer": question.correct_answer,
        })

@quiz_questions_bp.route("/<int:question_id>/delete_question", methods=["DELETE"])
@instructor_required
def delete_question(question_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    question = QuizQuestion.query.get_or_404(question_id)
    quiz = Quiz.query.get_or_404(question.quiz_id)
    course = Course.query.get_or_404(quiz.course_id)

    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    if quiz.status == "published":
        return jsonify({
            "error": "Cannot delete questions from a published quiz"
        }), 403

    quiz.update_max_score()
    db.session.delete(question)
    db.session.commit()

    return jsonify({"message": "Question deleted"})

@quiz_questions_bp.route("/<int:quiz_id>/add_question", methods=["POST"])
@instructor_required
def add_question(quiz_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    quiz = Quiz.query.get_or_404(quiz_id)
    course = Course.query.get_or_404(quiz.course_id)

    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    if quiz.status == "published":
        return jsonify({
            "error": "Cannot add questions to a published quiz"
        }), 403

    data = request.get_json()

    question_text = data.get("question_text")
    material_id = data.get("material_id")
    correct_answer = data.get("correct_answer")
    score_per_question = data.get("score_per_question")
    question_type = data.get("question_type")
    choices = data.get("choices")

    if not question_text or not correct_answer or not material_id:
        return jsonify({
            "error": "question_text, material_id, and correct_answer required"
        }), 400

    material = CourseMaterial.query.get(material_id)
    if not material or material.course_id != quiz.course_id:
        return jsonify({"error": "Invalid material_id"}), 400

    question = QuizQuestion(
        quiz_id=quiz.id,
        material_id=material_id,
        question_text=question_text,
        question_type=question_type,
        choices=choices,
        correct_answer=correct_answer,
        score_per_question=score_per_question,
    )

    quiz.update_max_score()
    db.session.add(question)
    db.session.commit()

    return jsonify({
        "message": "Question added",
        "id": question.id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "is_ai_generated": question.is_ai_generated,
        "choices": question.choices,
        "correct_answer": question.correct_answer,
    }), 201