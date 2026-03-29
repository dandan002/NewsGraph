import asyncio
import os
from supabase import create_client, Client

_db: Client | None = None


def get_db() -> Client:
    global _db
    if _db is None:
        _db = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )
    return _db


async def upsert_article(article: dict) -> None:
    """
    article dict must have keys:
      url, source_name, credibility_tier, country,
      published_at (ISO string or None), summary_en, embedding (list[float])
    """
    db = get_db()
    row = {
        "url": article["url"],
        "source_name": article["source_name"],
        "credibility_tier": article["credibility_tier"],
        "country": article["country"],
        "published_at": article.get("published_at"),
        "summary_en": article["summary_en"],
        "embedding": article["embedding"],
    }
    # ON CONFLICT DO NOTHING — atomic dedup on unique url constraint
    await asyncio.to_thread(
        lambda: db.table("articles").upsert(row, on_conflict="url", ignore_duplicates=True).execute()
    )


async def upsert_snapshot(snapshot: dict) -> None:
    """
    snapshot dict must have keys:
      asset, market_type, mark_price, open_interest, funding_rate
    """
    db = get_db()
    row = {
        "asset": snapshot["asset"],
        "market_type": snapshot["market_type"],
        "mark_price": snapshot.get("mark_price"),
        "open_interest": snapshot.get("open_interest"),
        "funding_rate": snapshot.get("funding_rate"),
    }
    await asyncio.to_thread(
        lambda: db.table("market_snapshots").insert(row).execute()
    )
