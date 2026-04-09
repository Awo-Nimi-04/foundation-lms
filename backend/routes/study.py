import os
import json
import re
from openai import OpenAI
from extensions import db
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.course import Course
from models.course_material import CourseMaterial
from models.enrollment import Enrollment
from models.student_progress import StudentProgress, StudyMessage
from utils.ai_helpers import chunk_text

study_bp = Blueprint("study", __name__, url_prefix="/study")

gemini_client =  OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    )

def get_relevant_chunks(chunks, question, top_k=3):
    return sorted(
        chunks,
        key=lambda c: sum(word.lower() in c.lower() for word in question.split()),
        reverse=True
    )[:top_k]

@study_bp.route("/<int:course_id>", methods=["POST"])
@jwt_required()
def study(course_id):
    """
    Student sends a question for a specific course material.
    Returns AI-generated answer based on that material only.
    """
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    if role != "student":
        return jsonify({"error": "Unauthorized. Feature only available to students"}), 403
    
    enrollment = Enrollment.query.filter_by(
        student_id = user_id,
        course_id = course_id
    ).first()

    if not enrollment:
        return jsonify({"error": "Unauthorized. This is only fir students enrolled in this course."}), 403

    data = request.get_json()
    question = data.get("question")
    material_id = data.get("material_id")

    if not question or not material_id:
        return jsonify({"error": "Question and material_id are required"}), 400
    


    material = CourseMaterial.query.filter_by(
        id=material_id,
        course_id=course_id
    ).first()

    if not material:
        return jsonify({"error": "Material not found"}), 404

    if not material.extracted_text:
        return jsonify({"error": "No text available for this material"}), 400
    
    user_msg = StudyMessage(
        student_id=user_id,
        course_id=course_id,
        material_id=material.id,
        role="user",
        content=question,
        created_at=datetime.now()
    )

    db.session.add(user_msg)

    chunks = chunk_text(material.extracted_text)
    selected_chunks = get_relevant_chunks(chunks, question, top_k=3)

    context = "\n\n".join(selected_chunks)

    formatted_materials = f"\n--- Source: material_{material.id} ---\n{context}\n"

    messages = [
                        {
                "role": "system",
                "content": (
                    "You are an expert university instructor.\n"
                    "You answer questions ONLY using the provided course material.\n\n"

                    "CRITICAL RULES:\n"
                    "- Use ONLY the provided material.\n"
                    "- Do NOT use outside knowledge.\n"
                    "- If the material does not contain enough information, explicitly state that.\n\n"

                    "Difficulty rubric:\n"
                    "- easy: direct recall, definitions, single concept\n"
                    "- medium: requires combining concepts or explanation\n"
                    "- hard: multi-step reasoning, synthesis, inference\n\n"

                    "OUTPUT REQUIREMENTS:\n"
                    "- Return ONLY valid JSON\n"
                    "- No markdown\n"
                    "- No explanations outside JSON\n"
                    "- No extra keys\n\n"

                    "JSON FORMAT (always use this exact schema):\n"
                    "{\n"
                    '  \"answer\": \"string\",\n'
                    '  \"difficulty\": \"easy | medium | hard\"\n'
                    "}\n\n"

                    "IMPORTANT:\n"
                    "- If the answer is not supported by the material, set:\n"
                    "\"answer\": \"Not enough information in the provided material to answer this question.\"\n"
                    "- You MUST still return valid JSON in the same format."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Course Material:\n{formatted_materials}\n\n"
                    f"Question:\n{question}"
                )
            }
        ]


    try:
        response = gemini_client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=messages,
            temperature=0.2,
            max_tokens=800,
        )

        content = response.choices[0].message.content

        if not content:
            return jsonify({
                "error": "Empty model output",
                "raw_output": ""
            }), 500

        content = content.strip()
        content = re.sub(r"```json|```", "", content).strip()

        try:
            result = json.loads(content)

        except json.JSONDecodeError:
            match = re.search(r"\{(?:[^{}]|(?R))*\}", content)

            if not match:
                return jsonify({
                    "error": "Model did not return valid JSON",
                    "raw_output": content
                }), 500

            try:
                result = json.loads(match.group())
            except json.JSONDecodeError:
                return jsonify({
                    "error": "Could not parse extracted JSON",
                    "raw_output": content
                }), 500

        if not isinstance(result, dict):
            return jsonify({
                "error": "Model output is not a JSON object",
                "raw_output": content
            }), 500

        answer = result.get("answer")
        difficulty = result.get("difficulty")

        if answer is None or difficulty is None:
            return jsonify({
                "error": "Missing required keys",
                "raw_output": result
            }), 500

        if difficulty not in ["easy", "medium", "hard"]:
            difficulty = "medium"

        ai_msg = StudyMessage(
            student_id=user_id,
            course_id=course_id,
            material_id=material.id,
            role="ai",
            content=answer,
            difficulty=difficulty,
            created_at=datetime.now()
        )

        db.session.add(ai_msg)

        delta_map = {
            "easy": 0.03,
            "medium": 0.07,
            "hard": 0.12
        }

        delta = delta_map.get(difficulty, 0.05)

        # do NOT reward if model couldn't answer
        if "Not enough information in the provided material" in answer:
            delta = 0

        existing = StudentProgress.query.filter_by(
            student_id=user_id,
            material_id=material.id,
        ).first()

        now = datetime.now(timezone.utc)
        engagement_score = None
        if not existing:
            progress = StudentProgress(
                student_id=user_id,
                course_id=course_id,
                material_id=material.id,
                mastery_score=min(delta, 1.0),
                last_accessed=now
            )
            engagement_score = progress.mastery_score
            db.session.add(progress)
        else:
            decay_factor = (1 - existing.mastery_score)
            adjusted_delta = delta * decay_factor

            existing.mastery_score = min(
                existing.mastery_score + adjusted_delta,
                1.0
            )
            existing.last_accessed = now
            engagement_score = existing.mastery_score

        db.session.commit()

        return jsonify({
            "answer": answer,
            "difficulty": difficulty,
            "engagement_score": engagement_score,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/messages/<int:material_id>", methods=["GET"])
@jwt_required()
def get_messages(material_id):
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])
    role = identity["role"]

    if role != "student":
        return jsonify({"error": "Unauthorized. Feature only for students."}), 403
    

    material = CourseMaterial.query.get_or_404(material_id)

    enrollment = Enrollment.query.filter_by(
        student_id = user_id,
        course_id = material.course_id
    )

    if not enrollment:
        return jsonify({"error": "This student does not have access to this course and its features."}), 403
    
    progress = StudentProgress.query.filter_by(
        student_id = user_id,
        material_id = material_id
    ).first()



    messages = (
        StudyMessage.query
        .filter_by(student_id=user_id, material_id=material_id)
        .order_by(StudyMessage.created_at.asc())
        .all()
    )

    return jsonify({
        "engagement_score": progress.mastery_score if progress else None,
        "messages":[
            {
                "role": m.role,
                "content": m.content,
                "difficulty": m.difficulty,
            }
            for m in messages
        ]
    })

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