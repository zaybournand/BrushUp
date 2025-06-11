from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from datetime import datetime
from werkzeug.utils import secure_filename
import os
from sqlalchemy import desc, func
from diffusers import StableDiffusionPipeline
import torch
from flask import send_from_directory 

print("\n--- Initializing Stable Diffusion model for image generation API ---")
print("This may take a while, especially on the first run (downloading model weights)...")

# Choose your model. "runwayml/stable-diffusion-v1-5" is a good balance for 8GB RAM.
model_id_for_api = "runwayml/stable-diffusion-v1-5"

# Device setup for the Flask app's ML component
device_for_api = "mps" if torch.backends.mps.is_available() else "cpu"
torch_dtype_for_api = torch.float16 if device_for_api == "mps" else torch.float32

# Global variable to hold the loaded pipeline
global_diffusion_pipeline = None

try:
    global_diffusion_pipeline = StableDiffusionPipeline.from_pretrained(
        model_id_for_api,
        torch_dtype=torch_dtype_for_api
    )
    # Move the model to the determined device
    global_diffusion_pipeline = global_diffusion_pipeline.to(device_for_api)
    print(f"Stable Diffusion model '{model_id_for_api}' loaded successfully on {device_for_api} for API.")
    print("--- Model initialization complete ---")
except Exception as e:
    print(f"\n--- ERROR: FAILED TO LOAD STABLE DIFFUSION MODEL FOR API ---")
    print(f"Reason: {e}")
    print("Image generation API will be disabled due to this failure.")
    global_diffusion_pipeline = None # Ensure it's None if loading fails
    print("--- Model initialization failed ---")

# --- END GLOBAL MACHINE LEARNING MODEL INITIALIZATION ---


app = Flask(__name__) # This line is now correctly placed after the ML model initialization

app.config['SECRET_KEY'] = 'a_very_secret_and_complex_key_that_is_not_just_your_secret_key_for_real_use'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True


db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "https://localhost:3000", "https://localhost:5001"]) # ADDED https://localhost:5001


login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Unauthorized"}), 401


class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=True) # Ensure this field is present
    drawings = db.relationship('Drawing', backref='owner', lazy=True)
    community_posts = db.relationship('CommunityPost', backref='poster', lazy=True)
    likes = db.relationship('Like', backref='liker', lazy=True)
    comments = db.relationship('Comment', backref='commenter', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username
        }

class Drawing(db.Model):
    __tablename__ = "drawing"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    image_url = db.Column(db.String(300), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "image_url": self.image_url,
            'user_id': self.user_id
        }

class CommunityPost(db.Model):
    __tablename__ = "community_post"
    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(300), nullable=False)
    caption = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    likes = db.relationship('Like', backref='post', lazy='dynamic', cascade="all, delete-orphan")
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self, include_comments=False, include_likes_count=False):
        data = {
            "id": self.id,
            "image_url": self.image_url,
            "caption": self.caption,
            "user_id": self.user_id,
            "author_username": self.poster.username if self.poster.username else self.poster.email,
            "created_at": self.created_at.isoformat() + 'Z'
        }
        if include_likes_count:
            data["likes_count"] = self.likes.count()
        if include_comments:
            data["comments"] = [comment.to_dict() for comment in self.comments.order_by(Comment.created_at.asc()).all()]
        return data

class Like(db.Model):
    __tablename__ = "like"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('community_post.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='_user_post_uc'),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "post_id": self.post_id,
            "created_at": self.created_at.isoformat() + 'Z'
        }

class Comment(db.Model):
    __tablename__ = "comment"
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('community_post.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "text": self.text,
            "user_id": self.user_id,
            "author_username": self.commenter.username if self.commenter.username else self.commenter.email,
            "post_id": self.post_id,
            "created_at": self.created_at.isoformat() + 'Z'
        }


@login_manager.user_loader
def load_user(user_id):
    try:
        user = User.query.get(int(user_id))
        return user
    except (ValueError, TypeError):
        return None


@app.route("/signup", methods=["POST"])
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


@app.route("/login", methods=["GET", "POST"])
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

@app.route("/whoami", methods=["GET"])
def whoami():
    if current_user.is_authenticated:
        return jsonify({"user_id": current_user.id, "email": current_user.email, "username": current_user.username}), 200
    else:
        return jsonify({"user_id": None, "email": None, "username": None}), 200

@app.route("/session-debug", methods=["GET"])
def session_debug():
    return jsonify({
        "session_content": dict(session),
        "flask_login_authenticated": current_user.is_authenticated,
        "flask_login_user_id": current_user.get_id() if current_user.is_authenticated else None,
        "request_cookies": request.cookies
    }), 200

@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Successfully logged out"}), 200


@app.route('/user-drawings', methods=['GET'])
@login_required
def get_user_drawings():
    user_drawings = Drawing.query.filter_by(user_id=current_user.id).all()
    return jsonify([drawing.to_dict() for drawing in user_drawings]), 200


