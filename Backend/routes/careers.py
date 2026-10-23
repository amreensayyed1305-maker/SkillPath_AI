from flask import Blueprint, request, jsonify
from extensions import db
from models import Career, CareerSkill, CareerTask, BookmarkedCareer
from services.auth_service import token_optional, token_required

careers_bp = Blueprint("careers", __name__, url_prefix="/api/careers")

@careers_bp.route("", methods=["GET"])
@token_optional
def get_careers(current_user=None):
    query = request.args.get("q", "").strip().lower()
    category = request.args.get("category", "").strip()

    careers_query = Career.query

    if category and category.lower() != "all":
        careers_query = careers_query.filter(Career.category.ilike(category))

    careers_list = careers_query.all()
    user_id = current_user.id if current_user else None

    results = []
    for c in careers_list:
        c_dict = c.to_dict(user_id=user_id)
        # Search filter across title, description, and skills
        if query:
            searchable = (c.title + " " + c.description + " " + " ".join(c_dict["skills"])).lower()
            if query not in searchable:
                continue
        results.append(c_dict)

    return jsonify({"careers": results, "count": len(results)}), 200


@careers_bp.route("/<int:career_id>", methods=["GET"])
@token_optional
def get_career(career_id, current_user=None):
    career = db.session.get(Career, career_id)
    if not career:
        return jsonify({"error": "Career role not found"}), 404

    user_id = current_user.id if current_user else None
    return jsonify(career.to_dict(user_id=user_id)), 200


@careers_bp.route("/<int:career_id>/skills", methods=["GET"])
def get_career_skills(career_id):
    career = db.session.get(Career, career_id)
    if not career:
        return jsonify({"error": "Career role not found"}), 404

    skills = [{"id": s.id, "name": s.skill_name, "importance": s.importance} for s in career.skills]
    return jsonify({"career": career.title, "skills": skills}), 200


@careers_bp.route("/<int:career_id>/bookmark", methods=["POST"])
@token_required
def toggle_bookmark(career_id, current_user):
    career = db.session.get(Career, career_id)
    if not career:
        return jsonify({"error": "Career role not found"}), 404

    existing = BookmarkedCareer.query.filter_by(
        user_id=current_user.id,
        career_id=career_id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({"bookmarked": False, "message": f"Removed {career.title} from bookmarks."}), 200
    else:
        bm = BookmarkedCareer(user_id=current_user.id, career_id=career_id)
        db.session.add(bm)
        db.session.commit()
        return jsonify({"bookmarked": True, "message": f"Saved {career.title} to bookmarks."}), 201


@careers_bp.route("/bookmarks", methods=["GET"])
@token_required
def get_user_bookmarks(current_user):
    bookmarks = BookmarkedCareer.query.filter_by(user_id=current_user.id).all()
    bookmarked_careers = [b.career.to_dict(user_id=current_user.id) for b in bookmarks if b.career]
    return jsonify({"bookmarks": bookmarked_careers, "count": len(bookmarked_careers)}), 200
