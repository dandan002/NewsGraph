import feedparser
import httpx
from datetime import datetime, timezone

NHK_RSS_URL = "https://www3.nhk.or.jp/rss/news/cat0.xml"


async def fetch_nhk() -> list[dict]:
    """Fetch NHK JP RSS feed. Returns raw article dicts ready for pipeline."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        res = await client.get(NHK_RSS_URL)
        res.raise_for_status()

        feed = feedparser.parse(res.text)
        articles = []

        for entry in feed.entries:
            raw_text = entry.get("summary", "") or entry.get("title", "")
            try:
                page = await client.get(entry.link, timeout=10.0)
                raw_text = page.text[:6000]
            except Exception:
                pass  # Fall back to summary

            pub = entry.get("published_parsed")
            published_at = (
                datetime(*pub[:6], tzinfo=timezone.utc).isoformat() if pub else None
            )

            articles.append({
                "url": entry.link,
                "source_name": "NHK",
                "credibility_tier": 2,
                "country": "JP",
                "published_at": published_at,
                "raw_text": raw_text,
            })

    return articles
