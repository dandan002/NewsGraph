import os
import httpx
from datetime import datetime, timezone, date

EDINET_INDEX_URL = "https://disclosure2.edinet-fsa.go.jp/api/v2/documents.json"


async def fetch_edinet() -> list[dict]:
    """Fetch today's EDINET filing index and return timely disclosure docs."""
    today = date.today().strftime("%Y-%m-%d")
    api_key = os.environ.get("EDINET_API_KEY", "")

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        res = await client.get(
            EDINET_INDEX_URL,
            params={"date": today, "type": 2, "Subscription-Key": api_key},
        )
        res.raise_for_status()
        if not res.text.strip():
            return []
        data = res.json()
    results = data.get("results", [])

    articles = []

    # Filter for timely disclosures first, then cap at 30
    timely_docs = [
        doc for doc in results
        if doc.get("formCode", "").startswith("140") and doc.get("docID")
    ]

    for doc in timely_docs[:30]:
        doc_id = doc.get("docID")
        doc_type = doc.get("formCode", "")
        company = doc.get("filerName", "")
        submitted_at = doc.get("submitDateTime", "")

        url = (
            f"https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp"
            f"?uji.verb=W1E63011CXP001&uji.bean=ee.bean.W1E63011.EEW1E63011Bean"
            f"&TID=W1E63011&PID=W1E63011&SESSIONKEY=&headFlg=false&docID={doc_id}"
        )

        raw_text = (
            f"EDINET Filing: {doc_type} by {company}. "
            f"Filed: {submitted_at}. Document ID: {doc_id}."
        )

        articles.append({
            "url": url,
            "source_name": "EDINET",
            "credibility_tier": 1,
            "country": "JP",
            "published_at": submitted_at or datetime.now(timezone.utc).isoformat(),
            "raw_text": raw_text,
        })

    return articles
