# Saketh AI — Portfolio

A portfolio site that's also a working RAG application: a chatbot embedded
on the homepage answers recruiter questions grounded in your actual resume,
projects, and experience — not generic LLM knowledge. An admin panel lets
you manage all of that content (photo, profile, resume, projects) without
touching code or redeploying.

```
Recruiter question → FastAPI → embed (BGE-M3) → pgvector search
                    → Groq (grounded, cited answer) → answer + source links
```

## Structure

```
saketh-ai-portfolio/
├── backend/     FastAPI + Supabase (Postgres/pgvector) + BGE-M3 + Groq
│                See backend/README.md for full setup.
└── frontend/    Next.js 14 (App Router) + Tailwind
                 Public site + chat widget + admin dashboard.
```

## Setup order

The backend has to exist and be reachable before the frontend is useful
(the homepage fetches profile/projects on load, and will show a clear
"couldn't reach the backend" screen if it isn't running — that's
intentional, not a bug, so a misconfigured `NEXT_PUBLIC_API_URL` is obvious
immediately rather than failing silently).

1. **Backend first.** Follow `backend/README.md` start to finish: Supabase
   project → run the migration → create the storage bucket → `.env` →
   `pip install` → `uvicorn app.main:app --reload`. Confirm
   `curl http://localhost:8000/health` returns `{"status": "ok"}` before
   moving on.

2. **Frontend second.**
   ```bash
   cd frontend
   cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at your backend
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`. You'll see the identity strip is empty
   and the chat has nothing to retrieve yet — that's expected on a fresh
   database. Go to step 3.

3. **Fill in your content via the admin panel.**
   Visit `http://localhost:3000/admin` → log in with the `ADMIN_PASSWORD`
   you set in the backend's `.env` → you'll land on the dashboard where you
   can:
   - Upload your photo (drag/drop or click)
   - Fill in your name, headline, and summary
   - Upload your resume PDF
   - Add projects — paste a title, GitHub link, and the full project
     write-up. Each one is automatically chunked and embedded into the
     chatbot's knowledge base the moment you save it — no separate
     "publish" or "reindex" step to remember.

   Refresh the public homepage and everything you entered will be live —
   the profile, the project cards, and the chatbot's ability to answer
   questions about it.

## A note on scope

This was built to match a stated 3–5 day build budget: the RAG pipeline,
retrieval quality, and grounded-answer behavior got the real engineering
attention, since that's the part a recruiter (or an interviewer asking you
to explain the architecture) will actually probe. The visual design is
intentionally distinctive rather than templated, but it's not been pushed
further than "looks deliberate and finished" — per the original framing,
the interesting part of this project is that it's a real deployed GenAI
application, not that the CSS is exhaustive.

## Two things worth knowing before you deploy

**Next.js dependency version.** The frontend pins `next@14.2.35`, the
official patched floor for the 14.x line as of this build (confirmed
against Next.js's own security advisories, not just the version that
happened to be newest when this was written). One further advisory
(`GHSA-955p-x3mx-jcvp`, published after 14.x's support window closed) only
has a fix on 15.x/16.x, and only applies to apps using Server Actions
(`"use server"`) — this codebase doesn't use any, so it doesn't apply here.
If you later add a Server Action to this codebase, re-run `npm audit` and
consider whether a major-version upgrade makes sense at that point; jumping
to Next 15/16 now, unprompted, would touch App Router APIs across every
file in `frontend/src/app` without you having asked for that migration.

**Font fetching needs real internet access.** `layout.tsx` uses
`next/font/google` to self-host Space Grotesk, IBM Plex Sans, and IBM Plex
Mono at build time — this requires reaching `fonts.googleapis.com` during
`npm run build`. On a normal machine, Vercel, or any CI with standard
internet access this just works. If you ever build inside a heavily
network-restricted sandbox and see a `NextFontError`, that's this
constraint, not a code problem — the full pipeline (TypeScript, Tailwind,
every route, every component) was verified end-to-end with a temporary
system-font stand-in during development specifically to confirm this.

## Deploying

- **Backend**: any container host (Render, Railway, Fly.io) using
  `backend/Dockerfile`. See `backend/README.md` for env vars and the
  cold-start note about BGE-M3.
- **Frontend**: Vercel is the path of least resistance for Next.js. Set
  `NEXT_PUBLIC_API_URL` to your deployed backend's URL in Vercel's
  environment settings, then set the backend's `CORS_ORIGINS` to include
  your Vercel domain.

## Adding this to your resume

Once deployed, this is a legitimate project entry: it's a full-stack RAG
application (FastAPI, pgvector, BGE-M3 embeddings, Groq inference, JWT
auth, Next.js) that recruiters can interact with directly rather than
read about. Link it, and consider pointing them straight at the chat
widget — "ask it about my AWS experience" is a stronger opener than a
list of bullet points.
