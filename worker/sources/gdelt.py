import httpx
import csv
import io
from datetime import datetime, timezone

# GDELT GKG v2 15-minute CSV master list
GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"


async def fetch_gdelt() -> list[dict]:
    """Fetch latest GDELT 15-min update, filter for Japan-sourced articles."""
    async with httpx.AsyncClient() as client:
        res = await client.get(GDELT_MASTER_URL, timeout=20.0)
        res.raise_for_status()

    # lastupdate.txt has 3 lines; find the GKG CSV line
    lines = res.text.strip().split("\n")
    gkg_line = next((line for line in lines if "gkg.csv" in line), None)
    if not gkg_line:
        return []

    gkg_url = gkg_line.split()[-1]

    async with httpx.AsyncClient() as client:
        res = await client.get(gkg_url, timeout=60.0)
        res.raise_for_status()

    articles = []
    reader = csv.reader(io.StringIO(res.text), delimiter="\t")

    for row in reader:
        if len(row) < 5:
            continue
        try:
            locations = row[4] if len(row) > 4 else ""
            if "Japan" not in locations and "JP" not in locations:
                continue

            source_urls = row[10].split("<UDIV>") if len(row) > 10 else []
            source_names = row[9].split(",") if len(row) > 9 else []

            date_str = row[0]  # YYYYMMDDHHMMSS
            pub_dt = datetime.strptime(date_str[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)

            for url, src in zip(source_urls[:3], source_names[:3]):
                url = url.strip()
                if not url.startswith("http"):
                    continue
                raw_text = f"Source: {src.strip()}. Article URL: {url}."
                try:
                    async with httpx.AsyncClient() as client:
                        page = await client.get(url, timeout=8.0, follow_redirects=True)
                    raw_text = page.text[:5000]
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
        except Exception:
            continue

    return articles[:20]  # Cap at 20 per cycle
