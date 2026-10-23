from flask import Blueprint, request, jsonify
from services.auth_service import token_optional
from services.recommendation_service import generate_chat_response

assistant_bp = Blueprint("assistant", __name__, url_prefix="/api/assistant")

@assistant_bp.route("/chat", methods=["POST"])
@token_optional
def chat_with_assistant(current_user=None):
    data = request.get_json() or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"error": "Message cannot be empty."}), 400

    response = generate_chat_response(message, user=current_user)
    return jsonify(response), 200
