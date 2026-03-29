import os
import httpx
from datetime import datetime, timezone

NEWSAPI_URL = "https://newsapi.org/v2/top-headlines"


async def fetch_newsapi() -> list[dict]:
    """Fetch top Japanese headlines from NewsAPI."""
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        return []

    async with httpx.AsyncClient() as client:
        res = await client.get(
            NEWSAPI_URL,
            params={"country": "jp", "pageSize": 20, "apiKey": api_key},
            timeout=15.0,
        )
        res.raise_for_status()

    data = res.json()
    articles = []

    for item in data.get("articles", []):
        url = item.get("url", "")
        if not url:
            continue

        raw_text = " ".join(filter(None, [
            item.get("title", ""),
            item.get("description", ""),
            item.get("content", ""),
        ]))

        published_at = item.get("publishedAt")

        articles.append({
            "url": url,
            "source_name": item.get("source", {}).get("name", "NewsAPI"),
            "credibility_tier": 3,
            "country": "JP",
            "published_at": published_at,
            "raw_text": raw_text,
        })

    return articles
