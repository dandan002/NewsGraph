#!/usr/bin/env python3
"""
One-time historical backfill: fetch ~30 days of EDINET filings and GDELT articles.

Usage:
    cd worker
    python3 backfill.py

Costs roughly $2-4 in Anthropic + OpenRouter API calls for 30 days of data.
Set DAYS and GDELT_FILES_PER_DAY below to control volume.
"""

import asyncio
import os
from datetime import date, timedelta, datetime, timezone

import httpx
import edinet_tools
from dotenv import load_dotenv

load_dotenv()

from pipeline.summarize import summarize_article
from pipeline.embed import embed_text
from pipeline.store import upsert_article
from sources.edinet import EDINET_FORM_CODES, _extract_text_from_zip, _fetch_doc_html
from sources.gdelt import _parse_gkg_csv, parse_gkg_articles, _has_japan_location

# --- Config ---
DAYS = 90                # How many days back to fetch
GDELT_FILES_PER_DAY = 2  # GDELT GKG files to sample per day (96 files/day total)
EDINET_CAP_PER_DAY = 15  # Max EDINET timely disclosures per day

GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt"


async def run_pipeline(article: dict) -> bool:
    """Summarize → embed → upsert one article. Returns True if stored."""
    try:
        summary = await summarize_article(article["raw_text"])
        embedding = await embed_text(summary)
        await upsert_article({**article, "summary_en": summary, "embedding": embedding})
        return True
    except Exception as e:
        print(f"  pipeline error for {article.get('url', '?')[:60]}: {e}")
        return False


# ── EDINET ──────────────────────────────────────────────────────────────────

async def backfill_edinet(days: int) -> None:
    today = date.today()
    total = 0

    api_key = os.environ.get("EDINET_API_KEY", "")

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for i in range(days):
            target = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            try:
                docs = await asyncio.to_thread(edinet_tools.documents, target)
            except Exception as e:
                print(f"EDINET {target}: fetch error — {e}")
                continue

            docs = [d for d in docs if d.doc_type_code in EDINET_FORM_CODES][:EDINET_CAP_PER_DAY]

            if not docs:
                print(f"EDINET {target}: 0 matching docs")
                continue

            print(f"EDINET {target}: {len(docs)} docs")
            for doc in docs:
                content = await _fetch_doc_html(client, doc.doc_id, api_key)
                doc_text = _extract_text_from_zip(content)
                published = (
                    doc.filing_datetime.isoformat()
                    if doc.filing_datetime
                    else datetime.now(timezone.utc).isoformat()
                )
                article = {
                    "url": (
                        f"https://disclosure2.edinet-fsa.go.jp/PLD_0001.aspx?DocumentID={doc.doc_id}"
                    ),
                    "source_name": "EDINET",
                    "credibility_tier": 1,
                    "country": "JP",
                    "published_at": published,
                    "raw_text": doc_text or (
                        f"EDINET Filing: {doc.doc_type_name} by {doc.filer_name}. "
                        f"Filed: {published}. Document ID: {doc.doc_id}."
                    ),
                }
                if await run_pipeline(article):
                    total += 1
                    print(f"  stored EDINET doc {doc.doc_id} ({(doc.filer_name or '')[:40]})")

    print(f"\nEDINET backfill complete: {total} articles stored")


# ── GDELT ────────────────────────────────────────────────────────────────────

async def _get_gdelt_urls_for_range(days: int) -> list[str]:
    """Fetch GDELT master file list and return GKG zip URLs for past N days."""
    cutoff = date.today() - timedelta(days=days)
    cutoff_str = cutoff.strftime("%Y%m%d")

    print("Fetching GDELT master file list (~200MB index)...")
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.get(GDELT_MASTER_URL)
        res.raise_for_status()

    urls = []
    for line in res.text.strip().splitlines():
        parts = line.split()
        if len(parts) < 3:
            continue
        url = parts[-1]
        if "gkg.csv" not in url.lower():
            continue
        # Extract date from filename: .../20260101000000.gkg.csv.zip
        fname = url.split("/")[-1]
        date_part = fname[:8]
        if date_part >= cutoff_str:
            urls.append(url)

    return urls


async def backfill_gdelt(days: int, files_per_day: int) -> None:
    urls = await _get_gdelt_urls_for_range(days)
    if not urls:
        print("No GDELT files found in range")
        return

    # Sample evenly: pick `files_per_day` files per calendar day
    by_day: dict[str, list[str]] = {}
    for url in urls:
        fname = url.split("/")[-1]
        day = fname[:8]
        by_day.setdefault(day, []).append(url)

    sampled: list[str] = []
    for day_urls in by_day.values():
        step = max(1, len(day_urls) // files_per_day)
        sampled.extend(day_urls[::step][:files_per_day])

    print(f"GDELT: {len(sampled)} files to process ({files_per_day}/day × {len(by_day)} days)")
    total = 0

    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
        for i, url in enumerate(sampled):
            fname = url.split("/")[-1]
            print(f"  [{i+1}/{len(sampled)}] {fname}")
            try:
                res = await client.get(url, timeout=90.0)
                res.raise_for_status()
                csv_text = _parse_gkg_csv(res.content)
                articles = await parse_gkg_articles(csv_text, client, cap=10)
            except Exception as e:
                print(f"    fetch/parse error: {e}")
                continue

            for article in articles:
                if await run_pipeline(article):
                    total += 1

            print(f"    stored {len(articles)} articles (running total: {total})")

    print(f"\nGDELT backfill complete: {total} articles stored")


# ── Main ─────────────────────────────────────────────────────────────────────

async def main() -> None:
    print(f"Starting backfill: {DAYS} days, EDINET cap {EDINET_CAP_PER_DAY}/day, "
          f"GDELT {GDELT_FILES_PER_DAY} files/day\n")

    await backfill_edinet(DAYS)
    print()
    await backfill_gdelt(DAYS, GDELT_FILES_PER_DAY)

    print("\nDone. Run this in Supabase SQL Editor to rebuild the vector index:")
    print("  REINDEX INDEX articles_embedding_idx;")


if __name__ == "__main__":
    asyncio.run(main())
