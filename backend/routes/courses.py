import cloudinary
import cloudinary.uploader
import json
import os
from datetime import datetime
from dateutil.parser import isoparse
from extensions import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.assignment import Assignment
from models.user import User
from models.course import Course
from models.course_material import CourseMaterial, MaterialFolder
from models.enrollment import Enrollment
from sqlalchemy.orm import joinedload
from utils.ai_helpers import extract_text_from_file
from utils.decorators import instructor_required


cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


courses_bp = Blueprint("courses", __name__, url_prefix="/courses")

@courses_bp.route("", methods=["POST"])
@instructor_required
def create_course():
    identity = json.loads(get_jwt_identity())
    instructor_id = int(identity["id"])

    # Ensure user is instructor
    instructor = User.query.get_or_404(instructor_id)
    if instructor.role != "instructor":
        return jsonify({"error": "Only instructors can create courses"}), 403

    data = request.get_json()

    title = data.get("title")
    description = data.get("description", None)
    enrollment_start = data.get("enrollment_start")
    enrollment_end = data.get("enrollment_end")

    if not title or not enrollment_start or not enrollment_end:
        return jsonify({
            "error": "title, enrollment_start, and enrollment_end are required"
        }), 400

    try:
        enrollment_start = isoparse(enrollment_start)
        enrollment_end = isoparse(enrollment_end)
    except Exception:
        return jsonify({"error": "Invalid datetime format"}), 400

    # Validation
    if enrollment_start >= enrollment_end:
        return jsonify({"error": "Enrollment start must be before end"}), 400

    # Optional but recommended
    if enrollment_end <= datetime.now():
        return jsonify({"error": "Enrollment end must be in the future"}), 400

    course = Course(
        title=title,
        description=description,
        instructor_id=instructor_id,
        enrollment_start=enrollment_start,
        enrollment_end=enrollment_end
    )

    db.session.add(course)
    db.session.commit()

    return jsonify({
        "message": "Course created",
        "course": {
            "id": course.id,
            "title": course.title,
            "enrollment_start": course.enrollment_start,
            "enrollment_end": course.enrollment_end,
            "enrollment_open": course.is_enrollment_open()
        }
    }), 201

@courses_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_courses():
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    courses = Course.query.all()

    enrollments = Enrollment.query.filter_by(student_id=user_id).all()
    enrolled_course_ids = {e.course_id for e in enrollments} if enrollments else set()

    return jsonify({
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "instructor_id": c.instructor_id,
                "enrollment_open": c.is_enrollment_open(),
                "enrollment_start": c.enrollment_start,
                "enrollment_end": c.enrollment_end,
                "is_enrolled": c.id in enrolled_course_ids
            }
            for c in courses
        ]
    }), 200

@courses_bp.route("/instructor", methods=["GET"])
@instructor_required
def get_instructor_courses():
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    user = User.query.get_or_404(user_id)

    if user.role != "instructor":
        return jsonify({"error": "Instructors only"}), 403

    courses = Course.query.filter_by(instructor_id=user_id).all()

    return jsonify({
        "courses": [
            {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "enrollment_open": c.is_enrollment_open(),
                "enrollment_start": c.enrollment_start,
                "enrollment_end": c.enrollment_end,
                "student_count": len(c.enrollments)
            }
            for c in courses
        ]
    }), 200

@courses_bp.route("/enrolled", methods=["GET"])
@jwt_required()
def get_enrolled_courses():
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    user = User.query.get_or_404(user_id)

    if user.role != "student":
        return jsonify({"error": "Students only"}), 403

    enrollments = (
        Enrollment.query
        .filter_by(student_id=user_id)
        .join(Course)
        .all()
    )

    return jsonify({
        "courses": [
            {
                "id": e.course.id,
                "title": e.course.title,
                "instructor_id": e.course.instructor_id,
                "enrolled_at": e.enrolled_at,
                "enrollment_open": e.course.is_enrollment_open(),
                "final_grade": e.final_grade,
                "status": e.status
            }
            for e in enrollments
        ]
    }), 200

