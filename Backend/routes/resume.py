import os
import uuid
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from extensions import db
from models import Resume, Notification
from services.auth_service import token_required, record_activity
from services.pdf_service import generate_resume_pdf

resume_bp = Blueprint("resume", __name__, url_prefix="/api/resume")

@resume_bp.route("", methods=["GET"])
@token_required
def get_resume(current_user):
    resume = current_user.resume
    if not resume:
        # Prepopulate with profile data if available
        p = current_user.profile
        resume = Resume(
            user_id=current_user.id,
            r_name=p.name if p else "",
            r_email=p.email if p else current_user.email,
            r_degree=p.degree if p else "",
            r_location=p.location if p else "",
            r_linkedin=p.linkedin if p else "",
            r_github=p.github if p else "",
            r_summary=p.bio if p else "",
            r_skills=", ".join(p.skills) if p and p.skills else ""
        )
        db.session.add(resume)
        db.session.commit()

    return jsonify(resume.to_dict()), 200


@resume_bp.route("", methods=["PUT"])
@token_required
def update_resume(current_user):
    data = request.get_json() or {}
    resume = current_user.resume
    if not resume:
        resume = Resume(user_id=current_user.id)
        db.session.add(resume)

    # Update fields with user data
    fields_map = {
        "rName": "r_name",
        "rEmail": "r_email",
        "rPhone": "r_phone",
        "rLocation": "r_location",
        "rLinkedin": "r_linkedin",
        "rGithub": "r_github",
        "rDegree": "r_degree",
        "rCollege": "r_college",
        "rGraduation": "r_graduation",
        "rCgpa": "r_cgpa",
        "rSummary": "r_summary",
        "rSkills": "r_skills",
        "rProjects": "r_projects",
        "rExperience": "r_experience",
        "rCertifications": "r_certifications",
        "rAchievements": "r_achievements"
    }

    for json_key, model_attr in fields_map.items():
        if json_key in data:
            setattr(resume, model_attr, str(data[json_key] or "").strip())

    record_activity(current_user.id, "resume_saved", "Saved resume details")
    db.session.commit()

    return jsonify({
        "message": "Resume details saved successfully.",
        "resume": resume.to_dict()
    }), 200


@resume_bp.route("/pdf", methods=["GET"])
@token_required
def download_resume_pdf(current_user):
    resume = current_user.resume
    if not resume:
        return jsonify({"error": "No resume found. Please save your resume details first."}), 404

    resume_data = resume.to_dict()
    pdf_buffer = generate_resume_pdf(resume_data)

    filename = f"{secure_filename(resume.r_name or 'Resume')}_Resume.pdf"
    if not filename or filename == "_Resume.pdf":
        filename = "Growvia_AI_Resume.pdf"

    return send_file(
        pdf_buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename
    )


@resume_bp.route("/photo", methods=["POST"])
@token_required
def upload_photo(current_user):
    if "photo" not in request.files:
        return jsonify({"error": "No photo file provided in request."}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "No selected file."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in current_app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error": f"Invalid image format. Allowed: {', '.join(current_app.config['ALLOWED_EXTENSIONS'])}"}), 400

    # Generate safe unique filename
    safe_name = f"user_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_path = os.path.join(current_app.config["UPLOAD_FOLDER"], safe_name)
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    file.save(upload_path)

    resume = current_user.resume
    if not resume:
        resume = Resume(user_id=current_user.id)
        db.session.add(resume)

    resume.photo_path = f"/uploads/{safe_name}"
    db.session.commit()

    return jsonify({
        "message": "Photo uploaded successfully.",
        "photo_url": resume.photo_path
    }), 200
