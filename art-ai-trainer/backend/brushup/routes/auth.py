"""Auth endpoints."""
from flask import Blueprint
from flask import request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from ..extensions import db, bcrypt
from ..models import User

bp = Blueprint("auth", __name__)

@bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    username = data.get("username")

    if not email or not password or not username:
        return jsonify({"error": "Email, password, and username are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password=hashed_password, username=username)

    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return jsonify({"id": new_user.id, "email": new_user.email, "username": new_user.username}), 201

@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.json
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if user is None or not bcrypt.check_password_hash(user.password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        login_user(user)
        return jsonify({"id": user.id, "email": user.email, "username": user.username}), 200
    else:

        return jsonify({"message": "Please POST credentials to log in."}), 200

@bp.route("/whoami", methods=["GET"])
def whoami():
    if current_user.is_authenticated:
        return jsonify({"user_id": current_user.id, "email": current_user.email, "username": current_user.username}), 200
    else:
        return jsonify({"user_id": None, "email": None, "username": None}), 200

@bp.route("/session-debug", methods=["GET"])
def session_debug():
    return jsonify({
        "session_content": dict(session),
        "flask_login_authenticated": current_user.is_authenticated,
        "flask_login_user_id": current_user.get_id() if current_user.is_authenticated else None,
        "request_cookies": request.cookies
    }), 200

@bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200
