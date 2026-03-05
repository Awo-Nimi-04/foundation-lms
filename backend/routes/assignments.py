import json
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.utils import secure_filename

from extensions import db
from models.assignment import Assignment, AssignmentSubmission
from models.course import Course
from utils.decorators import instructor_required

assignments_bp = Blueprint("assignments", __name__, url_prefix="/assignments")

@assignments_bp.route("", methods=["POST"])
@instructor_required
def create_assignment():

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    data = request.get_json()

    assignment = Assignment(
        course_id = data["course_id"],
        instructor_id = instructor_id,
        title = data["title"],
        description = data.get("description"),
        due_date = datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
        max_score = data.get("max_score", 100),
        allow_text_submission = data.get("allow_text_submission", True),
        allow_file_submission = data.get("allow_file_submission", True)
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify({
        "message": "Assignment created",
        "assignment_id": assignment.id,
    }), 201

@assignments_bp.route("/<int:assignment_id>/submit", methods=["POST"])
@jwt_required()
def submit_assignment(assignment_id):
    identity = json.loads(get_jwt_identity())
    student_id = int(identity["id"])
    
    assignment = Assignment.query.get_or_404(assignment_id)

    latest_submission = (
        AssignmentSubmission.query.filter_by(
            assignment_id = assignment_id,
            student_id = student_id
        )
        .order_by(AssignmentSubmission.version.desc())
        .first()
    )

    next_version = 1
    # change status of latest submission to outdated
    if latest_submission:
        next_version = latest_submission.version + 1

    # Case 1: JSON submission
    file_path = None
    text_submission = None
    if request.is_json:
        data = request.get_json()
        text_submission = data.get("text_content")

    # Case 2: multipart form submission (file + text)
    else:
        file = request.files.get("file")

        if file and assignment.allow_file_submission:
            filename = secure_filename(
                f"student_{student_id}_assignment_{assignment_id}_v{next_version}_{file.filename}"
                )

            upload_folder = os.path.join(
                current_app.root_path,
                "uploads",
                "assignment files",
            )
            os.makedirs(upload_folder, exist_ok=True)

            save_path = os.path.join(upload_folder, filename)
            file.save(save_path)
            
            file_path = f"uploads/assignment_files/{filename}"

    submission = AssignmentSubmission(
        assignment_id = assignment_id,
        student_id = student_id,
        submission_text = text_submission,
        submission_file = file_path,
        submitted_at = datetime.now(),
        status = "submitted",
        version = next_version,
    )

    db.session.add(submission)
    db.session.commit()

    return jsonify({
        "message": "Submission successful",
        "version": next_version,
        "submission_id": submission.id,
    }), 201

@assignments_bp.route("/<int:assignment_id>/my_submissions", methods=["GET"])
@jwt_required()
def view_my_submission(assignment_id):
    identity = json.loads(get_jwt_identity())
    student_id = int(identity["id"])
    
    latest_submission = (
        AssignmentSubmission.query
        .filter_by(
            assignment_id=assignment_id,
            student_id=student_id
        )
        .order_by(AssignmentSubmission.version.desc())
        .first()
    )

    if not latest_submission:
        return jsonify({"message": "No submission found"}), 404


    return jsonify(
        {
            "submission_id": latest_submission.id,
            "version": latest_submission.version,
            "submmission_text": latest_submission.submission_text,
            "submission_file": latest_submission.submission_file,
            "feedback": latest_submission.feedback,
            "student_id": latest_submission.student_id,
            "submitted_at": latest_submission.submitted_at,
            "score": latest_submission.score,
            "status": latest_submission.status,
        }
    )

@assignments_bp.route("/submissions/<int:submission_id>/grade", methods=["PATCH"])
@instructor_required
def grade_submission(submission_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    submission = AssignmentSubmission.query.get_or_404(submission_id)
    assignment = Assignment.query.get(submission.assignment_id)

    if assignment.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json()
   
    submission.score = data["score"]
    submission.feedback = data.get("feedback")
    submission.graded_at = datetime.now()
    submission.status = "graded"

    db.session.commit()

    return jsonify({
        "message": "Submission grades successfully"
    })
    
@assignments_bp.route("/<int:assignment_id>/submissions/<int:student_id>", methods=["GET"])
@instructor_required
def view_student_submissions(assignment_id, student_id):

    submissions = (
        AssignmentSubmission.query.filter_by(
            assignment_id = assignment_id, 
            student_id = student_id
            )
            .order_by(AssignmentSubmission.version.desc())
            .all()
    )

    if not submissions:
        return jsonify({
            "message" : "No submissions found."
        }), 404
    
    return jsonify([
        {
            "submission_id": s.id,
            "version": s.version,
            "submission_text": s.submission_text,
            "submission_file": s.submission_file,
            "score": s.score,
            "feedback": s.feedback,
            "submitted_at": s.submitted_at,
            "status": s.status,
        }
        for s in submissions
    ])
    


