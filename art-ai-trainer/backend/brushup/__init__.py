"""Flask application factory."""
from pathlib import Path
import click
from flask import Flask, jsonify
from flask_cors import CORS
from .config import BACKEND_DIR, Config
from .extensions import db, migrate, bcrypt, login_manager


def create_app(config=None):
    app = Flask(__name__, static_folder=str(BACKEND_DIR / "static"),
                static_url_path="/static", instance_path=str(BACKEND_DIR / "instance"))
    app.config.from_object(Config)
    if config:
        app.config.update(config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    migrate.init_app(app, db, directory=str(BACKEND_DIR / "migrations"))
    bcrypt.init_app(app)
    login_manager.init_app(app)
    CORS(app, supports_credentials=True, origins=app.config["CORS_ORIGINS"])

    from .models import User
    from .routes import register_routes
    from .services.image_generation import ImageGenerationService
    app.extensions["image_generation"] = ImageGenerationService(app.config["DIFFUSION_MODEL_ID"])

    @login_manager.user_loader
    def load_user(user_id):
        try:
            return db.session.get(User, int(user_id))
        except (ValueError, TypeError):
            return None

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Unauthorized"}), 401

    @app.cli.command("init-db")
    def init_db():
        """Create missing tables for a fresh local database."""
        db.create_all()
        click.echo("Database initialized.")

    register_routes(app)
    return app
