import json
from flask import Blueprint
from flask import request, jsonify
from extensions import db
from models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.validation import validate_email, validate_password

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([email, password, role]):
        return jsonify({"error": "Email, password, and role are required"}), 400
    
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not validate_password(password):
        return jsonify({"error": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    
    user = User(email=email, role=role)
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
        "role": user.role
    })