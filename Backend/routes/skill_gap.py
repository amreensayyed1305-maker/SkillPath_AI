from flask import Blueprint, request, jsonify
from extensions import db
from models import SkillRating
from services.auth_service import token_optional, token_required, record_activity
from services.recommendation_service import analyze_skill_gaps, get_career_recommendations, ROLE_SKILLS_MAP

skill_gap_bp = Blueprint("skill_gap", __name__, url_prefix="/api")

@skill_gap_bp.route("/skill-gaps", methods=["GET"])
@token_optional
def get_skill_gaps(current_user=None):
    role = request.args.get("role", "Frontend Developer").strip()
    if role not in ROLE_SKILLS_MAP:
        role = "Frontend Developer"

    user_id = current_user.id if current_user else None
    analysis = analyze_skill_gaps(user_id, role)
    return jsonify(analysis), 200


@skill_gap_bp.route("/skill-gaps", methods=["POST"])
@token_required
def submit_skill_ratings(current_user):
    data = request.get_json() or {}
    role = data.get("role", "").strip()
    ratings = data.get("ratings", {}) # dict of {skill_name: int_rating}

    if not role or role not in ROLE_SKILLS_MAP:
        return jsonify({"error": f"Valid role required. Available: {list(ROLE_SKILLS_MAP.keys())}"}), 400

    if not isinstance(ratings, dict):
        return jsonify({"error": "Ratings must be a dictionary of skill to rating (0-5)."}), 400

    try:
        for skill_name, val in ratings.items():
            try:
                numeric_val = max(0, min(5, int(val)))
            except (ValueError, TypeError):
                numeric_val = 0

            existing = SkillRating.query.filter_by(
                user_id=current_user.id,
                role_name=role,
                skill_name=skill_name
            ).first()

            if existing:
                existing.rating_value = numeric_val
            else:
                r_record = SkillRating(
                    user_id=current_user.id,
                    role_name=role,
                    skill_name=skill_name,
                    rating_value=numeric_val
                )
                db.session.add(r_record)

        db.session.commit()
        record_activity(current_user.id, "skill_check", f"Completed skill check for {role}")

        analysis = analyze_skill_gaps(current_user.id, role)
        return jsonify({
            "message": "Skill assessment ratings saved successfully.",
            "analysis": analysis
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save skill assessment: {str(e)}"}), 500


@skill_gap_bp.route("/recommendations", methods=["GET"])
@token_optional
def get_recommendations(current_user=None):
    recs = get_career_recommendations(current_user)
    return jsonify(recs), 200
