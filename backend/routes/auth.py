import os
import cloudinary
import json
import random
from mailjet_rest import Client
import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint
from flask import request, jsonify
from flask_bcrypt import Bcrypt
from extensions import db
from models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.validation import validate_email, validate_password

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

bcrypt = Bcrypt()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def generate_otp():
    return str(random.randint(100000, 999999))

def generate_verification_token():
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    return token, expires

def send_verification_email(user, token):
    verify_url = f"https://foundation-lms-v6pb.vercel.app/verify-email?token={token}"

    try:
        api_key = os.environ.get("MAILJET_API_KEY")
        secret_key = os.environ.get("MAILJET_SECRET_KEY")

        print("Creating Mailjet client...")

        mailjet = Client(
            auth=(api_key, secret_key),
            version='v3.1'
        )

        print("Client created")

        data = {
            'Messages': [
                {
                    "From": {
                        "Email": "nimi2004div@gmail.com",
                        "Name": "Foundation LMS"
                    },
                    "To": [
                        {
                            "Email": user.email,
                            "Name": f"{user.f_name} {user.l_name}"
                        }
                    ],
                    "Subject": "Verify Your Email",
                    "HTMLPart": f"""
                        <h2>Welcome!</h2>
                        <a href="{verify_url}">Verify Email</a>
                    """
                }
            ]
        }

        result = mailjet.send.create(data=data)

    except Exception as e:
        print("🔥 ERROR:", repr(e))

