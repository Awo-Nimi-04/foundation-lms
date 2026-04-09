import os
import cloudinary
import json
from flask import Blueprint
from flask import request, jsonify
from extensions import db
from models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.validation import validate_email, validate_password

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    first_name = data.get("fname")
    last_name = data.get("lname")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([first_name, last_name, email, password, role]):
        return jsonify({"error": "First name, last name, email, password, and role are required"}), 400
    
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not validate_password(password):
        return jsonify({"error": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    
    user = User(
        f_name=first_name, 
        l_name=last_name, 
        email=email, 
        role=role
    )
    user.set_password(password)
    access_token = create_access_token(identity=json.dumps({"id": str(user.id), "role": user.role}))
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully", "user_id": user.id, "role": user.role, "access_token": access_token})

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    access_token = create_access_token(identity=json.dumps({"id": str(user.id), "role": user.role}))
    return jsonify({
            "access_token": access_token,
            "user": {
                "role": user.role,
                "id": user.id,
                "email": user.email,
                "first_name": user.f_name,
                "last_name": user.l_name,
                "photo": user.profile_photo_url,
            }
        })

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():

    identity = json.loads(get_jwt_identity())
    user_id = identity["id"]

    user = User.query.get_or_404(user_id)

    return jsonify({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "first_name": user.f_name,
        "last_name": user.l_name,
    })

@auth_bp.route("/edit_user", methods=["PATCH"])
@jwt_required()
def update_user():
    identity = json.loads(get_jwt_identity())
    user_id = identity["id"]

    user = User.query.get_or_404(user_id)

    file = request.files.get("file")
    old_password = request.form.get("current_password")
    new_password = request.form.get("new_password")

    if not file and not new_password:
        return jsonify({"error": "No update data provided"}), 400
    
    if new_password:
        if not old_password:
            return jsonify({"error": "Current password required."}), 400
        
        if not user.check_password(old_password):
            return jsonify({"error": "Current password incorrect."}), 400

        user.set_password(new_password)

    if file:
        try:
            upload_result = cloudinary.uploader.upload(
                file,
                resource_type="auto",
                folder="profile_photos"
            )

            user.profile_photo_url = upload_result["secure_url"]

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        
    access_token = create_access_token(identity=json.dumps({"id": str(user.id), "role": user.role}))
    db.session.commit()

    return jsonify({
        "id": user.id,
        "message": "User profile updated successfully",
        "access_token": access_token,
        "user": {
                "role": user.role,
                "id": user.id,
                "email": user.email,
                "first_name": user.f_name,
                "last_name": user.l_name,
                "photo": user.profile_photo_url,
        },
    }), 200