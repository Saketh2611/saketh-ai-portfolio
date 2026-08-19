# Saketh AI — Backend

FastAPI + Supabase (Postgres/pgvector) + BGE-M3 embeddings + Groq. Serves
the public portfolio API and the RAG chatbot, plus an authenticated admin
API for content management.

## Architecture

```
app/
├── main.py                  # entrypoint, CORS, router registration, startup
├── core/
│   ├── config.py             # env-driven settings (single source of truth)
│   ├── security.py           # password hashing + JWT
│   ├── deps.py                # require_admin FastAPI dependency
│   ├── bootstrap.py           # idempotent admin password creation
│   └── rate_limit.py          # in-memory sliding window for /chat
├── db/
│   └── session.py             # async SQLAlchemy engine + session dependency
├── models/
│   ├── orm.py                  # SQLAlchemy models
│   └── schemas.py               # Pydantic request/response contracts
├── services/
│   ├── embedding_service.py     # BGE-M3, loaded once as a singleton
│   ├── chunking_service.py       # text → retrieval-sized chunks
│   ├── retrieval_service.py       # pgvector cosine similarity search
│   ├── llm_service.py              # Groq call, grounded system prompt
│   ├── content_service.py           # orchestrates chunk+embed+persist
│   └── storage_service.py            # Supabase Storage uploads
└── api/
    ├── public/routes.py          # GET profile/projects/resume, POST chat
    └── admin/                     # auth, profile, project CRUD, stats
```

## Local setup

1. **Create a Supabase project** (free tier is enough). Note the project
   ref and database password.

2. **Run the migration.** Open the Supabase SQL editor and paste the
   contents of `migrations/001_initial_schema.sql`, then run it. This
   enables the `vector` extension and creates all tables + indexes.

3. **Create a Storage bucket** named `portfolio-assets` (Storage → New
   bucket → make it public, since photo/resume URLs need to be publicly
   viewable on the portfolio site).

4. **Copy `.env.example` to `.env`** and fill in every value:
   ```bash
   cp .env.example .env
   ```
   - `DATABASE_URL`: Supabase → Project Settings → Database → Connection
     string → URI (use the "Session pooler" one, not "Direct connection")
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API
   - `GROQ_API_KEY`: from console.groq.com
   - `JWT_SECRET_KEY`: generate with
     `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ADMIN_PASSWORD`: whatever you want to log into `/admin` with

5. **Install dependencies and run:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

   First startup will download BGE-M3 (~2GB) and create the admin
   credentials row automatically. This takes a minute the first time.

6. **Verify:** `curl http://localhost:8000/health` → `{"status": "ok", ...}`

   Interactive API docs: `http://localhost:8000/docs`

## Forgot your admin password?

```bash
python -m scripts.bootstrap_admin --reset
```
This force-overwrites the stored hash with whatever `ADMIN_PASSWORD` is
currently set to in `.env`. Change `.env` first if you want a different
password, then run the reset.

## Deploying

Any container host works (Render, Railway, Fly.io). The `Dockerfile` is
ready to build as-is:

```bash
docker build -t saketh-ai-backend .
docker run -p 8000:8000 --env-file .env saketh-ai-backend
```

Set the same env vars from `.env` in your host's environment/secrets
panel — do not commit `.env` to git (it's in `.gitignore`).

**Cold start note:** BGE-M3 loads at startup (see `main.py` lifespan).
On a free-tier host that spins down on idle, the first request after a
cold start will take longer while the model reloads. If this matters for
a demo, ping `/health` a minute before a call to warm it up, or upgrade
to an always-on tier.

## Adding content after launch

Everything goes through the admin API (gated by `/api/admin/login`):
- `PUT /api/admin/profile` — name, headline, summary (summary auto-re-embeds)
- `POST /api/admin/profile/photo` — multipart photo upload
- `POST /api/admin/profile/resume` — multipart resume PDF upload
- `POST /api/admin/profile/resume-section` — paste extra text (achievements,
  positions of responsibility) for the bot to know, without it being a "project"
- `POST /api/admin/projects` — title + github_url + full_description →
  auto chunked, embedded, and retrievable immediately
- `GET /api/admin/stats` — chunk/project counts, sanity-check that content
  is actually indexed

The admin frontend (`../frontend/src/app/admin`) wraps all of this in a UI —
this section is here for anyone testing directly against the API (e.g. via
`/docs` or curl) without the frontend running.
