"""
scripts/seed_personal_content.py

STANDALONE, ONE-TIME SCRIPT — not imported by the app, not called by
any route. Run manually from the backend/ folder:

    python -m scripts.seed_personal_content

Adds personal/interest content (hobbies, things outside work) as its
own source_type="personal" chunks, so the chatbot can answer "get to
know him" questions distinctly from professional/project questions.

Uses the exact same embed_texts() and DB session as the running app,
so these chunks are embedded in the same vector space as everything
else (Cohere embed-multilingual-v3.0, 1024-dim) and are immediately
retrievable by /chat — no separate index, no separate table.

Requires COHERE_API_KEY to be set in .env, same as the main app.

Safe to re-run: it checks for existing source_type="personal" chunks
first and skips insertion if any already exist, so running it twice
doesn't create duplicates. To force a re-seed after editing the
content below, delete existing personal chunks first:
    DELETE FROM chunks WHERE source_type = 'personal';
"""

import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.orm import Chunk
from app.services.chunking_service import split_into_chunks
from app.services.embedding_service import embed_texts

# --- Edit this section to add/change personal content ---
# Each entry becomes its own retrievable unit. Keep each one focused on
# a single topic so retrieval can match a specific question ("does he
# play sports?") to a specific, relevant chunk rather than one giant
# blob covering everything.

PERSONAL_ENTRIES: list[tuple[str, str]] = [
    (
        "Basketball",
        "Basketball has been a constant throughout Saketh's time at IIT Madras. "
        "He was selected among the top 20 players in NSO Basketball trials, competed "
        "at the Inter-School Basketball Tournament and Indian School Basketball League "
        "at a national level, and won gold in the Inter-Hostel Basketball Tournament "
        "during Deans & Schroeter's. It's one of the things he's been most consistently "
        "competitive in outside of academics and engineering.",
    ),
    (
        "Anime",
        "Saketh is an anime fan, with Dragon Ball among his favorites. He enjoys "
        "the genre for its storytelling and the way long-running series build up "
        "character arcs and world-building over time.",
    ),
    (
        "Gaming",
        "Outside of work, Saketh plays Free Fire in his downtime. It's a casual way "
        "he unwinds and spends time with friends online.",
    ),
    (
        "Travel and exploring",
        "Saketh has a strong interest in exploring and travel — trying new places, "
        "new experiences, and stepping outside familiar routines. This curiosity shows "
        "up in his engineering work too, where he's consistently drawn to picking up "
        "new tools, frameworks, and domains rather than staying in one comfort zone.",
    ),
    (
        "Friends and social life",
        "Saketh values his friendships highly and makes time for the people close to "
        "him alongside his demanding academic and engineering workload. Many of his "
        "extracurricular activities at IIT Madras — basketball, event coordination for "
        "SOC and Shaastra — involved close collaboration with friends and teammates.",
    ),
    (
        "Family",
        "Family matters a great deal to Saketh, and he stays close to and values the "
        "people closest to him even while balancing a demanding academic and "
        "professional schedule.",
    ),
]

# --- End editable section ---


async def seed_personal_content() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(
            select(Chunk.id).where(Chunk.source_type == "personal").limit(1)
        )
        if existing.scalar_one_or_none() is not None:
            print(
                "Personal chunks already exist in the database. Skipping to avoid "
                "duplicates. To re-seed after editing content, run:\n"
                "  DELETE FROM chunks WHERE source_type = 'personal';\n"
                "in Supabase SQL Editor, then run this script again."
            )
            return

        total_chunks_added = 0

        for title, content in PERSONAL_ENTRIES:
            raw_chunks = split_into_chunks(content)
            if not raw_chunks:
                continue

            prefixed = [f"{title}:\n\n{chunk}" for chunk in raw_chunks]
            embeddings = await embed_texts(prefixed)  # <-- await added: Cohere call is async

            for text, embedding in zip(prefixed, embeddings):
                db.add(
                    Chunk(
                        source_type="personal",
                        source_id=None,
                        content=text,
                        embedding=embedding,
                        metadata_={"title": title},
                    )
                )
                total_chunks_added += 1

            print(f"  Added: {title} ({len(raw_chunks)} chunk(s))")

        await db.commit()
        print(f"\nDone. Added {total_chunks_added} personal chunks across {len(PERSONAL_ENTRIES)} topics.")


if __name__ == "__main__":
    asyncio.run(seed_personal_content())