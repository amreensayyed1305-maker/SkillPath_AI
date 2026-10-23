from flask import Blueprint, request, jsonify
from extensions import db
from models import Quiz, Question, QuizAttempt, QuizAnswer, Notification
from services.auth_service import token_optional, token_required, record_activity

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api")

REVISION_NOTES_DATA = [
    {"track": "Python", "title": "Lists vs tuples", "note": "Lists are mutable; tuples are immutable. Both support indexing."},
    {"track": "Python", "title": "Dictionary lookup", "note": "Dictionaries map keys to values. Use dict.get(key) when a missing key should return a default."},
    {"track": "SQL", "title": "WHERE vs HAVING", "note": "WHERE filters individual rows before grouping; HAVING filters groups after aggregation."},
    {"track": "SQL", "title": "INNER vs LEFT JOIN", "note": "INNER JOIN returns matching rows. LEFT JOIN preserves every left-table row, including unmatched rows."},
    {"track": "Java", "title": "Overloading vs overriding", "note": "Overloading changes parameter lists. Overriding provides a subclass implementation of an inherited method."},
    {"track": "JavaScript", "title": "let vs const", "note": "Both are block-scoped. let allows reassignment; const prevents rebinding the variable."},
    {"track": "Data Structures & Algorithms", "title": "Stack vs queue", "note": "Stack: LIFO. Queue: FIFO. Choose the structure based on the required processing order."},
    {"track": "AI / Machine Learning", "title": "Training vs testing", "note": "Train models on training data and reserve separate data to evaluate performance on unseen examples."},
    {"track": "Web Development", "title": "Flexbox vs Grid", "note": "Flexbox is ideal for one-dimensional alignment; Grid is useful for two-dimensional row and column layouts."}
]

@quizzes_bp.route("/quizzes", methods=["GET"])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify({
        "quizzes": [
            {
                "id": q.id,
                "track": q.track,
                "title": q.title,
                "description": q.description,
                "question_count": len(q.questions)
            } for q in quizzes
        ]
    }), 200


@quizzes_bp.route("/quizzes/<path:track_or_id>", methods=["GET"])
def get_quiz_questions(track_or_id):
    quiz = None
    if track_or_id.isdigit():
        quiz = db.session.get(Quiz, int(track_or_id))
    if not quiz:
        quiz = Quiz.query.filter(Quiz.track.ilike(track_or_id)).first()

    if not quiz:
        # Fallback to Python if not found
        quiz = Quiz.query.filter_by(track="Python").first()

    if not quiz:
        return jsonify({"error": "No quiz available"}), 404

    # Crucial security requirement: NEVER expose correct answers or explanations before submission!
    questions_data = []
    for q in quiz.questions:
        questions_data.append({
            "id": q.id,
            "q": q.question_text,
            "options": q.options,
            "topic": q.topic,
            "difficulty": q.difficulty
        })

    return jsonify({
        "id": quiz.id,
        "track": quiz.track,
        "title": quiz.title,
        "total_questions": len(questions_data),
        "questions": questions_data
    }), 200


@quizzes_bp.route("/quizzes/<path:track_or_id>/submit", methods=["POST"])
@token_optional
def submit_quiz(track_or_id, current_user=None):
    """
    Secure server-side score calculation. Never trusts frontend calculations.
    """
    quiz = None
    if track_or_id.isdigit():
        quiz = db.session.get(Quiz, int(track_or_id))
    if not quiz:
        quiz = Quiz.query.filter(Quiz.track.ilike(track_or_id)).first()

    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    data = request.get_json() or {}
    answers = data.get("answers", []) # List of selected option indices e.g. [1, 2, 0, ...]

    questions = quiz.questions
    total = len(questions)
    correct_count = 0
    review = []

    for idx, q in enumerate(questions):
        selected = answers[idx] if idx < len(answers) else None
        is_correct = (selected == q.correct_answer_index) if selected is not None else False
        if is_correct:
            correct_count += 1

        review.append({
            "question_id": q.id,
            "question": q.question_text,
            "options": q.options,
            "selected_option": selected,
            "correct_answer": q.correct_answer_index,
            "is_correct": is_correct,
            "explanation": q.explanation
        })

    percent = round((correct_count / total) * 100) if total > 0 else 0

    # If student is authenticated, persist attempt to database
    attempt_id = None
    if current_user:
        attempt = QuizAttempt(
            user_id=current_user.id,
            quiz_id=quiz.id,
            track=quiz.track,
            score=correct_count,
            total_questions=total,
            percentage=percent
        )
        db.session.add(attempt)
        db.session.flush()
        attempt_id = attempt.id

        for rev in review:
            ans_record = QuizAnswer(
                attempt_id=attempt.id,
                question_id=rev["question_id"],
                selected_option=rev["selected_option"],
                is_correct=rev["is_correct"]
            )
            db.session.add(ans_record)

        record_activity(current_user.id, "quiz_completed", f"Scored {percent}% in {quiz.track} quiz")

        # Congratulatory notification if score >= 80%
        if percent >= 80:
            notif = Notification(
                user_id=current_user.id,
                title=f"High Quiz Score: {quiz.track}! 🌟",
                message=f"Impressive! You scored {percent}% in the {quiz.track} assessment.",
                type="quiz"
            )
            db.session.add(notif)

        db.session.commit()

    return jsonify({
        "quiz_id": quiz.id,
        "track": quiz.track,
        "attempt_id": attempt_id,
        "correct": correct_count,
        "total": total,
        "percent": percent,
        "message": "Excellent work! 🎉" if percent >= 80 else "Good effort! Keep practising! ✨" if percent >= 50 else "Keep practising! Strengthen your concepts. 💪",
        "review": review
    }), 200


@quizzes_bp.route("/assessments/history", methods=["GET"])
@token_required
def get_assessment_history(current_user):
    attempts = QuizAttempt.query.filter_by(user_id=current_user.id).order_by(QuizAttempt.completed_at.desc()).all()
    return jsonify({
        "history": [a.to_dict() for a in attempts],
        "count": len(attempts)
    }), 200


@quizzes_bp.route("/quizzes/revision-notes", methods=["GET"])
def get_revision_notes():
    return jsonify({"notes": REVISION_NOTES_DATA}), 200
