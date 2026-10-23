import re
from flask import Blueprint, request, jsonify
from extensions import db
from models import UserProfile, Project, Certification
from services.auth_service import token_required, record_activity

portfolio_bp = Blueprint("portfolio", __name__, url_prefix="/api")

def is_valid_url(url_string):
    if not url_string:
        return True
    pattern = re.compile(
        r"^(?:http|https)://" # http:// or https://
        r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|" # domain...
        r"localhost|" # localhost...
        r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})" # ...or ip
        r"(?::\d+)?" # optional port
        r"(?:/?|[/?]\S+)$", re.IGNORECASE
    )
    return bool(pattern.match(url_string.strip()))

# --- PROFILE ---

@portfolio_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id, email=current_user.email)
        db.session.add(profile)
        db.session.commit()
    return jsonify(profile.to_dict()), 200


@portfolio_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id, email=current_user.email)
        db.session.add(profile)

    if "name" in data:
        profile.name = str(data["name"]).strip()
    if "degree" in data:
        profile.degree = str(data["degree"]).strip()
    if "year" in data:
        profile.year = str(data["year"]).strip()
    if "email" in data:
        profile.email = str(data["email"]).strip()
    if "location" in data:
        profile.location = str(data["location"]).strip()
    if "bio" in data:
        profile.bio = str(data["bio"]).strip()
    if "github" in data:
        gh = str(data["github"]).strip()
        if gh and not is_valid_url(gh):
            return jsonify({"error": "GitHub URL must be a valid http:// or https:// link."}), 400
        profile.github = gh
    if "linkedin" in data:
        li = str(data["linkedin"]).strip()
        if li and not is_valid_url(li):
            return jsonify({"error": "LinkedIn URL must be a valid http:// or https:// link."}), 400
        profile.linkedin = li
    if "skills" in data:
        skills = data["skills"]
        if isinstance(skills, list):
            profile.skills = [str(s).strip() for s in skills if str(s).strip()]
        elif isinstance(skills, str):
            profile.skills = [s.strip() for s in skills.split(",") if s.strip()]

    record_activity(current_user.id, "profile_update", "Updated professional profile")
    db.session.commit()
    return jsonify({
        "message": "Profile updated successfully.",
        "profile": profile.to_dict()
    }), 200


# --- PROJECTS ---

@portfolio_bp.route("/projects", methods=["GET"])
@token_required
def get_projects(current_user):
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()
    return jsonify({
        "projects": [p.to_dict() for p in projects],
        "count": len(projects)
    }), 200