@app.route("/upload-drawing", methods=["POST"])
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

    if not drawing_id or not new_name:
        return jsonify({"error": "Missing drawing ID or new name"}), 400

    drawing = Drawing.query.filter_by(id=drawing_id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    drawing.name = new_name
    db.session.commit()
    return jsonify(drawing.to_dict()), 200


@app.route("/delete-drawing/<int:id>", methods=["DELETE"])
@login_required
def delete_drawing(id):
    drawing = Drawing.query.filter_by(id=id, user_id=current_user.id).first()
    if not drawing:
        return jsonify({"error": "Drawing not found"}), 404

    db.session.delete(drawing)
    db.session.commit()
    return jsonify({"message": "Drawing deleted"}), 200

@app.route('/api/upload_file', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        public_url = f"https://localhost:5001/{app.config['UPLOAD_FOLDER']}/{filename}"
        return jsonify({"public_url": public_url}), 200
    return jsonify({"error": "File type not allowed"}), 400

@app.route("/api/create_post", methods=["POST"])
@login_required
def create_community_post():
    data = request.json
    image_url = data.get("image_url")
    caption = data.get("caption")

    if not image_url:
        return jsonify({"error": "Image URL is required to create a post"}), 400

    new_post = CommunityPost(
        image_url=image_url,
        caption=caption,
        user_id=current_user.id
    )
    db.session.add(new_post)
    db.session.commit()

    return jsonify(new_post.to_dict(include_likes_count=True, include_comments=True)), 201

@app.route("/api/generate_reference_image", methods=["POST"])
@login_required # Only logged-in users can use the generation feature
def generate_reference_image():
    global global_diffusion_pipeline # Add this line

    # Check if the model was loaded successfully on app startup
    if global_diffusion_pipeline is None:
        return jsonify({"error": "Image generation service is unavailable (model failed to load)."}), 503

    data = request.json
    prompt = data.get("prompt")
    negative_prompt = data.get("negative_prompt", "").strip() # Optional negative prompt

    if not prompt or not prompt.strip():
        return jsonify({"error": "Prompt cannot be empty for image generation."}), 400

    # Ensure the static/uploads folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    try:
        print(f"API Request: Generating image for prompt: '{prompt}'...")
        # Use torch.no_grad() for inference to save memory and speed up computation.
        # Adjust num_inference_steps (higher = better quality, slower) and guidance_scale.
        with torch.no_grad():
            generated_images = global_diffusion_pipeline(
                prompt=prompt,
                negative_prompt=negative_prompt if negative_prompt else None,
                num_inference_steps=30, # Balance quality and speed (try 20-50)
                guidance_scale=7.5      # Standard value, influences adherence to prompt
            ).images

        if not generated_images:
            return jsonify({"error": "Image generation failed: No image output from model."}), 500

        # Save the first generated image
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = secure_filename(f"generated_ref_{timestamp}.png")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        generated_images[0].save(file_path)

        # Construct the public URL for the generated image
        public_url = f"https://localhost:5001/{app.config['UPLOAD_FOLDER']}/{filename}" # Use your Flask port (5001)

        print(f"Image generated and saved: {public_url}")
        return jsonify({"image_url": public_url}), 200

    except torch.cuda.OutOfMemoryError:
        print("Image generation failed: GPU out of memory.")
        return jsonify({"error": "GPU out of memory during generation. Try a shorter prompt or simpler request."}), 507
    except Exception as e:
        print(f"Error during image generation API call: {e}. Running without SSL.")
        return jsonify({"error": f"Image generation failed due to a server error: {str(e)}"}), 500

@app.route("/api/get_community_posts", methods=["GET"])
def get_community_posts():
    sort_by = request.args.get("sort_by", "newest") # Default to 'newest'

    if sort_by == "newest":
        posts = CommunityPost.query.order_by(desc(CommunityPost.created_at)).all()
    elif sort_by == "most_liked":
        # Join with Like table and count likes, then order by the count
        posts = db.session.query(CommunityPost).outerjoin(Like).group_by(CommunityPost.id).order_by(desc(func.count(Like.id))).all()
    else:
        return jsonify({"error": "Invalid sort_by parameter. Use 'newest' or 'most_liked'."}), 400

    return jsonify([
        post.to_dict(include_likes_count=True, include_comments=True)
        for post in posts
    ]), 200


@app.route("/api/like_post/<int:post_id>", methods=["POST"])
@login_required
def like_post(post_id):
    post = CommunityPost.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        # Fetch the updated post to get the correct like count
        post = CommunityPost.query.get(post_id)
        return jsonify({"message": "Post unliked", "likes_count": post.likes.count()}), 200
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
        db.session.commit()
        # Fetch the updated post to get the correct like count
        post = CommunityPost.query.get(post_id)
        return jsonify({"message": "Post liked", "likes_count": post.likes.count()}), 200


@app.route("/api/comment_post/<int:post_id>", methods=["POST"])
@login_required
def comment_post(post_id):
    data = request.json
    comment_text = data.get("comment")

    if not comment_text or not comment_text.strip():
        return jsonify({"error": "Comment text cannot be empty"}), 400

    post = CommunityPost.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    new_comment = Comment(
        text=comment_text.strip(),
        user_id=current_user.id,
        post_id=post_id
    )
    db.session.add(new_comment)
    db.session.commit()

    return jsonify(new_comment.to_dict()), 201

@app.route('/download/uploads/<filename>', methods=['GET'])
def download_uploaded_file(filename):

    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route("/api/delete_post/<int:post_id>", methods=["DELETE"])
@login_required
def delete_community_post(post_id):
    post = CommunityPost.query.get(post_id)

    if not post:
        return jsonify({"error": "Post not found"}), 404

    if post.user_id != current_user.id:
        return jsonify({"error": "Unauthorized to delete this post"}), 403

    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted successfully"}), 200


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    ssl_cert_path = 'localhost+2.pem'
    ssl_key_path = 'localhost+2-key.pem'

    try:
        app.run(debug=True, host="localhost", port=5001, ssl_context=(ssl_cert_path, ssl_key_path)) # CHANGED PORT TO 5001
    except FileNotFoundError:
        print("SSL certificate files not found, running without SSL.")
        app.run(debug=True, host="localhost", port=5001) # CHANGED PORT TO 5001
    except Exception as e:
        print(f"Error starting app with SSL: {e}. Running without SSL.")
        app.run(debug=True, host="localhost", port=5001) # CHANGED PORT TO 5001