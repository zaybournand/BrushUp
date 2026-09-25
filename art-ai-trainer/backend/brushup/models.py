"""Database entities; table names remain compatible with existing databases."""
from datetime import datetime
from flask_login import UserMixin
from .extensions import db

class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=True)
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
