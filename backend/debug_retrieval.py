import asyncio
from app.db.session import AsyncSessionLocal
from app.services.embedding_service import embed_text
from sqlalchemy import text

async def main():
    vec = embed_text("DroidPilot")
    vec_str = "[" + ",".join(str(v) for v in vec) + "]"

    async with AsyncSessionLocal() as db:
        # 1. Plain count in this exact session
        r1 = await db.execute(text("SELECT count(*) FROM chunks"))
        print(f"count(*) in this session: {r1.scalar()}")

        # 2. The exact same ORDER BY query, but selecting count(*) OVER it instead of rows,
        #    to see if Postgres itself thinks there are 0 matching rows or if something
        #    is happening after the DB returns them
        r2 = await db.execute(text(
            f"SELECT count(*) FROM (SELECT id FROM chunks ORDER BY embedding <=> '{vec_str}'::vector LIMIT 5) sub"
        ))
        print(f"count(*) over the ORDER BY subquery: {r2.scalar()}")

        # 3. Same ORDER BY, but without vector at all - order by something trivial
        r3 = await db.execute(text("SELECT id FROM chunks ORDER BY created_at LIMIT 5"))
        rows3 = r3.all()
        print(f"Got {len(rows3)} rows ordering by created_at (no vector involved)")

asyncio.run(main())