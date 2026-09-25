"""Drawings endpoints."""
from flask import Blueprint
from flask import request, jsonify
from flask_login import login_required, current_user
from ..extensions import db
from ..models import Drawing

bp = Blueprint("drawings", __name__)

@bp.route('/user-drawings', methods=['GET'])
@login_required
def get_user_drawings():
    user_drawings = Drawing.query.filter_by(user_id=current_user.id).all()
    return jsonify([drawing.to_dict() for drawing in user_drawings]), 200

@bp.route("/upload-drawing", methods=["POST"])
@login_required
def upload_drawing():
    data = request.json
    name = data.get("name")
    image_url = data.get("image_url")

    if not name or not image_url:
        return jsonify({"error": "Missing name or image_url"}), 400

    drawing = Drawing(name=name, image_url=image_url, user_id=current_user.id)
    db.session.add(drawing)
    db.session.commit()

    return jsonify(drawing.to_dict()), 201

@bp.route("/my-drawings", methods=["GET"])
@login_required
def my_drawings():
    drawings = Drawing.query.filter_by(user_id=current_user.id).all()
    return jsonify([d.to_dict() for d in drawings]), 200

@bp.route("/rename-drawing", methods=["POST"])
@login_required
def rename_drawing():
    data = request.json
    drawing_id = data.get("id")
    new_name = data.get("name")

    if not drawing_id or not new_name:
        return jsonify({"error": "Missing drawing ID or new name"}), 400

    drawing = Drawing.query.filter_by(id=drawing_id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    drawing.name = new_name
    db.session.commit()
    return jsonify(drawing.to_dict()), 200

@bp.route("/delete-drawing/<int:id>", methods=["DELETE"])
@login_required
def delete_drawing(id):
    drawing = Drawing.query.filter_by(id=id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    db.session.delete(drawing)
    db.session.commit()
    return jsonify({"message": "Drawing deleted"}), 200
