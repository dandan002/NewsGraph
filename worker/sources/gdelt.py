import httpx
import csv
import io
import sys
import zipfile
from datetime import datetime, timezone
from sources.utils import extract_text

csv.field_size_limit(min(sys.maxsize, 10_000_000))

# GDELT GKG v2 15-minute CSV master list
GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"


def _has_japan_location(locations_str: str, source_url: str = "") -> bool:
    """Return True if Japan dominates the GKG locations field or the source is a .jp domain."""
    # Japanese-domain sources are always relevant
    if source_url and ".jp/" in source_url:
        return True

    if not locations_str:
        return False

    # GDELT uses "JA" (not "JP") as Japan's country code
    blocks = [b for b in locations_str.split(";") if b.strip()]
    total = 0
    japan = 0
    for block in blocks:
        parts = block.split("#")
        if len(parts) < 3:
            continue
        total += 1
        if parts[2] == "JA":
            japan += 1

    # Japan must make up the majority of locations to avoid false positives
    # from articles that merely mention Japan in passing (e.g. Japanese athletes)
    return total > 0 and japan / total >= 0.6


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
        # GKG v2 tab-delimited fields (0-indexed):
        # 0: GKGRECORDID (YYYYMMDDHHMMSS-N), 1: DATE, 3: source name,
        # 4: document URL, 9: V1LOCATIONS, 10: V2ENHANCEDLOCATIONS
        if len(row) < 10:
            continue
        try:
            url = row[4].strip()
            if not _has_japan_location(row[9], source_url=url):
                continue
            if not url.startswith("http"):
                continue

            src = row[3].strip() or "GDELT"
            pub_dt = datetime.strptime(row[0][:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)

            raw_text = f"Source: {src}. Article URL: {url}."
            try:
                page = await client.get(url, timeout=8.0)
                raw_text = extract_text(page.text, max_chars=5000)
            except Exception:
                pass

            articles.append({
                "url": url,
                "source_name": src,
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
