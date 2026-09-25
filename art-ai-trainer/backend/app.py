"""Development entry point. Use `flask --app app run` or `python app.py`."""
import os
from brushup import create_app

app = create_app()

if __name__ == "__main__":
    cert = os.getenv("SSL_CERT_FILE")
    key = os.getenv("SSL_KEY_FILE")
    app.run(host="localhost", port=int(os.getenv("PORT", "5001")),
            debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
            ssl_context=(cert, key) if cert and key else None)
