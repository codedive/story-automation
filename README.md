# AI Story Factory

A full-stack local web application for generating, organizing, and managing AI-written short-form video
stories across unlimited content categories (niches), with per-category story history and multi-stage
duplicate detection.

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy, Alembic, Pydantic, SQLite (swappable for PostgreSQL), OpenAI SDK
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios

---

## 1. Project Structure

```
ai-story-factory/ (repo root)
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (categories, stories, scenes)
│   │   ├── core/            # settings + database engine/session
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── ai_provider.py        # AIProvider interface + OpenAIProvider
│   │   │   ├── story_generator.py    # generation orchestration + regeneration
│   │   │   ├── duplicate_checker.py  # multi-stage duplicate detection
│   │   │   └── serializers.py        # ORM -> Pydantic conversion helpers
│   │   └── main.py          # FastAPI app entrypoint
│   ├── alembic/              # migrations
│   ├── tests/                 # pytest suite (OpenAI calls are mocked)
│   ├── seed.py                # optional: seeds default categories
│   ├── requirements.txt
│   ├── .env.example
│   └── alembic.ini
└── frontend/
    ├── src/
    │   ├── api/               # axios client + typed endpoint functions
    │   ├── components/        # reusable UI components
    │   ├── pages/              # route-level pages
    │   ├── hooks/              # data-fetching hooks
    │   ├── types/              # shared TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

---

## 2. Windows Setup

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

Optional: seed default categories (Raj Simran Loveverse, Moral Stories, Kids Stories) with no fake stories:

```powershell
python seed.py
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 3. Where the OpenAI API key goes

Open `backend/.env` (created by copying `backend/.env.example`) and set:

```
OPENAI_API_KEY=sk-...your-key...
```

The key is **never hardcoded** and is only read server-side via `app/core/config.py`. The frontend never
sees or sends the key.

## 4. How to change the AI model

Edit `OPENAI_MODEL` in `backend/.env` (e.g. `gpt-4o-mini`, `gpt-4o`, `gpt-4.1-mini`, etc). The model name is
never hardcoded in the codebase — it's read from settings in `app/services/ai_provider.py`.

## 5. How duplicate detection works

Implemented in `app/services/duplicate_checker.py` and orchestrated by `app/services/story_generator.py`:

1. **Normalized title check** — lowercases, strips punctuation/extra whitespace, and compares against every
   previous story title in the **same category**.
2. **TF-IDF text similarity** — builds a combined text (title + hook + summary + location + ending) and
   computes cosine similarity (0-100) against up to the 20 most recent stories in the same category using
   scikit-learn's `TfidfVectorizer`.
3. **Story signature overlap** — compares a compact concept fingerprint (`primary_theme`, `location`,
   `conflict_type`, `hook_type`, `ending_type`, `relationship_dynamic`) against previous signatures to catch
   reworded repeats of the same premise (e.g. "rain + date + stuck + confession").

If the highest resulting score is **>= `DUPLICATE_THRESHOLD`** (default `72`, configurable in `.env`), the
story is rejected and the AI is automatically asked to regenerate with explicit instructions to vary the
premise, location, conflict, hook and ending. This repeats up to `MAX_REGENERATION_ATTEMPTS` (default `3`).
If every attempt is still a duplicate, the API returns `502` with a clear error message instead of silently
saving a duplicate story. Every attempt (accepted, rejected, invalid JSON, or errored) is recorded in the
`generation_logs` table for auditing.

Duplicate checks are always scoped to `category_id`, so categories never interfere with each other's history.

## 6. How to reset the database

```powershell
cd backend
Remove-Item story_factory.db
alembic upgrade head
```

This recreates an empty SQLite database with the latest schema. To switch to PostgreSQL later, just change
`DATABASE_URL` in `.env` (e.g. `postgresql+psycopg2://user:pass@host:5432/dbname`) — the SQLAlchemy models and
Alembic migrations are database-agnostic.

## 7. How to run tests

```powershell
cd backend
.venv\Scripts\python.exe -m pytest -v
```

All OpenAI calls are mocked via a `FakeAIProvider` fixture (see `tests/conftest.py`) — **no real API credits
are ever consumed by the test suite**. Tests cover category CRUD, story generation (mocked), duplicate
detection (normalized title, TF-IDF, signature overlap), category isolation, episode numbering, and deletion.

---

## 8. Running the full application

1. Start the backend (`uvicorn app.main:app --reload`, port 8000).
2. Start the frontend (`npm run dev`, port 5173).
3. Open `http://localhost:5173` in a browser.
4. Click **+ Add New Category**, fill in the form (name, description, language, duration, visual style,
   custom AI instructions) and save.
5. Click the new category card's **Open Stories** button.
6. Click **GENERATE NEW STORY**, optionally enter a story idea, and click **GENERATE UNIQUE STORY**.
7. The backend calls OpenAI, runs duplicate detection, and (on success) saves the story with its scenes and
   SEO package; the UI navigates to the story detail page.
8. From the story detail page you can edit fields, regenerate the entire story, regenerate individual scenes,
   or delete the story (with confirmation).

---

## 9. Known limitations

- Story generation requires a valid `OPENAI_API_KEY`; without one, `/api/categories/{id}/stories/generate`
  returns a `400` with a clear configuration error instead of a fabricated story.
- Generation progress messages in the UI (`Creating a unique story...` / `Checking against previous
  stories...`) are simulated client-side while awaiting the single synchronous API response — the backend
  does not currently stream intermediate progress events.
- SEO package fields are read-only in the UI (editing stories/scenes is supported per the spec; a dedicated
  SEO-edit endpoint was not part of the required API surface).
- Designed for local development first; before a public deployment you should add authentication/authorization,
  rate limiting, and move `DATABASE_URL` to a managed PostgreSQL instance.
