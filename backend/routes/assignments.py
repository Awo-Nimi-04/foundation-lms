import json
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.utils import secure_filename
from extensions import db
from models.assignment import Assignment, AssignmentSubmission
from models.course import Course
from models.user import User
from utils.decorators import instructor_required

assignments_bp = Blueprint("assignments", __name__, url_prefix="/assignments")

@assignments_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment_by_id(assignment_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    student_id = request.args.get("student_id", type=int)

    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get_or_404(assignment.course_id)

    # Authorization check for instructors
    if role == "instructor":
        if course.instructor_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

    latest_submission = None

    if student_id:
        latest_submission = (
            AssignmentSubmission.query
            .filter_by(
                assignment_id=assignment_id,
                student_id=student_id
            )
            .order_by(AssignmentSubmission.version.desc())
            .first()
        )

    return jsonify({
        "id": assignment.id,
        "title": assignment.title,
        "description": assignment.description,
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
        "max_score": assignment.max_score,
        "allow_text": assignment.allow_text_submission,
        "allow_file": assignment.allow_file_submission,

        "latest_submission": {
            "submission_id": latest_submission.id,
            "student_id": latest_submission.student_id,
            "version": latest_submission.version,
            "submission_text": latest_submission.submission_text,
            "submission_file": latest_submission.submission_file,
            "score": latest_submission.score,
            "feedback": latest_submission.feedback,
            "status": latest_submission.status,
            "submitted_at": latest_submission.submitted_at.isoformat() if latest_submission.submitted_at else None
        } if latest_submission else None
    })

@assignments_bp.route("", methods=["GET"])
@jwt_required()
def view_all_my_assignments():
    return jsonify({"message": [
        {
            "id": 1,
            "title": "Endpoint in construction",
            "due_date": "soon"
            }
        ]
    })

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
        max_score = data.get("max_score") if data.get("max_score") else 100,
        allow_text_submission = data.get("allow_text_submission") if data.get("allow_text_submission") else True,
        allow_file_submission = data.get("allow_file_submission") if data.get("allow_file_submission") else True,
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
    
@assignments_bp.route("/<int:assignment_id>/submissions", methods=["GET"])
@instructor_required
def get_student_latest_submissions(assignment_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get_or_404(assignment.course_id)

    if course.instructor_id != instructor_id:
        return jsonify({"error": "Unauthorized"}), 403

    # Subquery: latest version per student
    latest_versions = (
        db.session.query(
            AssignmentSubmission.student_id,
            db.func.max(AssignmentSubmission.version).label("latest_version")
        )
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .group_by(AssignmentSubmission.student_id)
        .subquery()
    )

    latest_submissions = (
        db.session.query(AssignmentSubmission)
        .join(
            latest_versions,
            (AssignmentSubmission.student_id == latest_versions.c.student_id) &
            (AssignmentSubmission.version == latest_versions.c.latest_version)
        )
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .all()
    )

    return jsonify({
            "max_score": assignment.max_score,
            "submissions":
            [
                {
                    "submission_id": s.id,
                    "student_id": s.student_id,
                    "version": s.version,
                    "submission_text": s.submission_text,
                    "submission_file": s.submission_file,
                    "score": s.score,
                    "feedback": s.feedback,
                    "status": s.status,
                    "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            }
                for s in latest_submissions
        ]
    })

@assignments_bp.route("/course/<int:course_id>", methods=["GET"])
@jwt_required()
def get_course_assignments(course_id):

    # Optional: check if course exists
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404

    # Fetch assignments by this instructor for the given course
    assignments = Assignment.query.filter_by(
        course_id=course_id
    ).all()

    assignments_list = []
    for a in assignments:
        assignments_list.append({
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date.isoformat() if a.due_date else None,
        })

    return jsonify({"message": assignments_list})