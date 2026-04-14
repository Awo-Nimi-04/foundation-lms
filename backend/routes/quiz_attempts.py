import json
import re
from collections import defaultdict
from extensions import db
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.course_material import CourseMaterial
from models.enrollment import Enrollment
from models.quiz_attempt import QuizAttempt, QuestionAttempt
from models.quiz import Quiz, QuizQuestion
from utils.decorators import instructor_required

quiz_attempts_bp = Blueprint("quiz_attempts", __name__, url_prefix="/quiz_attempts")



def normalize_answer(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())

@quiz_attempts_bp.route("/<int:attempt_id>/submit", methods=["POST"])
@jwt_required()
def submit_attempt(attempt_id):

    identity = json.loads(get_jwt_identity())
    student_id = int(identity["id"])

    if identity["role"] != "student":
        return jsonify({"error": "Students only"}), 403

    attempt = QuizAttempt.query.get_or_404(attempt_id)

    if attempt.student_id != student_id:
        return jsonify({"error": "Unauthorized"}), 403

    if attempt.status == "submitted":
        return jsonify({"error": "Already submitted"}), 400

    data = request.get_json()
    answers = data.get("answers", [])

    questions = QuizQuestion.query.filter_by(
        quiz_id=attempt.quiz_id
    ).all()

    question_lookup = {q.id: q for q in questions}

    total_score = 0
    total_max_score = sum(q.score_per_question or 0 for q in question_lookup.values())
    answered_map = {
        int(item["question_id"]): item.get("answer", "").strip()
        for item in answers if item.get("question_id") is not None
    }

    for q_id, question in question_lookup.items():
        student_answer = answered_map.get(q_id, "")
        norm_student = normalize_answer(student_answer)
        norm_correct = normalize_answer(question.correct_answer)

        correct = norm_student == norm_correct if student_answer else False

        question_max = question.score_per_question or 0
        score = question_max if correct else 0.0

        total_score += score

        qa = QuestionAttempt(
            attempt_id=attempt.id,
            student_id=attempt.student_id,
            question_id=q_id,
            submitted_answer=student_answer,
            score=score,
            max_score=question_max,
        )
        db.session.add(qa)

    attempt.score = total_score
    attempt.status = "submitted"
    attempt.submitted_at =  datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        "attempt_id": attempt.id,
        "score": round(total_score, 2),
        "max_score": total_max_score
    })

@quiz_attempts_bp.route("/<int:quiz_id>/student", methods=['GET'])
@jwt_required()
def get_student_attempts_for_quiz(quiz_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    if role != "student":
        return jsonify({
            "message": "Unauthorized, only for students!"
        }), 403
    
    quiz = Quiz.query.get_or_404(quiz_id)

    quiz_attempts= (
        QuizAttempt.query
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == user_id,
            QuizAttempt.status.in_(["submitted", "graded"])
        )
    ).all()

    quiz_attempts_list = []

    for quiz_attempt in quiz_attempts:
        quiz_attempts_list.append({
            "id": quiz_attempt.id,
        })
    return jsonify({
        "quiz_title": quiz.title,
        "quiz_max_score": quiz.get_max_score(),
        "quiz_attempts": quiz_attempts_list,
    })

@quiz_attempts_bp.route("/<int:quiz_id>", methods=["GET"])
@jwt_required()
def get_attempts_for_quiz(quiz_id):
    identity = json.loads(get_jwt_identity())
    id = int(identity["id"])

    quiz_attempts = QuizAttempt.query.filter_by(
        student_id = id,
        quiz_id = quiz_id,
        status = "graded",
    ).all()

    quiz_attempt_list = []

    for quiz_attempt in quiz_attempts:
        quiz_attempt_list.append({
            "id": quiz_attempt.id,
        })
    return jsonify({
        "quiz_attempts": quiz_attempt_list,
    })

@quiz_attempts_bp.route("/<int:attempt_id>/quiz_attempt_analytics")
@jwt_required()
def quiz_attempt_analytics(attempt_id):

    identity = json.loads(get_jwt_identity())
    student_id = int(identity["id"])

    attempt = QuizAttempt.query.get(attempt_id)

    if not attempt:
        return jsonify({"error": "Quiz attempt not found"}), 404

    if student_id != attempt.student_id:
        return jsonify({"error": "Unauthorized access"}), 403

    question_attempts = QuestionAttempt.query.filter_by(attempt_id=attempt_id).all()
    if not question_attempts:
        return jsonify({"error": "No question attempts found"}), 404

    material_stats = defaultdict(lambda: {"score": 0, "max_score": 0})

    # Use stored attempt score (source of truth)
    total_score = attempt.score

    # derive max score from quiz definition
    quiz = Quiz.query.get(attempt.quiz_id)
    total_possible = sum(q.score_per_question or 0 for q in quiz.questions)

    for qa in question_attempts:
        question = QuizQuestion.query.get(qa.question_id)
        if not question:
            continue

        material = material_stats[question.material_id]
        material["score"] += qa.score or 0
        material["max_score"] += qa.max_score or 0

    analysis = []
    for material_id, stats in material_stats.items():

        mastery_percent = (
            (stats["score"] / stats["max_score"]) * 100
            if stats["max_score"] else 0
        )

        material = CourseMaterial.query.get(material_id)
        material_source_name = material.file_name if material else "Unknown Material"

        if mastery_percent >= 70:
            strength_or_weakness = "Strength"
            recommendation = "Continue on other material or practice exercises."
        else:
            strength_or_weakness = "Weakness"
            recommendation = f"Review {material_source_name} and retry related exercises."

        analysis.append({
            "material_id": material_id,
            "material_source_name": material_source_name,
            "mastery_percent": round(mastery_percent, 2),
            "strength_or_weakness": strength_or_weakness,
            "recommendation": recommendation
        })

    total_percent = (total_score / total_possible) * 100 if total_possible else 0

    return jsonify({
        "quiz_attempt_id": attempt_id,
        "attempt_status": attempt.status,
        "quiz_id": attempt.quiz_id,
        "student_id": attempt.student_id,
        "total_score": total_score,
        "total_percent": round(total_percent, 2),
        "analysis_per_material": analysis
    })