def send_otp_email(user, otp):
    try:
        api_key = os.environ.get("MAILJET_API_KEY")
        secret_key = os.environ.get("MAILJET_SECRET_KEY")

        mailjet = Client(
            auth=(api_key, secret_key),
            version='v3.1'
        )

        data = {
            'Messages': [
                {
                    "From": {
                        "Email": "nimi2004div@gmail.com",
                        "Name": "Foundation LMS"
                    },
                    "To": [
                        {
                            "Email": user.email,
                            "Name": f"{user.f_name} {user.l_name}"
                        }
                    ],
                    "Subject": "Your OTP Code",
                    "HTMLPart": f"""
                        <h2>Your OTP Code</h2>
                        <p style="font-size:20px;">
                            <b>{otp}</b>
                        </p>
                        <p>This code expires in 5 minutes.</p>
                    """
                }
            ]
        }

        mailjet.send.create(data=data)

    except Exception as e:
        print("🔥 EMAIL ERROR:", repr(e))

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    first_name = data.get("fname")
    last_name = data.get("lname")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    email = email.lower()

    if not all([first_name, last_name, email, password, role]):
        return jsonify({"error": "First name, last name, email, password, and role are required"}), 400
    
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not validate_password(password):
        return jsonify({"error": "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    
    token, expires = generate_verification_token()
    
    user = User(
        f_name=first_name, 
        l_name=last_name, 
        email=email, 
        role=role,
        is_verified=False,
        verification_token=token,
        verification_token_expires=expires
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    send_verification_email(user, token)

    return jsonify({
        "message": "User registered successfully. Please check your email to verify your account."
    }), 201

@auth_bp.route("/verify-email", methods=["GET"])
def verify_email():
    token = request.args.get("token")

    if not token:
        return jsonify({"error": "Missing token"}), 400

    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({"error": "Invalid token"}), 400

    if user.verification_token_expires < datetime.now(timezone.utc):
        return jsonify({"error": "Token expired"}), 400

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None

    db.session.commit()

    return jsonify({"message": "Email verified successfully"})

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    if not user.is_verified:
        return jsonify({"message": "Not verified"}), 500
    
    access_token = create_access_token(
        identity=json.dumps({"id": str(user.id), "role": user.role}),
        expires_delta=timedelta(minutes=180)
    )
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

@auth_bp.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json()
    email = data.get("email")

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_verified:
        return jsonify({"message": "Account already verified"}), 200

    token, expires = generate_verification_token()

    user.verification_token = token
    user.verification_token_expires = expires

    db.session.commit()

    send_verification_email(user, token)

    return jsonify({"message": "Verification email resent"})

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

@auth_bp.route("/update_password", methods=["PATCH"])
@jwt_required()
def update_password():
    identity = json.loads(get_jwt_identity())
    user_id = identity["id"]

    user = User.query.get_or_404(user_id)

    old_password = request.form.get("current_password")
    new_password = request.form.get("new_password")

    if not new_password:
        return jsonify({"error": "No update data provided"}), 400
    
    if new_password:
        if not old_password:
            return jsonify({"error": "Current password required."}), 400
        
        if not user.check_password(old_password):
            return jsonify({"error": "Current password incorrect."}), 400

        user.set_password(new_password)
        
    db.session.commit()

    return jsonify({
        "id": user.id,
        "message": "User profile updated successfully",
    }), 200

@auth_bp.route("/send-otp", methods=["GET"])
@jwt_required()
def send_otp():
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    user = User.query.get_or_404(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    otp = generate_otp()

    user.otp_hash = bcrypt.generate_password_hash(otp).decode('utf-8')
    user.otp_expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    db.session.commit()

    send_otp_email(user, otp)

    return jsonify({"message": "OTP sent to email"}), 200

@auth_bp.route("/verify-otp", methods=["POST"])
@jwt_required()
def verify_otp():
    identity = json.loads(get_jwt_identity())
    user_id = int(identity["id"])

    data = request.get_json()
    otp = data.get("otp")

    user = User.query.get_or_404(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.otp_hash:
        return jsonify({"error": "No OTP requested"}), 400
    now = datetime.now(timezone.utc)

    expires = user.otp_expires

    # convert DB value to UTC-aware if needed
    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if not expires:
        return jsonify({"error": "OTP not found"}), 400

    if now > expires:
        return jsonify({"error": "OTP expired"}), 400

    if not bcrypt.check_password_hash(user.otp_hash, otp):
        return jsonify({"error": "Invalid OTP"}), 400
    
    user.otp_expires = None
    user.otp_hash = None

    db.session.commit()

    return jsonify({"message": "OTP verified successfully"}), 200

@auth_bp.route("/otp-login", methods=["POST"])
def otp_login():
    data = request.get_json()

    email = data.get("email")

    if not email:
        return jsonify({"error": "No email provided"}), 400
    
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "No user found with this email"}), 404
    
    otp = generate_otp()

    user.otp_hash = bcrypt.generate_password_hash(otp).decode('utf-8')
    user.otp_expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    db.session.commit()

    send_otp_email(user, otp)

    return jsonify({"message": "OTP sent to email"}), 200

@auth_bp.route("verify-otp-login", methods=["POST"])
def veryify_otp_login():
    data = request.get_json()

    email = data.get("email")
    otp = data.get("otp")

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "No user found with this email"}), 404
    
    if not otp:
        return jsonify({"error": "No OTP provided"}), 400
    
    if not user.otp_hash:
        return jsonify({"error": "No OTP requested"}), 400
    
    now = datetime.now(timezone.utc)

    expires = user.otp_expires

    if expires and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if not expires:
        return jsonify({"error": "OTP not requested"}), 400

    if now > expires:
        return jsonify({"error": "OTP expired"}), 400

    if not bcrypt.check_password_hash(user.otp_hash, otp):
        return jsonify({"error": "Incorrect OTP"}), 400
    
    user.otp_expires = None
    user.otp_hash = None

    db.session.commit()

    access_token = create_access_token(
        identity=json.dumps({"id": str(user.id), "role": user.role}),
        expires_delta=timedelta(minutes=180)
    )
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


@auth_bp.route("/update_user_photo", methods=["PATCH"])
@jwt_required()
def update_photo():
    identity = json.loads(get_jwt_identity())
    user_id = identity["id"]

    user = User.query.get_or_404(user_id)

    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No update data provided"}), 400

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
        
        access_token = create_access_token(
            identity=json.dumps({"id": str(user.id), "role": user.role}),
            expires_delta=timedelta(minutes=180)
        )
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