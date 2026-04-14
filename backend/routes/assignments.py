import cloudinary
import json
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from extensions import db
from models.assignment import Assignment, AssignmentSubmission
from models.course import Course
from models.enrollment import Enrollment
from models.user import User
from sqlalchemy import func, and_
from utils.decorators import instructor_required

assignments_bp = Blueprint("assignments", __name__, url_prefix="/assignments")

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@assignments_bp.route("/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_assignment_by_id(assignment_id):

    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]


    assignment = Assignment.query.get_or_404(assignment_id)
    course = Course.query.get_or_404(assignment.course_id)

    # Authorization check for instructors
    if role == "instructor":
        if course.instructor_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

    latest_submission = None

    if role == "student":
        latest_submission = (
            AssignmentSubmission.query
            .filter_by(
                assignment_id=assignment_id,
                student_id=user_id
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
        "reference_file_name": assignment.reference_file_name,
        "reference_file_url": assignment.reference_file_url,

        "latest_submission": {
            "submission_id": latest_submission.id,
            "student_id": latest_submission.student_id,
            "version": latest_submission.version,
            "submission_text": latest_submission.submission_text,
            "submission_file": latest_submission.submission_file,
            "submission_file_url": latest_submission.submission_file_url,
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

@assignments_bp.route("/course/<int:course_id>", methods=["POST"])
@instructor_required
def create_assignment(course_id):

    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    data = request.form

    # get optional file
    file = request.files.get("reference_file")

    file_url = None
    file_name = None

    try:
        if file:
            upload_result = cloudinary.uploader.upload(
                file,
                resource_type="auto",
                folder="assignment_references"
            )

            file_url = upload_result["secure_url"]
            file_name = file.filename

        assignment = Assignment(
            course_id=course_id,
            instructor_id=instructor_id,
            title=data["title"],
            description=data.get("description"),
            due_date=datetime.fromisoformat(data["due_date"]) if data.get("due_date") else None,
            max_score=float(data.get("max_score", 100)),
            allow_text_submission=data.get("allow_text_submission", "true").lower() == "true",
            allow_file_submission=data.get("allow_file_submission", "true").lower() == "true",
            reference_file_name=file_name,
            reference_file_url=file_url,
        )

        db.session.add(assignment)
        db.session.commit()

        return jsonify({
            "message": "Assignment created",
            "assignment_id": assignment.id,
            "reference_file_url": file_url
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

    file_url = None
    file_name = None
    text_submission = None

    # Case 1: JSON submission (text submission only)
    if request.is_json:
        data = request.get_json()
        text_submission = data.get("text_content")

    # Case 2: multipart form submission (file + text)
    else:
        text_submission = request.form.get("text_content")
        file = request.files.get("file")

        if file:
            if not assignment.allow_file_submission:
                return jsonify({"error": "File submissions are not allowed for this assignment"}), 400

            try:
                upload_result = cloudinary.uploader.upload(
                    file,
                    resource_type="auto",
                    folder="assignment_submissions",
                    public_id=f"student_{student_id}_assignment_{assignment_id}_v{next_version}"
                )

                file_url = upload_result["secure_url"]
                file_name = file.filename

            except Exception as e:
                return jsonify({
                    "error": "File upload failed",
                    "details": str(e)
                }), 500
            
    # Prevent Empty submission        
    if not text_submission and not file_url:
        return jsonify({"error": "Submission cannot be empty"}), 400

    submission = AssignmentSubmission(
        assignment_id = assignment_id,
        student_id = student_id,
        submission_text = text_submission,
        submission_file = file_name,
        submission_file_url = file_url,
        submitted_at = datetime.now(timezone.utc),
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
    submission.graded_at =  datetime.now(timezone.utc)
    submission.status = "submitted"

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
            func.max(AssignmentSubmission.version).label("latest_version")
        )
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .group_by(AssignmentSubmission.student_id)
        .subquery()
    )

    # Main query: Enrollment + User + Latest Submission
    results = (
        db.session.query(Enrollment, User, AssignmentSubmission)
        .join(User, Enrollment.student_id == User.id) 
        .outerjoin(
            latest_versions,
            Enrollment.student_id == latest_versions.c.student_id
        )
        .outerjoin(
            AssignmentSubmission,
            and_(
                AssignmentSubmission.student_id == Enrollment.student_id,
                AssignmentSubmission.assignment_id == assignment_id,
                AssignmentSubmission.version == latest_versions.c.latest_version
            )
        )
        .filter(Enrollment.course_id == course.id)
        .all()
    )

    return jsonify({
        "assignment_id": assignment_id,
        "max_score": assignment.max_score,
        "students": [
            {
                "student_id": e.student_id,
                "first_name": u.f_name,
                "last_name": u.l_name,
                "email": u.email,
                "submission_id": s.id if s else None,
                "version": s.version if s else None,
                "submission_text": s.submission_text if s else None,
                "submission_file": s.submission_file if s else None,
                "score": s.score if s else None,
                "feedback": s.feedback if s else None,
                "status": s.status if s else "not_submitted",
                "submitted_at": s.submitted_at.isoformat() if s and s.submitted_at else None,
            }
            for e, u, s in results
        ]
    }), 200

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