@quiz_attempts_bp.route("/<int:quiz_id>/instructor_analytics")
@instructor_required
def instructor_quiz_analytics(quiz_id):
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    # Fetch quiz
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    # Only the instructor who owns the quiz can see analytics
    if quiz.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    # Fetch all attempts for this quiz
    attempts = QuizAttempt.query.filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.status.in_(["submitted", "graded"])
    ).all()

    if not attempts:
        return jsonify({"error": "No attempts found"}), 404

    # Prepare aggregation structures
    question_stats = defaultdict(lambda: {
        "correct": 0,
        "attempts": 0
    })
    material_stats = defaultdict(lambda: {
        "correct": 0,
        "attempts": 0
    })
    student_best = defaultdict(lambda: 0) # tracks highest attempt per student

    for attempt in attempts:
        student_id = attempt.student_id
    
        student_best[student_id] = max(
            student_best[student_id],
            attempt.score
        )

        question_attempts = QuestionAttempt.query.filter_by(attempt_id=attempt.id).all()
        for qa in question_attempts:
            question = QuizQuestion.query.get(qa.question_id)
            if not question:
                continue

            # Per-question stats
            is_correct = (qa.score or 0) >= (qa.max_score or 0)

            qs = question_stats[qa.question_id]
            qs["attempts"] += 1
            qs["correct"] += 1 if is_correct else 0

            # Per-material stats
            ms = material_stats[question.material_id]
            ms["attempts"] += 1
            ms["correct"] += 1 if is_correct else 0

    # Compute question analysis
    question_analysis = []
    for question_id, stats in question_stats.items():
        question = QuizQuestion.query.get(question_id)
        accuracy = (stats["correct"] / stats["attempts"]) * 100
        question_analysis.append({
            "question_id": question_id,
            "question_text": question.question_text if question else "Unknown",
            "accuracy_percent": round(accuracy, 2),
            "attempts": stats["attempts"]
        })

    # Identify easiest and hardest question
    easiest_question = max(question_analysis, key=lambda x: x["accuracy_percent"], default=None)
    hardest_question = min(question_analysis, key=lambda x: x["accuracy_percent"], default=None)

    # Compute material analysis
    material_analysis = []
    for material_id, stats in material_stats.items():
        material = CourseMaterial.query.get(material_id)
        mastery  = stats["correct"] / stats["attempts"] * 100
        material_analysis.append({
            "material_id": material_id,
            "material_source_name": material.file_name if material else "Unknown Material",
            "mastery_percent": round(mastery, 2),
            "attempts": stats["attempts"]
        })

    # Lowest and highest quiz score across students
    all_max_scores = list(student_best.values())
    lowest_quiz_score = min(all_max_scores) if all_max_scores else 0
    highest_quiz_score = max(all_max_scores) if all_max_scores else 0

    total_attempts = len(attempts)
    avg_score = round(
        sum(student_best.values()) / len(student_best),
        2
    )

    return jsonify({
        "quiz_id": quiz.id,
        "quiz_max_score": quiz.get_max_score(),
        "quiz_title": quiz.title,
        "total_attempts": total_attempts,
        "average_score": avg_score,
        "lowest_quiz_score": lowest_quiz_score,
        "highest_quiz_score": highest_quiz_score,
        "easiest_question": easiest_question,
        "hardest_question": hardest_question,
        "material_analysis": material_analysis
    })


    attempt = QuizAttempt.query.get_or_404(attempt_id)
    quiz = Quiz.query.get(attempt.quiz_id)

    if not quiz.time_limit_minutes:
        return jsonify({"time_remaining": None})

    elapsed = (datetime.now() - attempt.started_at).total_seconds() / 60
    remaining = max(0, quiz.time_limit_minutes - elapsed)

    return jsonify({"time_remaining_minutes": round(remaining, 2)})

