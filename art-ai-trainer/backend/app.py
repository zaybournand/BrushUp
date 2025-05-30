from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_cors import CORS


app = Flask(__name__)
app.config['SECRET_KEY'] = 'a_very_secret_and_complex_key_that_is_not_just_your_secret_key_for_real_use'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# *** IMPORTANT: SET THESE FOR HTTPS USAGE ***
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True # <--- THIS MUST BE TRUE FOR SameSite=None on HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_DOMAIN"] = ".localhost" # <--- ADD THIS LINE!

# Extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "https://localhost:3000"])

# Login setup
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized"}), 401

# Models (no changes here)
class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    # This line correctly establishes the 'drawings' relationship on User
    drawings = db.relationship('Drawing', backref='owner', lazy=True)

class Drawing(db.Model):
    __tablename__ = "drawing"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    image_url = db.Column(db.String(300), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # *** CHANGE THIS LINE ***
    # Remove the redundant backref definition here.
    # The 'drawings' property on User is already handled by the 'backref="owner"' in the User model.
    user = db.relationship('User') # <--- SIMPLIFIED THIS LINE

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "image_url": self.image_url,
            'user_id': self.user_id
        }

# User loader for Flask-Login (keep your print statements for now, they won't hurt)
@login_manager.user_loader
def load_user(user_id):
    print(f"DEBUG: load_user called with user_id: {user_id}, type: {type(user_id)}")
    try:
        user = User.query.get(int(user_id))
        print(f"DEBUG: load_user found user: {user.email if user else 'None'}")
        return user
    except (ValueError, TypeError) as e:
        print(f"DEBUG: load_user error: {e}, user_id: {user_id}")
        return None

# Routes (ensure @login_required is uncommented for protected routes)
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(email=email, password=hashed_password)

    db.session.add(new_user)
    db.session.commit()

    login_user(new_user)
    return jsonify({"id": new_user.id, "email": new_user.email}), 201


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.json
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if user is None or not bcrypt.check_password_hash(user.password, password):
            return jsonify({"error": "Unauthorized"}), 401

        login_user(user)
        print(f"User {user.id} logged in. Session user_id: {session.get('_user_id')}")
        return jsonify({"id": user.id, "email": user.email}), 200
    else:
        return jsonify({"message": "Please POST credentials to log in."}), 200

@app.route("/whoami", methods=["GET"])
def whoami():
    if current_user.is_authenticated:
        return jsonify({"user_id": current_user.id}), 200
    else:
        return jsonify({"user_id": None}), 200

@app.route("/session-debug", methods=["GET"])
def session_debug():
    return jsonify({
        "session_content": dict(session),
        "flask_login_authenticated": current_user.is_authenticated,
        "flask_login_user_id": current_user.get_id() if current_user.is_authenticated else None,
        "request_cookies": request.cookies
    }), 200

@app.route('/user-drawings', methods=['GET'])
@login_required
def get_user_drawings():
    user_drawings = Drawing.query.filter_by(user_id=current_user.id).all()
    return jsonify([drawing.to_dict() for drawing in user_drawings]), 200


@app.route("/logout", methods=["POST"])
@login_required 
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200


@app.route("/upload-drawing", methods=["POST"])
@login_required 
def upload_drawing():
    print("--- DEBUGGING UPLOAD DRAWING REQUEST ---") 
    print(f"Request Cookies (received by Flask): {request.cookies}") 
    print(f"Is current_user authenticated (before manual check)? {current_user.is_authenticated}") 

    data = request.json
    name = data.get("name")
    image_url = data.get("image_url")

    if not name or not image_url:
        return jsonify({"error": "Missing name or image_url"}), 400

    drawing = Drawing(name=name, image_url=image_url, user_id=current_user.id)
    db.session.add(drawing)
    db.session.commit()

    return jsonify(drawing.to_dict()), 201


@app.route("/my-drawings", methods=["GET"])
@login_required
def my_drawings():
    drawings = Drawing.query.filter_by(user_id=current_user.id).all()
    return jsonify([d.to_dict() for d in drawings]), 200



@app.route("/rename-drawing", methods=["POST"])
@login_required 
def rename_drawing():
    data = request.json
    drawing_id = data.get("id")
    new_name = data.get("name")

    drawing = Drawing.query.filter_by(id=drawing_id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    drawing.name = new_name
    db.session.commit()
    return jsonify(drawing.to_dict()), 200


@app.route("/delete-drawing/<int:id>", methods=["DELETE"])
@login_required # <--- Ensure this is uncommented
def delete_drawing(id):
    drawing = Drawing.query.filter_by(id=id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    db.session.delete(drawing)
    db.session.commit()
    return jsonify({"message": "Drawing deleted"}), 200

# Initialize DB
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # Use the generated certificates
    # Replace 'localhost+1.pem' and 'localhost+1-key.pem' with your actual generated file names
    # Make sure these files are in the same directory as app.py
    ssl_cert_path = 'localhost+1.pem' # Or just 'localhost.pem' if that's what mkcert created
    ssl_key_path = 'localhost+1-key.pem' # Or just 'localhost-key.pem' if that's what mkcert created

    try:
        ssl_context = (ssl_cert_path, ssl_key_path)
        app.run(debug=True, host="localhost", port=5000, ssl_context=ssl_context)
    except FileNotFoundError:
        print(f"ERROR: SSL certificate or key file not found. Make sure '{ssl_cert_path}' and '{ssl_key_path}' are in the same directory as app.py or provide full paths.")
        print("You can generate them using 'mkcert localhost 127.0.0.1' in your backend directory.")
        # Fallback to HTTP if certs aren't found, but expect cookie issues
        app.run(debug=True, host="localhost", port=5000)