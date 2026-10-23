from flask import Blueprint, request, jsonify
from extensions import db
from models import Roadmap, RoadmapStep, UserProgress, Notification
from services.auth_service import token_optional, token_required, record_activity

roadmaps_bp = Blueprint("roadmaps", __name__, url_prefix="/api")

@roadmaps_bp.route("/roadmaps", methods=["GET"])
def get_roadmaps():
    roadmaps = Roadmap.query.all()
    return jsonify({
        "tracks": [r.track for r in roadmaps],
        "roadmaps": [r.to_dict() for r in roadmaps]
    }), 200


@roadmaps_bp.route("/roadmaps/<path:track>", methods=["GET"])
@token_optional
def get_roadmap_track(track, current_user=None):
    roadmap = Roadmap.query.filter(Roadmap.track.ilike(track)).first()
    if not roadmap:
        return jsonify({"error": f"Roadmap for track '{track}' not found"}), 404

    completed_indices = []
    if current_user:
        progress_records = UserProgress.query.filter_by(
            user_id=current_user.id,
            roadmap_track=roadmap.track,
            completed=True
        ).all()
        completed_indices = [p.step_index for p in progress_records]

    total_steps = len(roadmap.steps)
    completed_count = len(completed_indices)
    percentage = round((completed_count / total_steps) * 100) if total_steps > 0 else 0

    # Determine recommended next step
    next_step = None
    for idx, step in enumerate(roadmap.steps):
        if idx not in completed_indices:
            next_step = {
                "step_index": idx,
                "day": step.day_number,
                "title": step.title,
                "description": step.description
            }
            break

    return jsonify({
        "track": roadmap.track,
        "total_days": roadmap.total_days,
        "steps": [s.to_dict() for s in roadmap.steps],
        "completed_indices": completed_indices,
        "completed_count": completed_count,
        "progress_percentage": percentage,
        "next_step": next_step
    }), 200


@roadmaps_bp.route("/progress", methods=["GET"])
@token_required
def get_progress(current_user):
    progress_records = UserProgress.query.filter_by(user_id=current_user.id, completed=True).all()

    # Group by track
    grouped = {}
    for p in progress_records:
        if p.roadmap_track not in grouped:
            grouped[p.roadmap_track] = []
        grouped[p.roadmap_track].append(p.step_index)

    return jsonify({
        "completed": grouped,
        "total_completed": len(progress_records)
    }), 200


@roadmaps_bp.route("/progress", methods=["POST"])
@token_required
def toggle_progress(current_user):
    data = request.get_json() or {}
    track = data.get("track", "").strip()
    step_index = data.get("step_index")

    if not track or step_index is None:
        return jsonify({"error": "Fields 'track' and 'step_index' are required."}), 400

    try:
        step_index = int(step_index)
    except ValueError:
        return jsonify({"error": "step_index must be an integer."}), 400

    existing = UserProgress.query.filter_by(
        user_id=current_user.id,
        roadmap_track=track,
        step_index=step_index
    ).first()

    if existing:
        # Toggle incomplete
        db.session.delete(existing)
        db.session.commit()
        completed = False
        message = "Topic marked incomplete."
    else:
        # Toggle complete
        new_prog = UserProgress(
            user_id=current_user.id,
            roadmap_track=track,
            step_index=step_index,
            completed=True
        )
        db.session.add(new_prog)
        record_activity(current_user.id, "roadmap_step", f"Completed Day {step_index + 1} of {track}")
        db.session.commit()
        completed = True
        message = "Milestone completed! Keep up the momentum."

        # Check for track completion notification
        roadmap = Roadmap.query.filter_by(track=track).first()
        if roadmap:
            done_count = UserProgress.query.filter_by(
                user_id=current_user.id,
                roadmap_track=track,
                completed=True
            ).count()
            if done_count == len(roadmap.steps):
                notif = Notification(
                    user_id=current_user.id,
                    title=f"Roadmap Completed: {track}! 🏆",
                    message=f"Outstanding work! You finished all {len(roadmap.steps)} milestones in the {track} track.",
                    type="milestone"
                )
                db.session.add(notif)
                db.session.commit()

    # Return updated track progress
    records = UserProgress.query.filter_by(
        user_id=current_user.id,
        roadmap_track=track,
        completed=True
    ).all()
    completed_indices = [p.step_index for p in records]

    return jsonify({
        "track": track,
        "step_index": step_index,
        "completed": completed,
        "completed_indices": completed_indices,
        "message": message
    }), 200


@roadmaps_bp.route("/progress/<int:progress_id>", methods=["PATCH"])
@token_required
def update_progress(progress_id, current_user):
    prog = db.session.get(UserProgress, progress_id)
    if not prog or prog.user_id != current_user.id:
        return jsonify({"error": "Progress record not found or access denied."}), 404

    data = request.get_json() or {}
    if "completed" in data:
        prog.completed = bool(data["completed"])
        db.session.commit()

    return jsonify(prog.to_dict()), 200
