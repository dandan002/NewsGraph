import json
import os
import anthropic

_client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = (
    "Your job is to read raw source material — filings, wire copy, translated articles — and "
    "write a tight 2-3 sentence English summary suitable for a professional investor briefing. "
    "Lead with the most market-relevant fact. Name the company, regulator, or policy body involved. "
    "Include any figures, dates, or rates that matter. Use active voice and present tense where possible. "
    "If the source is in Japanese, translate accurately. "
    'Respond with a JSON object only, no other text. Format: {"headline": "...", "summary": "..."}'
)


async def summarize_article(raw_text: str) -> str:
    """Translate and summarize a foreign-language article in one Claude call.
    Returns a plain English summary string (headline + summary combined)."""
    text = raw_text[:8000]
    message = await _client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    raw = message.content[0].text.strip()

    # Extract JSON — find first { ... } block
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        return raw  # fallback: return as-is if no JSON found

    try:
        data = json.loads(raw[start:end])
        headline = data.get("headline", "").strip()
        summary = data.get("summary", "").strip()
        return f"{headline} {summary}".strip() if headline else summary
    except json.JSONDecodeError:
        return raw
