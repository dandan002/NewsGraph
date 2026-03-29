import feedparser
import httpx
from datetime import datetime, timezone

ASAHI_RSS_URL = "https://www.asahi.com/rss/asahi/newsheadlines.rdf"


async def fetch_asahi() -> list[dict]:
    """Fetch Asahi Shimbun RSS headlines. Returns raw article dicts ready for pipeline."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        res = await client.get(ASAHI_RSS_URL, headers={"User-Agent": "Mozilla/5.0"})
        res.raise_for_status()

    feed = feedparser.parse(res.text)
    articles = []

    for entry in feed.entries:
        title = entry.get("title", "").strip()
        if not title:
            continue

        pub = entry.get("published_parsed") or entry.get("updated_parsed")
        published_at = (
            datetime(*pub[:6], tzinfo=timezone.utc).isoformat() if pub else None
        )

        # Strip ?ref=rss tracking param from URL
        url = entry.get("link", "").split("?")[0]
        if not url:
            continue

        articles.append({
            "url": url,
            "source_name": "朝日新聞",
            "credibility_tier": 2,
            "country": "JP",
            "published_at": published_at,
            "raw_text": title,
        })

    return articles
