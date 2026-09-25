# BrushUp

An art practice app with a drawing canvas, reference images, saved drawings, and a community feed. React provides the interface; Flask provides session authentication, persistence, uploads, and optional Stable Diffusion image generation.

## Project layout

```text
art-ai-trainer/
├── backend/
│   ├── app.py                 # Small development / Flask entry point
│   ├── brushup/
│   │   ├── __init__.py         # create_app factory and database CLI
│   │   ├── config.py           # Environment settings and stable file paths
│   │   ├── extensions.py       # Database, migrations, hashing, sessions
│   │   ├── models.py           # User, Drawing, CommunityPost, Like, Comment
│   │   ├── routes/             # auth, drawings, community, uploads, generation
│   │   └── services/           # Upload validation and lazy image generation
│   ├── migrations/            # Alembic configuration
│   ├── scripts/               # Manual generation and k6 load utilities
│   ├── tests/                 # Isolated API regression tests
│   ├── static/uploads/        # Runtime images (ignored by Git)
│   ├── instance/              # Local SQLite database (ignored by Git)
│   ├── requirements.txt       # Core API dependencies
│   └── requirements-ml.txt    # Optional image generation dependencies
├── frontend/
│   ├── public/                # Static reference images and HTML shell
│   └── src/
│       ├── app/               # App routing and drawing-session state
│       ├── components/        # Shared route guard
│       ├── contexts/          # Authentication state
│       ├── pages/             # auth, home, drawing, drawings, reference, community
│       ├── services/api.js    # Shared API base URL
│       ├── styles/            # Global CSS; page CSS lives beside each page
│       ├── utils/             # Performance reporting
│       └── index.js           # React entry point
└── README.md
```

## Local setup

Use Python 3.10+ (3.11 or 3.12 recommended for ML dependencies), Node.js 20+, and npm. Run these commands from the project root.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app app init-db
python app.py
```

The API listens on `http://localhost:5001`. Set a random `SECRET_KEY` in `backend/.env`; the built-in fallback is for local development only. `init-db` creates missing tables without deleting existing data. The existing database stays at `backend/instance/test.db`, regardless of the launch directory. Startup no longer creates or modifies tables automatically.

### Frontend

In another terminal, from the project root:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm start
```

Open `http://localhost:3000`. All API callers use `src/services/api.js`. Restart the frontend after changing `REACT_APP_API_BASE_URL`.

### Optional AI image generation

```bash
cd backend
source .venv/bin/activate
pip install -r requirements-ml.txt
```

Restart the backend after installation. The first authenticated generation request loads `DIFFUSION_MODEL_ID` and may download model weights; it requires network access and enough memory. CUDA or Apple MPS is used when available, otherwise CPU. Model loading failures return HTTP 503 without disabling other API features. Generation is synchronous and serialized per server process; the first request can take several minutes.

The standalone prompt utility is `python scripts/generate_image.py`; it saves to `backend/generated_images/`.

## Configuration

| Setting | Default / purpose |
| --- | --- |
| `SECRET_KEY` | Signing key for session cookies; set in `backend/.env` |
| `DATABASE_URL` | `sqlite:///test.db`, relative to the backend instance directory |
| `PORT` | `5001` for `python app.py` |
| `FLASK_DEBUG` | Disabled unless set to `true`; example enables local debugging |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `SESSION_COOKIE_SAMESITE` | `Lax` for local development |
| `SESSION_COOKIE_SECURE` | `false` for local HTTP; use `true` with HTTPS |
| `SSL_CERT_FILE`, `SSL_KEY_FILE` | Optional certificate paths for `python app.py` |
| `DIFFUSION_MODEL_ID` | `runwayml/stable-diffusion-v1-5` |
| `REACT_APP_API_BASE_URL` | Frontend setting; `http://localhost:5001` |

For local HTTPS, configure both certificate paths, set the frontend API URL to `https://localhost:5001`, and enable secure cookies. Use matching schemes for frontend and backend. Cross-site HTTPS deployments may require `SESSION_COOKIE_SAMESITE=None`. Uploaded image URLs are generated from the incoming request host and scheme.

## API overview

Existing URLs and response shapes are retained by the route modules.

| Module | Endpoints |
| --- | --- |
| Authentication | `POST /signup`, `GET/POST /login`, `GET /whoami`, `POST /logout`, `GET /session-debug` |
| Drawings | `GET /my-drawings`, `GET /user-drawings`, `POST /upload-drawing`, `POST /rename-drawing`, `DELETE /delete-drawing/<id>` |
| Uploads | `POST /api/upload_file`, `GET /download/uploads/<filename>`, `GET /static/uploads/<filename>` |
| Community | `POST /api/create_post`, `GET /api/get_community_posts`, `POST /api/like_post/<post_id>`, `POST /api/comment_post/<post_id>`, `DELETE /api/delete_post/<post_id>` |
| Generation | `POST /api/generate_reference_image` |

Authentication uses session cookies. Protected endpoints return 401 when logged out. The community listing accepts `sort_by=newest` or `sort_by=most_liked`. The session debugging endpoint is a development aid and should not be exposed in production.

## Validation

```bash
# From backend, with its virtual environment active:
python -m unittest discover -s tests -v

# From frontend:
npm test -- --watchAll=false
npm run build
```

Backend tests use temporary uploads and an in-memory database. AI responses are mocked so tests do not download weights or require a GPU. The frontend test checks the anonymous-user redirect through the real router. Jest module mappings and encoding polyfills support React Router with the existing CRA test runner; TypeScript is constrained to the version supported by react-scripts.

The optional k6 utility requires an existing account and installed k6:

```bash
API_BASE_URL=http://localhost:5001 TEST_EMAIL=artist@example.com TEST_PASSWORD=your-password k6 run backend/scripts/inference_test.js
```

This runs real generation requests for three minutes and can be resource intensive.

## Development notes

- Add HTTP handlers to the appropriate blueprint under `backend/brushup/routes/`; keep reusable non-HTTP logic under `services/`.
- Models share the unbound extensions in `extensions.py`. Importing the application does not load the AI model.
- The supplied migrations directory has configuration but no revision history. Use `init-db` for fresh local setup. For future schema changes, create and review Alembic revisions with `flask --app app db migrate` before applying `flask --app app db upgrade`; back up existing databases first.
- Add frontend pages under their feature folder, with their CSS beside them. Keep shared components and context outside page folders.
- Local environments, certificates, databases, generated files, and dependency folders are ignored by Git. Existing runtime files are left in place.
