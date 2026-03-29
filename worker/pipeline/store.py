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


async def url_exists(url: str) -> bool:
    db = get_db()
    result = db.table("articles").select("id").eq("url", url).limit(1).execute()
    return len(result.data) > 0


async def upsert_article(article: dict) -> None:
    """
    article dict must have keys:
      url, source_name, credibility_tier, country,
      published_at (ISO string or None), summary_en, embedding (list[float])
    """
    if await url_exists(article["url"]):
        return  # deduplicate

    db = get_db()
    db.table("articles").insert({
        "url": article["url"],
        "source_name": article["source_name"],
        "credibility_tier": article["credibility_tier"],
        "country": article["country"],
        "published_at": article.get("published_at"),
        "summary_en": article["summary_en"],
        "embedding": article["embedding"],
    }).execute()


async def upsert_snapshot(snapshot: dict) -> None:
    """
    snapshot dict must have keys:
      asset, market_type, mark_price, open_interest, funding_rate
    """
    db = get_db()
    db.table("market_snapshots").insert({
        "asset": snapshot["asset"],
        "market_type": snapshot["market_type"],
        "mark_price": snapshot.get("mark_price"),
        "open_interest": snapshot.get("open_interest"),
        "funding_rate": snapshot.get("funding_rate"),
    }).execute()
