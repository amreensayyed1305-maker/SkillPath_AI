import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "growvia-ai-secret-key-change-in-production-2026")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "growvia-ai-jwt-secret-key-change-in-production-2026")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "72"))

    # Database: SQLite for development, easily overridden with postgresql:// in production
    DB_PATH = BASE_DIR / "instance" / "growvia.db"
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{DB_PATH.as_posix()}"
    )
    # Fix for Heroku/Render postgres:// prefix if used with SQLAlchemy 1.4+
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv("SQLALCHEMY_ECHO", "False").lower() in ("true", "1")

    # File uploads
    UPLOAD_FOLDER = str(BASE_DIR / "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)) # 5 MB
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

    # CORS
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

    # AI Configuration (optional external services)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_EXPIRATION_HOURS = 1

class ProductionConfig(Config):
    DEBUG = False
    # Ensure strong secret keys in production
    @classmethod
    def init_app(cls, app):
        pass

config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}
