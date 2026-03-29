import httpx
from datetime import datetime, timezone, date

EDINET_INDEX_URL = "https://disclosure.edinet-fsa.go.jp/api/v2/documents.json"


async def fetch_edinet() -> list[dict]:
    """Fetch today's EDINET filing index and return timely disclosure docs."""
    today = date.today().strftime("%Y-%m-%d")

    async with httpx.AsyncClient(timeout=20.0) as client:
        res = await client.get(
            EDINET_INDEX_URL,
            params={"date": today, "type": 2},  # type=2: documents with attachments
        )
        res.raise_for_status()

    data = res.json()
    results = data.get("results", [])

    articles = []
    for doc in results[:30]:  # Cap at 30 per cycle
        doc_id = doc.get("docID")
        doc_type = doc.get("formCode", "")
        company = doc.get("filerName", "")
        submitted_at = doc.get("submitDateTime", "")

        # Filter for timely disclosures (formCode starts with "140")
        if not doc_type.startswith("140"):
            continue

        if not doc_id:
            continue

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
