"""API regression checks using isolated SQLite and temporary upload files."""
import io
import tempfile
import unittest
from unittest.mock import Mock
from pathlib import Path
from brushup import create_app
from brushup.extensions import db
from brushup.services.image_generation import GenerationUnavailable

class ApiTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.app = create_app({"TESTING": True, "SECRET_KEY": "test-secret",
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "UPLOAD_FOLDER": self.temp.name, "SESSION_COOKIE_SECURE": False})
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.temp.cleanup()

    def signup(self, client=None, name="artist"):
        response = (client or self.client).post("/signup", json={
            "email": f"{name}@example.com", "username": name, "password": "password"})
        self.assertEqual(response.status_code, 201)

    def test_authentication_and_drawing_ownership(self):
        self.assertEqual(self.client.get("/my-drawings").status_code, 401)
        self.signup()
        self.assertEqual(self.client.get("/whoami").json["username"], "artist")
        response = self.client.post("/upload-drawing", json={"name": "Study", "image_url": "data:image/png;base64,test"})
        self.assertEqual(response.status_code, 201)
        drawing_id = response.json["id"]
        self.assertEqual(len(self.client.get("/user-drawings").json), 1)
        other = self.app.test_client()
        self.signup(other, "other")
        self.assertEqual(other.delete(f"/delete-drawing/{drawing_id}").status_code, 404)
        self.assertEqual(self.client.post("/rename-drawing", json={"id": drawing_id, "name": "Renamed"}).json["name"], "Renamed")
        self.assertEqual(self.client.delete(f"/delete-drawing/{drawing_id}").status_code, 200)
        self.assertEqual(self.client.get("/my-drawings").json, [])
        self.client.post("/logout")
        self.assertIsNone(self.client.get("/whoami").json["user_id"])
        self.assertEqual(self.client.post("/login", json={"email": "artist@example.com", "password": "password"}).status_code, 200)

    def test_community_likes_comments_and_deletion(self):
        self.signup()
        response = self.client.post("/api/create_post", json={"image_url": "https://example.com/art.png", "caption": "Study"})
        self.assertEqual(response.status_code, 201)
        post_id = response.json["id"]
        self.assertEqual(self.client.post(f"/api/like_post/{post_id}").json["likes_count"], 1)
        self.assertEqual(self.client.post(f"/api/like_post/{post_id}").json["likes_count"], 0)
        self.assertEqual(self.client.post(f"/api/comment_post/{post_id}", json={"comment": "Nice!"}).status_code, 201)
        posts = self.client.get("/api/get_community_posts?sort_by=most_liked").json
        self.assertEqual(posts[0]["comments"][0]["text"], "Nice!")
        other = self.app.test_client()
        self.signup(other, "other")
        self.assertEqual(other.delete(f"/api/delete_post/{post_id}").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/delete_post/{post_id}").status_code, 200)
        self.assertEqual(self.client.get("/api/get_community_posts").json, [])

    def test_uploads_and_downloads(self):
        self.signup()
        self.assertEqual(self.client.post("/api/upload_file", data={}).status_code, 400)
        response = self.client.post("/api/upload_file", data={"file": (io.BytesIO(b"image"), "study.png")})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["public_url"].startswith("http://localhost/static/uploads/"))
        filename = response.json["public_url"].rsplit("/", 1)[1]
        self.assertEqual((Path(self.temp.name) / filename).read_bytes(), b"image")
        with self.client.get(f"/download/uploads/{filename}") as download:
            self.assertEqual(download.data, b"image")

    def test_generation_without_loading_a_model(self):
        self.signup()
        service = Mock()
        self.app.extensions["image_generation"] = service
        self.assertEqual(self.client.post("/api/generate_reference_image", json={"prompt": " "}).status_code, 400)
        service.generate.assert_not_called()
        service.generate.side_effect = GenerationUnavailable()
        self.assertEqual(self.client.post("/api/generate_reference_image", json={"prompt": "A tree"}).status_code, 503)
        service.generate.side_effect = None
        service.generate.return_value.save.side_effect = lambda path: Path(path).write_bytes(b"generated")
        response = self.client.post("/api/generate_reference_image", json={"prompt": "A tree"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("/static/uploads/generated_ref_", response.json["image_url"])

if __name__ == "__main__":
    unittest.main()
