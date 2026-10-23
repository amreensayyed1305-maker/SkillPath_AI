from flask import Blueprint, jsonify, request
from extensions import db
from models import Roadmap, UserProgress, QuizAttempt, Project, Certification, Notification
from services.auth_service import token_optional, token_required, calculate_user_streak

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")

@dashboard_bp.route("/dashboard", methods=["GET"])
@token_optional
def get_dashboard_metrics(current_user=None):
    # Total available roadmap steps
    roadmaps = Roadmap.query.all()
    total_steps_in_app = sum(len(r.steps) for r in roadmaps) or 1

    if not current_user:
        # Default stats for unauthenticated visitors
        track_breakdown = []
        for r in roadmaps:
            track_breakdown.append({
                "track": r.track,
                "completed": 0,
                "total": len(r.steps),
                "percent": 0
            })
        return jsonify({
            "roadmap_progress": 0,
            "streak": 0,
            "topics_completed": 0,
            "practice_average": None,
            "portfolio_count": 0,
            "track_progress": track_breakdown,
            "recent_quizzes": [],
            "authenticated": False
        }), 200

    user_id = current_user.id

    # 1. Topics completed
    completed_records = UserProgress.query.filter_by(user_id=user_id, completed=True).all()
    total_completed = len(completed_records)
    overall_progress = round((total_completed / total_steps_in_app) * 100) if total_steps_in_app else 0

    # 2. Track breakdown
    track_counts = {}
    for p in completed_records:
        track_counts[p.roadmap_track] = track_counts.get(p.roadmap_track, 0) + 1

    track_breakdown = []
    for r in roadmaps:
        count = track_counts.get(r.track, 0)
        tot = len(r.steps)
        pct = round((count / tot) * 100) if tot else 0
        track_breakdown.append({
            "track": r.track,
            "completed": count,
            "total": tot,
            "percent": pct
        })

    # 3. Streak
    streak = calculate_user_streak(user_id)

    # 4. Quiz metrics
    attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.completed_at.desc()).all()
    practice_average = None
    if attempts:
        practice_average = round(sum(a.percentage for a in attempts) / len(attempts))

    recent_quizzes = [
        {
            "id": a.id,
            "track": a.track,
            "percent": a.percentage,
            "score": a.score,
            "total": a.total_questions,
            "date": a.completed_at.strftime("%b %d, %Y") if a.completed_at else None
        } for a in attempts[:7]
    ]

    # 5. Portfolio count
    proj_count = Project.query.filter_by(user_id=user_id).count()
    cert_count = Certification.query.filter_by(user_id=user_id).count()
    portfolio_count = proj_count + cert_count

    return jsonify({
        "roadmap_progress": overall_progress,
        "streak": streak,
        "topics_completed": total_completed,
        "practice_average": practice_average,
        "portfolio_count": portfolio_count,
        "project_count": proj_count,
        "cert_count": cert_count,
        "track_progress": track_breakdown,
        "recent_quizzes": recent_quizzes,
        "authenticated": True,
        "user_name": current_user.profile.name if current_user.profile else "Student"
    }), 200


@dashboard_bp.route("/notifications", methods=["GET"])
@token_required
def get_notifications(current_user):
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(20).all()
    unread_count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "unread_count": unread_count
    }), 200


@dashboard_bp.route("/notifications/<int:notif_id>/read", methods=["PATCH"])
@token_required
def mark_notification_read(notif_id, current_user):
    notif = db.session.get(Notification, notif_id)
    if not notif or notif.user_id != current_user.id:
        return jsonify({"error": "Notification not found."}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({"message": "Notification marked as read."}), 200
