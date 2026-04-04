import feedparser
import httpx
from datetime import datetime, timezone

JAPANTIMES_RSS_URL = "https://www.japantimes.co.jp/feed/"


async def fetch_japantimes() -> list[dict]:
    """Fetch Japan Times RSS feed. Returns raw article dicts ready for pipeline."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        res = await client.get(JAPANTIMES_RSS_URL, headers={"User-Agent": "Mozilla/5.0"})
        res.raise_for_status()

    feed = feedparser.parse(res.text)
    articles = []

    for entry in feed.entries:
        title = entry.get("title", "").strip()
        description = entry.get("summary", "").strip()
        if not title:
            continue

        url = entry.get("link", "").strip()
        if not url:
            continue

        pub = entry.get("published_parsed")
        published_at = (
            datetime(*pub[:6], tzinfo=timezone.utc).isoformat() if pub else None
        )

        raw_text = f"{title}. {description}" if description else title

        articles.append({
            "url": url,
            "source_name": "The Japan Times",
            "credibility_tier": 2,
            "country": "JP",
            "published_at": published_at,
            "raw_text": raw_text,
        })

    return articles
