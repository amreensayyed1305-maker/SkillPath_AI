import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from config import config_by_name
from extensions import db, cors

def create_app(config_name="default"):
    app = Flask(__name__, static_folder="../Frontend", static_url_path="")
    app.config.from_object(config_by_name[config_name])

    # Ensure upload and instance directories exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(Path(app.config["DB_PATH"]).parent, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}}, supports_credentials=True)

    # Register API blueprints
    from routes.auth import auth_bp
    from routes.careers import careers_bp
    from routes.roadmaps import roadmaps_bp
    from routes.quizzes import quizzes_bp
    from routes.skill_gap import skill_gap_bp
    from routes.portfolio import portfolio_bp
    from routes.resume import resume_bp
    from routes.dashboard import dashboard_bp
    from routes.assistant import assistant_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(careers_bp)
    app.register_blueprint(roadmaps_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(skill_gap_bp)
    app.register_blueprint(portfolio_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(assistant_bp)

    # Static file serving for Frontend
    @app.route("/")
    def serve_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Growvia AI Backend",
            "version": "1.0.0"
        }), 200

    # Error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e.description if hasattr(e, "description") else e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error. Please try again later."}), 500

    # Auto create tables and seed on start
    with app.app_context():
        db.create_all()
        from seed import seed_database
        seed_database()

    return app

app = create_app(os.getenv("FLASK_ENV", "default"))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    print(f"Starting Growvia AI Backend on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
