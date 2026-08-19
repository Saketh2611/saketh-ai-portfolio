-- =============================================================================
-- 001_initial_schema.sql
-- Run this once in the Supabase SQL editor (or via psql) before starting the app.
-- =============================================================================

-- pgvector extension for embedding similarity search
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- profile: single-row table. There is only ever one profile (you).
-- ---------------------------------------------------------------------------
create table if not exists profile (
    id uuid primary key default gen_random_uuid(),
    full_name text not null default '',
    headline text not null default '',
    summary text not null default '',
    photo_url text,
    resume_pdf_url text,
    email text,
    github_url text,
    linkedin_url text,
    phone text,
    location text,
    updated_at timestamptz not null default now()
);

-- Seed the single profile row if it doesn't exist yet.
-- The app assumes exactly one row exists — admin endpoints UPDATE this row,
-- they never INSERT a new one.
insert into profile (full_name, headline)
select '', ''
where not exists (select 1 from profile);

-- ---------------------------------------------------------------------------
-- projects: one row per project shown on the site
-- ---------------------------------------------------------------------------
create table if not exists projects (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    github_url text,
    live_url text,
    short_description text not null default '',
    full_description text not null default '',
    tech_stack text[] not null default '{}',
    display_order int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_projects_display_order on projects (display_order);

-- ---------------------------------------------------------------------------
-- chunks: the RAG knowledge base. One table for all source types —
-- profile summary, project descriptions, resume sections — tagged by
-- source_type. Keeping this as one table (not three) means the retriever
-- runs a single query across everything instead of a UNION across tables.
-- ---------------------------------------------------------------------------
create table if not exists chunks (
    id uuid primary key default gen_random_uuid(),
    source_type text not null check (source_type in ('profile', 'project', 'resume_section')),
    source_id uuid,  -- FK to projects.id when source_type = 'project', else null
    content text not null,
    embedding vector(1024) not null,  -- BGE-M3 = 1024 dimensions
    metadata jsonb not null default '{}',  -- {title, github_url, section} for citations
    created_at timestamptz not null default now(),

    constraint fk_chunks_project
        foreign key (source_id) references projects (id) on delete cascade
);

-- IVFFlat index for approximate nearest-neighbor search.
-- lists=100 is a reasonable default for a few thousand chunks (this portfolio
-- will have low hundreds at most). Revisit lists count only if chunk volume
-- grows into the tens of thousands.
create index if not exists idx_chunks_embedding
    on chunks using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

create index if not exists idx_chunks_source_type on chunks (source_type);
create index if not exists idx_chunks_source_id on chunks (source_id);

-- ---------------------------------------------------------------------------
-- admin_credentials: single admin user. No username needed — there's
-- exactly one admin account for this whole app.
-- ---------------------------------------------------------------------------
create table if not exists admin_credentials (
    id uuid primary key default gen_random_uuid(),
    password_hash text not null,
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- chat_logs: optional but recommended — lets you see what recruiters
-- actually asked, which is useful signal for improving chunk content later.
-- ---------------------------------------------------------------------------
create table if not exists chat_logs (
    id uuid primary key default gen_random_uuid(),
    query text not null,
    answer text not null,
    retrieved_chunk_ids uuid[] not null default '{}',
    ip_address text,
    created_at timestamptz not null default now()
);

create index if not exists idx_chat_logs_created_at on chat_logs (created_at desc);
