from extensions import db
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.assignment import Assignment
from models.user import User
from models.course import Course
from models.course_material import CourseMaterial
from utils.decorators import instructor_required

courses_bp = Blueprint("courses", __name__, url_prefix="/courses")

@courses_bp.route("", methods=["POST"])
@instructor_required
def create_course():
    data = request.get_json()
    title = data.get("title")
    instructor_id = data.get("instructor_id")

    if not title or not instructor_id:
        return jsonify({"error": "Title and instructor_id are required"}),400
    
    instructor = User.query.get(instructor_id)
    if not instructor or instructor.role != "instructor":
        return jsonify({"error": "Invalid instructor_id"}), 400
    
    course = Course(title=title, instructor_id=instructor_id)
    db.session.add(course)
    db.session.commit()
    return jsonify({"message": "Course created", "course_id": course.id})


@courses_bp.route("/<int:course_id>/material", methods=["POST"])
@instructor_required
def upload_material(course_id):
    data = request.get_json()
    content = data.get("content")
    source_name = data.get("source_name", "Unkown Source")

    if not content:
        return jsonify({"error": "Content is required"}), 400
    
    # Check course exists
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    
    material = CourseMaterial(course_id=course_id, content=content, source_name=source_name)
    db.session.add(material)
    db.session.commit()
    return jsonify({"message": "Material uploaded", "material_id": material.id})

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