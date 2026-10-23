import datetime
from functools import wraps
import jwt
from flask import request, jsonify, current_app
from models import User, UserActivity
from extensions import db

def create_token(user_id, role="student"):
    """Generate a JWT token for a user."""
    payload = {
        "sub": str(user_id),
        "role": str(role),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            hours=current_app.config.get("JWT_EXPIRATION_HOURS", 72)
        )
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

def decode_token(token):
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_token_from_request():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    # Also check cookie if present
    token_cookie = request.cookies.get("growvia_token")
    if token_cookie:
        return token_cookie
    return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({"error": "Authentication token missing", "authenticated": False}), 401

        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired session. Please log in again.", "authenticated": False}), 401

        try:
            user_id = int(payload["sub"])
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid token subject", "authenticated": False}), 401

        user = db.session.get(User, user_id)
        if not user:
            return jsonify({"error": "User account no longer exists.", "authenticated": False}), 401

        return f(current_user=user, *args, **kwargs)
    return decorated

def token_optional(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        user = None
        if token:
            payload = decode_token(token)
            if payload:
                try:
                    user_id = int(payload["sub"])
                    user = db.session.get(User, user_id)
                except (ValueError, TypeError):
                    user = None
        return f(current_user=user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != "admin":
            return jsonify({"error": "Administrator privileges required"}), 403
        return f(current_user=current_user, *args, **kwargs)
    return decorated

def record_activity(user_id, activity_type, description=""):
    """Record a user activity and ensure no duplicates for the same day/activity."""
    try:
        today = datetime.date.today()
        # Avoid flood of identical activities on same day
        existing = UserActivity.query.filter_by(
            user_id=user_id,
            activity_type=activity_type,
            activity_date=today
        ).first()

        if not existing:
            act = UserActivity(
                user_id=user_id,
                activity_type=activity_type,
                activity_date=today,
                description=description
            )
            db.session.add(act)
            db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.warning(f"Failed to record activity: {e}")

def calculate_user_streak(user_id):
    """
    Calculate consecutive active days up to today.
    Uses actual dated activity records in database.
    """
    dates = db.session.query(UserActivity.activity_date).filter_by(
        user_id=user_id
    ).distinct().order_by(UserActivity.activity_date.desc()).all()

    if not dates:
        return 0

    active_dates = [d[0] for d in dates]
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)

    # If user hasn't been active today or yesterday, streak is 0
    if active_dates[0] not in (today, yesterday):
        return 0

    streak = 0
    current_check = active_dates[0]

    for d in active_dates:
        if d == current_check:
            streak += 1
            current_check = current_check - datetime.timedelta(days=1)
        elif d < current_check:
            break

    return streak