@quiz_attempts_bp.route("/<int:attempt_id>/grade", methods=["PATCH"])
@instructor_required
def grade_quiz_attempt(attempt_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    if identity["role"] != "instructor":
        return jsonify({"error": "Instructors only"}), 403

    attempt = QuizAttempt.query.get_or_404(attempt_id)
    quiz = Quiz.query.get_or_404(attempt.quiz_id)

    if quiz.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403  

    data = request.get_json()
    question_updates = data.get("questions", [])

    question_attempts = QuestionAttempt.query.filter_by(attempt_id=attempt_id).all()
    question_lookup = {qa.question_id: qa for qa in question_attempts}

    # Apply instructor updates (RAW SCORES ONLY)
    for q_update in question_updates:
        q_id = q_update.get("question_id")

        try:
            score = float(q_update.get("score", 0))
        except (TypeError, ValueError):
            continue

        qa = question_lookup.get(q_id)
        if not qa:
            continue

        # optional safety clamp
        qa.score = max(0, min(score, qa.max_score))

        qa.manually_graded = True
        qa.auto_graded = False
        qa.graded_at = datetime.now(timezone.utc)

    # Recompute from truth
    question_attempts = QuestionAttempt.query.filter_by(attempt_id=attempt_id).all()

    total_score = sum(qa.score or 0 for qa in question_attempts)
    max_total = sum(qa.max_score for qa in question_attempts)

    attempt.score = total_score
    attempt.status = "graded"
    attempt.submitted_at = attempt.submitted_at or datetime.now()

    db.session.commit()

    return jsonify({
        "attempt_id": attempt.id,
        "student_id": attempt.student_id,
        "quiz_id": attempt.quiz_id,
        "status": attempt.status,
        "score": round(total_score, 2),
        "max_score": max_total,
        "graded_questions": [
            {
                "question_id": qa.question_id,
                "score": qa.score,
                "max_score": qa.max_score
            } for qa in question_attempts
        ]
    })

@quiz_attempts_bp.route("/<int:attempt_id>/responses", methods=["GET"])
@jwt_required()
def get_quiz_attempt_responses(attempt_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    attempt = QuizAttempt.query.get_or_404(attempt_id)
    quiz = Quiz.query.get_or_404(attempt.quiz_id)

    if role == "student":
        enrollment = Enrollment.query.filter_by(
            student_id = user_id,
            course_id = quiz.course_id
        )

        if not enrollment:
            return jsonify({"error": "Unauthorized This student is not enrolled in this course."}), 403

    # Fetch all questions
    questions = QuizQuestion.query.filter_by(quiz_id=quiz.id).all()

    # Fetch student's answers for this attempt
    question_attempts = QuestionAttempt.query.filter_by(
        attempt_id=attempt_id
    ).all()

    attempt_lookup = {qa.question_id: qa for qa in question_attempts}

    responses = []

    for q in questions:
        qa = attempt_lookup.get(q.id)

        responses.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "correct_answer": q.correct_answer,
            "submitted_answer": qa.submitted_answer if qa else None,
            "score": qa.score if qa else None,
            "max_score": q.score_per_question
        })

    return jsonify({"responses": responses})

@quiz_attempts_bp.route("/quiz/<int:quiz_id>/student/<int:student_id>/responses", methods=["GET"])
@instructor_required
def get_student_quiz_responses(quiz_id, student_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    quiz = Quiz.query.get_or_404(quiz_id)
    user = User.query.get_or_404(student_id)

    if user.role == "instructor":
        return jsonify({"error": "Unavaialble feature for instructor"}), 400

    # Ensure instructor owns this quiz
    if role == "instructor" and quiz.instructor_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    attempt = (
        QuizAttempt.query
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.student_id == student_id,
            QuizAttempt.status.in_(["submitted", "graded"])
        )
        .order_by(QuizAttempt.submitted_at.desc())
        .first()
    )

    if not attempt:
        return jsonify({
        "quiz_id": quiz_id,
        "quiz_total_score": quiz.get_max_score(),
        "quiz_title": quiz.title,
        "student_id": student_id,
        "student_email": user.email,
        "first_name": user.f_name,
        "last_name": user.l_name,
        "status": "not_submitted",
    })

    # Fetch all questions
    questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).all()

    # Fetch student's answers for this attempt
    question_attempts = QuestionAttempt.query.filter_by(
        attempt_id=attempt.id
    ).all()

    attempt_lookup = {qa.question_id: qa for qa in question_attempts}

    responses = []

    for q in questions:
        qa = attempt_lookup.get(q.id)

        responses.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "correct_answer": q.correct_answer,
            "submitted_answer": qa.submitted_answer if qa else None,
            "score": qa.score if qa else None,
            "max_score": q.score_per_question
        })

    return jsonify({
        "quiz_id": quiz_id,
        "attempt_score": attempt.score,
        "quiz_total_score": quiz.get_max_score(),
        "quiz_title": quiz.title,
        "student_id": student_id,
        "student_email": user.email,
        "first_name": user.f_name,
        "last_name": user.l_name,
        "attempt_id": attempt.id,
        "submitted_at": attempt.submitted_at,
        "responses": responses,
        "status": "submitted",
    })
