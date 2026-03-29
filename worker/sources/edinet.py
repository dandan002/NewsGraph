import io
import asyncio
import zipfile
from datetime import datetime, timezone, date

import edinet_tools
from sources.utils import extract_text

# Annual, quarterly, semi-annual, extraordinary reports
EDINET_FORM_CODES = {"120", "140", "160", "180"}


def _extract_text_from_zip(content: bytes) -> str:
    """Extract readable text from an EDINET document ZIP, or return empty string."""
    try:
        if content[:2] != b"PK":
            return ""
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            html_files = [n for n in zf.namelist() if n.lower().endswith((".htm", ".html"))]
            if not html_files:
                return ""
            # Prefer the largest HTML file (most likely the main document body)
            html_files.sort(key=lambda n: zf.getinfo(n).file_size, reverse=True)
            html = zf.read(html_files[0]).decode("utf-8", errors="replace")
            return extract_text(html, max_chars=6000)
    except Exception:
        return ""


async def fetch_edinet() -> list[dict]:
    """Fetch today's EDINET filing index and return annual, quarterly, semi-annual, and extraordinary docs."""
    today = date.today().strftime("%Y-%m-%d")

    docs = await asyncio.to_thread(edinet_tools.documents, today)
    docs = [d for d in docs if d.doc_type_code in EDINET_FORM_CODES][:30]

    articles = []
    for doc in docs:
        try:
            content = await asyncio.to_thread(doc.fetch)
        except Exception:
            content = b""

        doc_text = _extract_text_from_zip(content)
        raw_text = doc_text or (
            f"EDINET Filing: {doc.doc_type_name} by {doc.filer_name}. "
            f"Filed: {doc.filing_datetime}. Document ID: {doc.doc_id}."
        )

        published = (
            doc.filing_datetime.isoformat()
            if doc.filing_datetime
            else datetime.now(timezone.utc).isoformat()
        )

        articles.append({
            "url": (
                f"https://disclosure.edinet-fsa.go.jp/E01EW/BLMainController.jsp"
                f"?uji.verb=W1E63011CXP001&uji.bean=ee.bean.W1E63011.EEW1E63011Bean"
                f"&TID=W1E63011&PID=W1E63011&SESSIONKEY=&headFlg=false&docID={doc.doc_id}"
            ),
            "source_name": "EDINET",
            "credibility_tier": 1,
            "country": "JP",
            "published_at": published,
            "raw_text": raw_text,
        })

    return articles
