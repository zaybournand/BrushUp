"""AI reference generation endpoints."""
from pathlib import Path
from uuid import uuid4
from flask import Blueprint, current_app, request, jsonify, url_for
from flask_login import login_required
from ..services.image_generation import GenerationUnavailable, GenerationOutOfMemory

bp = Blueprint("generation", __name__)

@bp.route("/api/generate_reference_image", methods=["POST"])
@login_required
def generate_reference_image():
    data = request.get_json()
    prompt = data.get("prompt")
    negative_prompt = data.get("negative_prompt", "")
    if not isinstance(prompt, str) or not prompt.strip():
        return jsonify({"error": "Prompt cannot be empty for image generation."}), 400
    if not isinstance(negative_prompt, str):
        return jsonify({"error": "Negative prompt must be text."}), 400
    try:
        image = current_app.extensions["image_generation"].generate(prompt, negative_prompt.strip())
        filename = f"generated_ref_{uuid4().hex}.png"
        image.save(Path(current_app.config["UPLOAD_FOLDER"]) / filename)
        return jsonify({"image_url": url_for("static", filename=f"uploads/{filename}", _external=True)}), 200
    except GenerationOutOfMemory:
        return jsonify({"error": "GPU out of memory during generation. Try a shorter prompt or simpler request."}), 507
    except GenerationUnavailable:
        current_app.logger.exception("Could not load image generation model")
        return jsonify({"error": "Image generation service is unavailable (model failed to load)."}), 503
    except Exception:
        current_app.logger.exception("Image generation failed")
        return jsonify({"error": "Image generation failed due to a server error."}), 500
