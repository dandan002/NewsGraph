import httpx
import csv
import io
import zipfile
from datetime import datetime, timezone
from sources.utils import extract_text

# GDELT GKG v2 15-minute CSV master list
GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"


def _has_japan_location(locations_str: str) -> bool:
    """Check if any location block in the GKG locations field is Japan."""
    if not locations_str:
        return False
    if "Japan" in locations_str:
        return True
    for block in locations_str.split(";"):
        parts = block.split("#")
        if len(parts) >= 3 and parts[2] == "JP":
            return True
    return False


def _parse_gkg_csv(content: bytes) -> str:
    """Decompress zip if needed, return CSV text."""
    if content[:2] == b"PK":  # zip magic bytes
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            name = next(n for n in zf.namelist() if n.endswith(".csv") or n.endswith(".CSV"))
            return zf.read(name).decode("utf-8", errors="replace")
    return content.decode("utf-8", errors="replace")


async def parse_gkg_articles(csv_text: str, client: httpx.AsyncClient, cap: int = 20) -> list[dict]:
    """Parse a GDELT GKG CSV and return Japan-filtered article dicts."""
    articles = []
    reader = csv.reader(io.StringIO(csv_text, newline=""), delimiter="\t")

    for row in reader:
        if len(row) < 5:
            continue
        try:
            if not _has_japan_location(row[4]):
                continue

            source_urls = row[10].split("<UDIV>") if len(row) > 10 else []
            source_names = row[9].split(",") if len(row) > 9 else []
            pub_dt = datetime.strptime(row[0][:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)

            for url, src in zip(source_urls[:3], source_names[:3]):
                url = url.strip()
                if not url.startswith("http"):
                    continue
                raw_text = f"Source: {src.strip()}. Article URL: {url}."
                try:
                    page = await client.get(url, timeout=8.0)
                    raw_text = extract_text(page.text, max_chars=5000)
                except Exception:
                    pass

                articles.append({
                    "url": url,
                    "source_name": src.strip() or "GDELT",
                    "credibility_tier": 3,
                    "country": "JP",
                    "published_at": pub_dt.isoformat(),
                    "raw_text": raw_text,
                })
                if len(articles) >= cap:
                    return articles
        except Exception:
            continue

    return articles


async def fetch_gdelt() -> list[dict]:
    """Fetch latest GDELT 15-min GKG update, filter for Japan articles."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        res = await client.get(GDELT_MASTER_URL)
        res.raise_for_status()

        lines = res.text.strip().split("\n")
        gkg_line = next((l for l in lines if "gkg.csv" in l.lower()), None)
        if not gkg_line:
            return []

        gkg_url = gkg_line.split()[-1]
        res = await client.get(gkg_url, timeout=60.0)
        res.raise_for_status()

        csv_text = _parse_gkg_csv(res.content)
        return await parse_gkg_articles(csv_text, client, cap=20)
