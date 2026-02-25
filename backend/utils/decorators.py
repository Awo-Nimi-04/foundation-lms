import json
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from functools import wraps

def instructor_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        identity = json.loads(get_jwt_identity())
        if identity.get("role") != "instructor":
            return jsonify({"error": "Instructor only"}), 403
        return f(*args, **kwargs)
    return wrapper