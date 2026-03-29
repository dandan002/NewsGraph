import os
import anthropic

_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

SYSTEM_PROMPT = (
    "You are a macro research analyst. Given a foreign-language news article, "
    "respond with a 2-3 sentence English summary written for a professional investor. "
    "Be factual and concise. Do not editorialize."
)


async def summarize_article(raw_text: str) -> str:
    """Translate and summarize a foreign-language article in one Claude call."""
    # Truncate to avoid token limits
    text = raw_text[:8000]
    message = _client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    return message.content[0].text.strip()
