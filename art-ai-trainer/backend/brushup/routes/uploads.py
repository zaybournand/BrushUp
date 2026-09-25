"""Uploads endpoints."""
from flask import Blueprint
import os
from uuid import uuid4
from flask import request, jsonify, current_app, send_from_directory, url_for
from flask_login import login_required
from werkzeug.utils import secure_filename
from ..services.uploads import allowed_file

bp = Blueprint("uploads", __name__)

@bp.route('/api/upload_file', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = f"{uuid4().hex}_{secure_filename(file.filename)}"
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        public_url = url_for("static", filename=f"uploads/{filename}", _external=True)
        return jsonify({"public_url": public_url}), 200
    return jsonify({"error": "File type not allowed"}), 400

@bp.route('/download/uploads/<filename>', methods=['GET'])
def download_uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, as_attachment=True)
