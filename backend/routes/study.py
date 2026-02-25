import os
import json
import re
from openai import OpenAI
from extensions import db
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.course_material import CourseMaterial
from models.student_progress import StudentProgress

study_bp = Blueprint("study", __name__, url_prefix="/study")

gemini_client =  OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

@study_bp.route("/<int:course_id>", methods=["POST"])
@jwt_required()
def study(course_id):
    """
    Student sends a question for a specific course.
    Returns AI-generated answer based on course materials.
    """

    data = request.get_json()
    question = data.get("question")

    if not question:
        return jsonify({"error": "Question is required"}), 400
    
    #1: Retrieve relevant materials
    materials = CourseMaterial.query.filter_by(course_id=course_id).all()
    if not materials:
        return jsonify({"error": "No course materials found"}), 404

    formatted_materials = ""
    for m in materials:
        formatted_materials += f"\n--- Source: {m.source_name} ---\n{m.content}\n"

    #2: Build messages for API
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert university instructor.\n"
                "Answer the student's question using ONLY the provided materials.\n\n"
                "IMPORTANT:\n"
                "After your explanation, output a JSON block containing:\n"
                "{\n"
                '  "used_sources": ["source_name1", "source_name2"]\n'
                "}\n"
                "Only include materials actually used to answer."
            )
        },
        {
            "role": "user",
            "content": (
                f"Course Material:\n{formatted_materials}\n\n"
                f"Student Question:\n{question}"
            )
        }
    ]
    try:
        response = gemini_client.chat.completions.create(
            # Ask about openAI API call in general
            model="gemini-2.5-flash",
            messages=messages,
            temperature=0.4,
            max_tokens=500, 
        )
        answer = response.choices[0].message.content.strip()
        used_sources = []

        match = re.search(r"```json\s*(\{.*?\})\s*```", answer, re.DOTALL)
        if match:
            metadata = json.loads(match.group(1))
            used_sources = metadata.get("used_sources", [])
        
        used_materials = CourseMaterial.query.filter(
            CourseMaterial.course_id == course_id,
            CourseMaterial.source_name.in_(used_sources)
        ).all()

        student_id = data.get("student_id")
        if student_id and used_materials:
            for m in used_materials:
                progress = StudentProgress.query.filter_by(
                    student_id = student_id,
                    material_id = m.id
                ).first()

                if not progress:
                    progress = StudentProgress(
                        student_id = student_id,
                        course_id = course_id,
                        material_id = m.id,
                        mastery_score = 0.2,
                        last_accessed = datetime.now()
                    )
                    db.session.add(progress)
                else:
                    progress.mastery_score = min(progress.mastery_score + 0.1, 1.0)
                    progress.last_accessed = datetime.now()
            db.session.commit()

        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@study_bp.route("/recommend/<int:student_id>/<int:course_id>")
@jwt_required()
def recommend(student_id, course_id):

    #Get all the materials for the course
    materials = CourseMaterial.query.filter_by(course_id=course_id).all()

    recommendations = []

    for m in materials:
        progress = StudentProgress.query.filter_by(
            student_id = student_id,
            material_id=m.id
        ).first()

        if not progress or progress.mastery_score < 0.7:
            recommendations.append({
                "material_id": m.id,
                "source_name": m.source_name,
                "reason": "Needs improvement"
            })

    return jsonify({
        "recommended_materials": recommendations
    })