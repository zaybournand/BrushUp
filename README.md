BrushUp: AI-Powered Drawing App

DESCRIPTION:
BrushUp is a full-stack web application designed to help artists improve their drawing skills. It allows users to generate unique AI images from text prompts (using Stable Diffusion), draw directly over these or predefined reference images, and share their creations within a community.

KEY FEATURES:

- AI Image Generation (text-to-image)
- Interactive Drawing Canvas (brush tools, erase, save)
- User Authentication & Personalized Drawing Management
- Community Post Feed (like, comment, search, sort)
- Predefined Reference Library with tips
- Blank Canvas drawing mode

TECHNOLOGIES:
Frontend: React, React Router DOM, JavaScript
Backend: Flask, SQLAlchemy, Python
AI/ML: PyTorch, Hugging Face (Diffusers, Accelerate)
Database: SQLite (local development)
Tools: npm, conda/pip, mkcert (for local HTTPS)

GETTING STARTED (LOCAL SETUP):

1. Clone the repository:
   git clone https://github.com/your-username/BrushUp.git
   cd BrushUp

2. Backend Setup (Flask & AI Model):
   cd backend
   (Recommended) For AI/ML: conda create -n brushup_backend python=3.10
   (Recommended) conda activate brushup_backend
   pip install -r requirements.txt
   (If missing requirements.txt: pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-Login Flask-Bcrypt Flask-CORS gunicorn diffusers transformers accelerate torch torchvision torchaudio Pillow psycopg2-binary)

   Generate Local HTTPS Certificates:
   brew install mkcert
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   (Update app.py to use these new .pem and .key filenames, e.g., localhost+2.pem)

   Initialize Database:
   flask db upgrade

   Run Backend:
   python app.py
   (This will initialize and download the AI model - may take a few minutes on first run.)

3. Frontend Setup (React):
   Open a NEW Terminal Window.
   cd ../frontend
   npm install
   npm start

USAGE:

1. Open your browser to http://localhost:3000.
2. For full features (AI generation, saving, community posts), create an account and log in.
3. Access the backend directly at https://localhost:5001 (you might need to manually trust the certificate if prompted).

NOTE: AI image generation runs on CPU in local development, expect it to take a few moments per image.

CONTACT:
zaybournand@gmail.com
