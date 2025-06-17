# 🎨 BrushUp: AI-Powered Drawing App

### 📺 Demo

[Click here to watch the app demo on YouTube](https://youtu.be/cWWd9Sq35qA)

---

## 📝 Description

**BrushUp** is a full-stack web application designed to help artists improve their drawing skills. It allows users to:

- Generate unique AI images from text prompts (using Stable Diffusion)
- Draw directly over AI or reference images
- Share and explore artwork within a community

---

## 🚀 Key Features

- 🧠 AI Image Generation (text-to-image)
- ✏️ Interactive Drawing Canvas (brush, erase, save)
- 🔐 User Authentication & Drawing Management
- 🧑‍🤝‍🧑 Community Post Feed (like, comment, search, sort)
- 📚 Reference Library with drawing tips
- 🧾 Blank Canvas Mode

---

## ⚙️ Technologies Used

**Frontend:** React, React Router DOM, JavaScript  
**Backend:** Flask, SQLAlchemy, Python  
**AI/ML:** PyTorch, Hugging Face (Diffusers, Accelerate), Stable Diffusion  
**Database:** SQLite (for local dev)  
**Tools:** npm, conda/pip, mkcert

---

## 🛠️ Getting Started (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/BrushUp.git
cd BrushUp
```

### 2. Backend Setup (Flask + AI)

```bash
cd backend
conda create -n brushup_backend python=3.10  # Recommended
conda activate brushup_backend
pip install -r requirements.txt
```

> If requirements.txt is missing, install manually:

```bash
pip install Flask Flask-SQLAlchemy Flask-Migrate Flask-Login Flask-Bcrypt Flask-CORS gunicorn diffusers transformers accelerate torch torchvision torchaudio Pillow psycopg2-binary
```

**Generate Local HTTPS Certificates:**

```bash
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

> Update `app.py` to use your `.pem` and `.key` files.

**Initialize Database:**

```bash
flask db upgrade
```

**Run Backend:**

```bash
python app.py
```

> Initial model download may take up to a minute.

---

### 3. Frontend Setup (React)

Open a new terminal:

```bash
cd ../frontend
npm install
npm start
```

---

## 🌐 Usage

1. Visit: http://localhost:3000
2. Sign up to unlock AI generation and sharing features
3. Backend: https://localhost:5001 (accept the local certificate if needed)

> ⚡ AI runs on Apple Silicon GPU (MPS) with Accelerate, typically generating in ~1 minute.

---

## 📬 Contact

- **Email:** zaybournand@gmail.com
