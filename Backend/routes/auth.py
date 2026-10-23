import re
from flask import Blueprint, request, jsonify
from extensions import db
from models import User, UserProfile, Notification
from services.auth_service import create_token, token_required, record_activity

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_REGEX = r"^[^@]+@[^@]+\.[^@]+$"

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    name = data.get("name", "").strip() or "Student"
    degree = data.get("degree", "").strip() or "B.Tech CSE"
    year = data.get("year", "").strip() or "3rd Year"

    # Input validations
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({"error": "A valid email address is required."}), 400

    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "An account with this email already exists. Please log in."}), 409

    try:
        user = User(email=email, role="student")
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        profile = UserProfile(
            user_id=user.id,
            name=name,
            degree=degree,
            year=year,
            email=email
        )
        db.session.add(profile)

        # Welcome notification
        welcome_notif = Notification(
            user_id=user.id,
            title="Welcome to Growvia AI! 🚀",
            message="Start exploring careers or choose a learning track in Skill Roadmap to begin.",
            type="info"
        )
        db.session.add(welcome_notif)

        db.session.commit()

        record_activity(user.id, "account_created", "Registered for Growvia AI")
        token = create_token(user.id, user.role)

        return jsonify({
            "message": "Registration successful! Welcome to Growvia AI.",
            "token": token,
            "user": user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password. Please check your credentials."}), 401

    token = create_token(user.id, user.role)
    record_activity(user.id, "login", "Logged in to Growvia AI")

    return jsonify({
        "message": "Login successful!",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Client will discard stored token
    return jsonify({"message": "Logged out successfully."}), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return jsonify({
        "user": current_user.to_dict()
    }), 200
