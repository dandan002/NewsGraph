import os
import anthropic

_client = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = (
    "You read raw source material — filings, wire copy, translated articles — and write "
    "natural, 300 character summaries for a US investor audience. "
    "Lead with the most market-relevant fact. Name the company and what it does. "
    "Include key figures (revenue, profit, guidance, rates, dates); convert yen to USD at approximate current rates. "
    "Omit regulatory form numbers and filing codes. "
    "Use active voice and past tense for completed actions. "
    "If the source is in Japanese, translate accurately and use the company's common English name where one exists. "
    "Choose the category that best fits: "
    "FILING for routine regulatory filings and disclosures; "
    "EARNINGS for quarterly or annual financial results; "
    "EVENT for corporate actions, shareholder meetings, or one-off announcements; "
    "MACRO for economic data, central bank decisions, or government policy; "
    "M&A for mergers, acquisitions, tender offers, or stake changes."
)

_TOOL = {
    "name": "publish_summary",
    "description": "Publish a structured summary for the news feed.",
    "input_schema": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["FILING", "EARNINGS", "EVENT", "MACRO", "M&A"],
                "description": "Content category label shown on the card.",
            },
            "headline": {
                "type": "string",
                "description": "One punchy sentence, max 160 characters.",
            },
            "summary": {
                "type": "string",
                "description": "3-5 additional sentences of context and figures.",
            },
        },
        "required": ["category", "headline", "summary"],
    },
}


async def summarize_article(raw_text: str) -> str:
    """Summarize source material and return a formatted string: 'CATEGORY: headline summary'."""
    message = await _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[_TOOL],
        tool_choice={"type": "tool", "name": "publish_summary"},
        messages=[{"role": "user", "content": raw_text[:8000]}],
    )

    tool_use = next(b for b in message.content if b.type == "tool_use")
    data = tool_use.input
    category = data["category"]
    headline = data["headline"].strip()
    summary = data["summary"].strip()
    return f"{category}: {headline} {summary}".strip()
