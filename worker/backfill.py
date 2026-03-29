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
import io
import os
import zipfile
from datetime import date, timedelta, datetime, timezone

import httpx
from dotenv import load_dotenv

load_dotenv()

from pipeline.summarize import summarize_article
from pipeline.embed import embed_text
from pipeline.store import upsert_article
from sources.gdelt import _parse_gkg_csv, parse_gkg_articles, _has_japan_location
from sources.utils import extract_text

# --- Config ---
DAYS = 30                # How many days back to fetch
GDELT_FILES_PER_DAY = 2  # GDELT GKG files to sample per day (96 files/day total)
EDINET_CAP_PER_DAY = 15  # Max EDINET timely disclosures per day

GDELT_MASTER_URL = "http://data.gdeltproject.org/gdeltv2/masterfilelist.txt"
EDINET_URL = "https://disclosure.edinet-fsa.go.jp/api/v2/documents.json"


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

    async with httpx.AsyncClient(timeout=20.0) as client:
        for i in range(days):
            target = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            try:
                res = await client.get(EDINET_URL, params={"date": target, "type": 2})
                res.raise_for_status()
                results = res.json().get("results", [])
            except Exception as e:
                print(f"EDINET {target}: fetch error — {e}")
                continue

            timely = [
                doc for doc in results
                if doc.get("formCode", "").startswith("140") and doc.get("docID")
            ][:EDINET_CAP_PER_DAY]

            if not timely:
                print(f"EDINET {target}: 0 timely disclosures")
                continue

            print(f"EDINET {target}: {len(timely)} docs")
            for doc in timely:
                doc_id = doc["docID"]
                url = (
                    f"https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp"
                    f"?uji.verb=W1E63011CXP001&uji.bean=ee.bean.W1E63011.EEW1E63011Bean"
                    f"&TID=W1E63011&PID=W1E63011&SESSIONKEY=&headFlg=false&docID={doc_id}"
                )
                article = {
                    "url": url,
                    "source_name": "EDINET",
                    "credibility_tier": 1,
                    "country": "JP",
                    "published_at": doc.get("submitDateTime") or datetime.now(timezone.utc).isoformat(),
                    "raw_text": (
                        f"EDINET Filing: {doc.get('formCode')} by {doc.get('filerName')}. "
                        f"Filed: {doc.get('submitDateTime')}. Document ID: {doc_id}."
                    ),
                }
                if await run_pipeline(article):
                    total += 1
                    print(f"  stored EDINET doc {doc_id} ({doc.get('filerName', '')[:40]})")

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