@courses_bp.route("/<int:course_id>/folder", methods=["POST"])
@instructor_required
def create_folder(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    course = Course.query.get_or_404(course_id)

    if course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403
    
    data = request.get_json() or {}
    folder_name = data.get("name")

    if not folder_name or folder_name.strip() == "":
        return jsonify({"message": "Folder name is required"}), 400
    
    existing = MaterialFolder.query.filter_by(
        course_id=course_id,
        name=folder_name
    ).first()

    if existing:
        return jsonify({"message": "Folder already exists"}), 400
    
    folder = MaterialFolder(
        name=folder_name,
        course_id=course_id
    )

    db.session.add(folder)
    db.session.commit()

    return jsonify({
        "message": "Folder created",
        "id": folder.id,
        "name": folder.name,
        "course_id": folder.course_id,
    }), 201

@courses_bp.route("/folders/<int:folder_id>", methods=["PATCH"])
@instructor_required
def rename_folder(folder_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    folder = MaterialFolder.query.get_or_404(folder_id)
    course = Course.query.get_or_404(folder.course_id)

    if course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403

    data = request.get_json() or {}
    new_name = data.get("name")

    if not new_name or new_name.strip() == "":
        return jsonify({"message": "Folder name is required"}), 400

    existing = MaterialFolder.query.filter_by(
        course_id=folder.course_id,
        name=new_name
    ).first()

    if existing:
        return jsonify({"message": "Folder already exists"}), 400

    folder.name = new_name
    db.session.commit()

    return jsonify({
        "message": "Folder renamed",
        "id": folder.id,
        "name": folder.name
    }), 200

@courses_bp.route("/folders/<int:folder_id>", methods=["DELETE"])
@instructor_required
def delete_folder(folder_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    folder = MaterialFolder.query.get_or_404(folder_id)
    course = Course.query.get_or_404(folder.course_id)

    if course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403

    materials = CourseMaterial.query.filter_by(folder_id=folder_id).all()

    for m in materials:
        m.folder_id = None

    db.session.delete(folder)
    db.session.commit()

    return jsonify({
        "message": "Folder deleted",
        "id": folder_id
    }), 200

@courses_bp.route("/materials/<int:material_id>", methods=["DELETE"])
@instructor_required
def delete_material(material_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    material = CourseMaterial.query.get_or_404(material_id)

    course = Course.query.get_or_404(material.course_id)

    if course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403

    db.session.delete(material)
    db.session.commit()

    return jsonify({
        "message": "Material deleted",
        "id": material_id
    }), 200

@courses_bp.route("/<int:course_id>/upload_material", methods=["POST"])
@instructor_required
def upload_material(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    course = Course.query.get_or_404(course_id)

    if course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403

    file = request.files.get("file")
    folder_id = request.form.get("folder_id")

    if folder_id:
        folder_id = int(folder_id)
        folder = MaterialFolder.query.get(folder_id)

        if not folder or folder.course_id != course_id:
            return jsonify({"error": "Invalid folder"}), 400

    if not file:
        return jsonify({"error": "No file"}), 400

    try:
        extracted_text = extract_text_from_file(file, file.filename)

        file.stream.seek(0)

        upload_result = cloudinary.uploader.upload(
            file,
            resource_type="auto",
            folder="course_materials"
        )

        material = CourseMaterial(
            course_id=course_id,
            folder_id=folder_id if folder_id else None,
            file_name=file.filename,
            file_url=upload_result["secure_url"],
            extracted_text=extracted_text
        )

        db.session.add(material)
        db.session.commit()

        return jsonify({
            "id": material.id,
            "file_name": material.file_name,
            "file_url": material.file_url
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@courses_bp.route("/<int:course_id>/assignments", methods=["GET"])
@jwt_required()
def get_course_assignments(course_id):

    assignments = Assignment.query.filter_by(course_id = course_id).all()

    return jsonify([
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_score": a.max_score
        } 
        for a in assignments
    ]) 

@courses_bp.route("/<int:course_id>/course_materials", methods=["GET"])
@jwt_required()
def get_all_course_materials(course_id):
    identity = json.loads(get_jwt_identity())
    role = identity["role"]
    user_id = int(identity["id"])

    course = Course.query.get_or_404(course_id)

    if role == "instructor" and course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor!"}), 403

    if role == "student":
        enrollment = Enrollment.query.filter_by(
            course_id=course_id,
            student_id=user_id
        ).first()

        if not enrollment:
            return jsonify({"message": "Unauthorized student!"}), 403

    course_materials = CourseMaterial.query.filter_by(course_id=course_id).all()

    materials_response = []

    for material in course_materials:
        materials_response.append({
            "id": material.id,
            "file_name": material.file_name,
            "file_url": material.file_url,
            "folder_id": material.folder_id 
        })

    return jsonify({
        "course_materials": materials_response
    }), 200

@courses_bp.route("/<int:course_id>/files", methods=["GET"])
@jwt_required()
def get_organized_course_materials(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    course = Course.query.get_or_404(course_id)

    if role == "instructor" and course.instructor_id != user_id:
        return jsonify({"message": "Unauthorized instructor"}), 403

    folders = MaterialFolder.query.filter_by(course_id=course_id).all()
    folder_map = {}

    for folder in folders:
        folder_map[folder.id] = {
            "id": folder.id,
            "name": folder.name,
            "materials": []
        }
    uncategorized = []
    materials = CourseMaterial.query.filter_by(course_id=course_id).all()

    for m in materials:
        material_data = {
            "id": m.id,
            "file_name": m.file_name,
            "file_url": m.file_url,
            "folder_id": m.folder_id
        }

        if m.folder_id and m.folder_id in folder_map:
            folder_map[m.folder_id]["materials"].append(material_data)
        else:
            uncategorized.append(material_data)
    
    return jsonify({
        "folders": list(folder_map.values()),
        "uncategorized": uncategorized
    }), 200

@courses_bp.route("/<int:course_id>/enroll", methods=["POST"])
@jwt_required()
def enroll(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    user = User.query.get_or_404(user_id)

    if user.role != "student":
        return jsonify({"error": "Only students can enroll"}), 403

    course = Course.query.get_or_404(course_id)

    # check if course registration window is open
    if not course.is_enrollment_open():
        return jsonify({
            "error": "Enrollment is closed",
            "enrollment_start": course.enrollment_start,
            "enrollment_end": course.enrollment_end
        }), 403

    # prevent duplicate enrollment
    existing = Enrollment.query.filter_by(
        student_id=user_id,
        course_id=course_id
    ).first()

    if existing:
        return jsonify({
            "message": "Already enrolled",
            "enrollment_id": existing.id
        }), 200

    enrollment = Enrollment(
        student_id=user_id,
        course_id=course_id
    )

    db.session.add(enrollment)
    db.session.commit()

    return jsonify({
        "message": "Enrolled successfully",
        "enrollment_id": enrollment.id
    }), 201

@courses_bp.route("/<int:course_id>/course_enrollees", methods=['GET'])
@jwt_required()
def get_students_for_course(course_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]


    course = Course.query.get_or_404(course_id)
    if role == "instructor":
        if course.instructor_id != user_id:
            return jsonify({"message": "Unauthorized instructor"}), 403
    else:
        return jsonify({"message": "Endpoint currently useless for students"}), 400

    enrollments = (
        Enrollment.query
        .options(joinedload(Enrollment.student))
        .filter_by(course_id=course_id)
        .all()
    )

    return jsonify({
        "course_id": course_id,
        "students": [
            {
                "student_id": e.student.id,
                "email": e.student.email,
                "status": e.status,
                "final_grade": e.final_grade,
                "enrolled_at": e.enrolled_at,
            }
            for e in enrollments
        ]
    }), 200

@courses_bp.route("/<int:course_id>/enrollment-period", methods=["PATCH"])
@instructor_required
def update_enrollment_period(course_id):
    course = Course.query.get_or_404(course_id)
    data = request.get_json()

    new_start = datetime.fromisoformat(data["enrollment_start"])
    new_end = datetime.fromisoformat(data["enrollment_end"])

    if new_start >= new_end:
        return jsonify({"error": "Start must be before end"}), 400

    # Optional: enforce future windows only
    if new_end < datetime.now():
        return jsonify({"error": "End date must be in the future"}), 400

    course.enrollment_start = new_start
    course.enrollment_end = new_end

    db.session.commit()

    return jsonify({
        "message": "Enrollment period updated",
        "enrollment_start": course.enrollment_start,
        "enrollment_end": course.enrollment_end
    })