@portfolio_bp.route("/projects", methods=["POST"])
@token_required
def add_project(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    link = data.get("link", "").strip()
    technologies = data.get("technologies", "").strip()

    if not title:
        return jsonify({"error": "Project title is required."}), 400
    if not description:
        return jsonify({"error": "Project description is required."}), 400
    if link and not is_valid_url(link):
        return jsonify({"error": "Project link must be a valid http:// or https:// URL."}), 400

    proj = Project(
        user_id=current_user.id,
        title=title,
        description=description,
        link=link,
        technologies=technologies
    )
    db.session.add(proj)
    record_activity(current_user.id, "project_added", f"Added project '{title}'")
    db.session.commit()

    return jsonify({
        "message": "Project added successfully.",
        "project": proj.to_dict()
    }), 201


@portfolio_bp.route("/projects/<int:project_id>", methods=["PUT"])
@token_required
def update_project(project_id, current_user):
    proj = db.session.get(Project, project_id)
    if not proj:
        return jsonify({"error": "Project not found."}), 404
    if proj.user_id != current_user.id:
        return jsonify({"error": "Access denied. You can only edit your own projects."}), 403

    data = request.get_json() or {}
    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty."}), 400
        proj.title = title
    if "description" in data:
        desc = data["description"].strip()
        if not desc:
            return jsonify({"error": "Description cannot be empty."}), 400
        proj.description = desc
    if "link" in data:
        link = data["link"].strip()
        if link and not is_valid_url(link):
            return jsonify({"error": "Project link must be a valid URL."}), 400
        proj.link = link
    if "technologies" in data:
        proj.technologies = str(data["technologies"]).strip()

    db.session.commit()
    return jsonify({
        "message": "Project updated successfully.",
        "project": proj.to_dict()
    }), 200


@portfolio_bp.route("/projects/<int:project_id>", methods=["DELETE"])
@token_required
def delete_project(project_id, current_user):
    proj = db.session.get(Project, project_id)
    if not proj:
        return jsonify({"error": "Project not found."}), 404
    if proj.user_id != current_user.id:
        return jsonify({"error": "Access denied. You can only delete your own projects."}), 403

    db.session.delete(proj)
    db.session.commit()
    return jsonify({"message": "Project removed successfully."}), 200


# --- CERTIFICATIONS ---

@portfolio_bp.route("/certifications", methods=["GET"])
@token_required
def get_certifications(current_user):
    certs = Certification.query.filter_by(user_id=current_user.id).order_by(Certification.created_at.desc()).all()
    return jsonify({
        "certifications": [c.to_dict() for c in certs],
        "count": len(certs)
    }), 200


@portfolio_bp.route("/certifications", methods=["POST"])
@token_required
def add_certification(current_user):
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    issuer = data.get("issuer", "").strip()
    link = data.get("link", "").strip()
    issue_date = data.get("issue_date", "").strip()
    expiry_date = data.get("expiry_date", "").strip()

    if not title:
        return jsonify({"error": "Certification name is required."}), 400
    if not issuer:
        return jsonify({"error": "Issuing organization is required."}), 400
    if link and not is_valid_url(link):
        return jsonify({"error": "Certification link must be a valid http:// or https:// URL."}), 400

    cert = Certification(
        user_id=current_user.id,
        title=title,
        issuer=issuer,
        link=link,
        issue_date=issue_date,
        expiry_date=expiry_date
    )
    db.session.add(cert)
    record_activity(current_user.id, "cert_added", f"Added certificate '{title}'")
    db.session.commit()

    return jsonify({
        "message": "Certification added successfully.",
        "certification": cert.to_dict()
    }), 201


@portfolio_bp.route("/certifications/<int:cert_id>", methods=["PUT"])
@token_required
def update_certification(cert_id, current_user):
    cert = db.session.get(Certification, cert_id)
    if not cert:
        return jsonify({"error": "Certification not found."}), 404
    if cert.user_id != current_user.id:
        return jsonify({"error": "Access denied. You can only edit your own certifications."}), 403

    data = request.get_json() or {}
    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty."}), 400
        cert.title = title
    if "issuer" in data:
        issuer = data["issuer"].strip()
        if not issuer:
            return jsonify({"error": "Issuer cannot be empty."}), 400
        cert.issuer = issuer
    if "link" in data:
        link = data["link"].strip()
        if link and not is_valid_url(link):
            return jsonify({"error": "Certificate link must be a valid URL."}), 400
        cert.link = link
    if "issue_date" in data:
        cert.issue_date = str(data["issue_date"]).strip()
    if "expiry_date" in data:
        cert.expiry_date = str(data["expiry_date"]).strip()

    db.session.commit()
    return jsonify({
        "message": "Certification updated successfully.",
        "certification": cert.to_dict()
    }), 200


@portfolio_bp.route("/certifications/<int:cert_id>", methods=["DELETE"])
@token_required
def delete_certification(cert_id, current_user):
    cert = db.session.get(Certification, cert_id)
    if not cert:
        return jsonify({"error": "Certification not found."}), 404
    if cert.user_id != current_user.id:
        return jsonify({"error": "Access denied. You can only delete your own certifications."}), 403

    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Certification removed successfully."}), 200
