"""Community endpoints."""
from flask import Blueprint
from flask import request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc, func
from ..extensions import db
from ..models import CommunityPost, Like, Comment

bp = Blueprint("community", __name__)

@bp.route("/api/create_post", methods=["POST"])
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

@bp.route("/api/get_community_posts", methods=["GET"])
def get_community_posts():
    sort_by = request.args.get("sort_by", "newest")

    if sort_by == "newest":
        posts = CommunityPost.query.order_by(desc(CommunityPost.created_at)).all()
    elif sort_by == "most_liked":

        posts = db.session.query(CommunityPost).outerjoin(Like).group_by(CommunityPost.id).order_by(desc(func.count(Like.id))).all()
    else:
        return jsonify({"error": "Invalid sort_by parameter. Use 'newest' or 'most_liked'."}), 400

    return jsonify([
        post.to_dict(include_likes_count=True, include_comments=True)
        for post in posts
    ]), 200

@bp.route("/api/like_post/<int:post_id>", methods=["POST"])
@login_required
def like_post(post_id):
    post = CommunityPost.query.get(post_id)
    if not post:
        return jsonify({"error": "Post not found"}), 404

    existing_like = Like.query.filter_by(user_id=current_user.id, post_id=post_id).first()

    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        post = CommunityPost.query.get(post_id)
        return jsonify({"message": "Post unliked", "likes_count": post.likes.count()}), 200
    else:
        new_like = Like(user_id=current_user.id, post_id=post_id)
        db.session.add(new_like)
        db.session.commit()
        post = CommunityPost.query.get(post_id)
        return jsonify({"message": "Post liked", "likes_count": post.likes.count()}), 200

@bp.route("/api/comment_post/<int:post_id>", methods=["POST"])
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

@bp.route("/api/delete_post/<int:post_id>", methods=["DELETE"])
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
