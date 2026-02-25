import json
import re
from collections import defaultdict
from extensions import db
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.course_material import CourseMaterial
from models.quiz_attempt import QuizAttempt, QuestionAttempt
from models.quiz import Quiz, QuizQuestion

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

    for item in answers:
        try:
            q_id = int(item.get("question_id"))
        except (ValueError, TypeError):
            continue  # skip invalid question_id

        student_answer = item.get("answer", "").strip()

        question = question_lookup.get(q_id)
        if not question:
            continue

        norm_student = normalize_answer(student_answer)
        norm_correct = normalize_answer(question.correct_answer)
        print(f"Q{q_id}: Student='{norm_student}' | Correct='{norm_correct}'")

        correct = norm_student == norm_correct
        score = 1.0 if correct else 0.0
        total_score += score

        qa = QuestionAttempt(
            attempt_id=attempt.id,
            student_id=attempt.student_id,
            question_id=q_id,
            submitted_answer=student_answer,
            score=score
        )
        db.session.add(qa)

    final_score = total_score / len(question_lookup) if question_lookup else 0

    attempt.score = final_score
    attempt.status = "submitted"
    attempt.submitted_at = datetime.now()

    db.session.commit()

    return jsonify({
        "attempt_id": attempt.id,
        "score": round(final_score, 2)
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
    
    material_stats = defaultdict(lambda: {"correct": 0, "total": 0})

    total_score = 0
    total_possible = 0
    for qa in question_attempts:
        question = QuizQuestion.query.get(qa.question_id)
        if not question:
            continue

        # Accumulate total score
        total_score += qa.score or 0
        total_possible += 1  

        # Accumulate per material
        material = material_stats[question.material_id]
        if qa.score and qa.score > 0:
            material["correct"] += 1
        material["total"] += 1
    
    analysis = []
    for material_id, stats in material_stats.items():
        mastery_percent = (stats["correct"] / stats["total"]) * 100 if stats["total"] else 0
        # Fetch material title
        material = CourseMaterial.query.get(material_id)
        material_source_name = material.source_name if material else "Unknown Material"

        # Strength vs Weakness
        if mastery_percent >= 70:
            strength_or_weakness = "Strength"
            recommendation = "Continue to next material or practice exercises."
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
    
    # Final quiz-level summary
    total_percent = (total_score / total_possible) * 100 if total_possible else 0

    return jsonify({
            "quiz_attempt_id": attempt_id,
            "quiz_id": attempt.quiz_id,
            "student_id": attempt.student_id,
            "total_score": total_score,
            "total_percent": round(total_percent, 2),
            "analysis_per_material": analysis
        })

@quiz_attempts_bp.route("/<int:quiz_id>/instructor_analytics")
@jwt_required()
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
    attempts = QuizAttempt.query.filter_by(quiz_id=quiz_id).all()
    if not attempts:
        return jsonify({"error": "No attempts found"}), 404

    # Prepare aggregation structures
    question_stats = defaultdict(lambda: {"attempts": 0, "correct": 0})
    material_stats = defaultdict(lambda: {"attempts": 0, "correct": 0})
    student_max_scores = defaultdict(lambda: 0)  # tracks highest attempt per student


    for attempt in attempts:
        student_id = attempt.student_id
        student_max_scores[student_id] = max(student_max_scores[student_id], attempt.score or 0)

        question_attempts = QuestionAttempt.query.filter_by(attempt_id=attempt.id).all()
        for qa in question_attempts:
            question = QuizQuestion.query.get(qa.question_id)
            if not question:
                continue

            # Per-question stats
            qs = question_stats[qa.question_id]
            qs["attempts"] += 1
            if qa.score and qa.score > 0:
                qs["correct"] += 1

            # Per-material stats
            ms = material_stats[question.material_id]
            ms["attempts"] += 1
            if qa.score and qa.score > 0:
                ms["correct"] += 1

    # Compute question analysis
    question_analysis = []
    for question_id, stats in question_stats.items():
        question = QuizQuestion.query.get(question_id)
        accuracy = (stats["correct"] / stats["attempts"]) * 100 if stats["attempts"] else 0
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
        mastery = (stats["correct"] / stats["attempts"]) * 100 if stats["attempts"] else 0
        material_analysis.append({
            "material_id": material_id,
            "material_source_name": material.source_name if material else "Unknown Material",
            "mastery_percent": round(mastery, 2),
            "attempts": stats["attempts"]
        })

    # Lowest and highest quiz score across students
    all_max_scores = list(student_max_scores.values())
    lowest_quiz_score = min(all_max_scores) if all_max_scores else 0
    highest_quiz_score = max(all_max_scores) if all_max_scores else 0

    total_attempts = len(attempts)
    avg_score = round(sum(all_max_scores) / len(all_max_scores), 2) if all_max_scores else 0

    return jsonify({
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "total_attempts": total_attempts,
        "average_score": avg_score,
        "lowest_quiz_score": lowest_quiz_score,
        "highest_quiz_score": highest_quiz_score,
        "easiest_question": easiest_question,
        "hardest_question": hardest_question,
        "material_analysis": material_analysis
    })

@quiz_attempts_bp.route("/<int:attempt_id>/time_remaining")
@jwt_required()
def time_remaining(attempt_id):
    attempt = QuizAttempt.query.get_or_404(attempt_id)
    quiz = Quiz.query.get(attempt.quiz_id)

    if not quiz.time_limit_minutes:
        return jsonify({"time_remaining": None})

    elapsed = (datetime.now() - attempt.started_at).total_seconds() / 60
    remaining = max(0, quiz.time_limit_minutes - elapsed)

    return jsonify({"time_remaining_minutes": round(remaining, 2)})

