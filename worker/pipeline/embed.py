import os
import httpx

OPENROUTER_URL = "https://openrouter.ai/api/v1/embeddings"


async def embed_text(text: str) -> list[float]:
    """Generate a 1536-dim embedding via OpenRouter (text-embedding-3-small)."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
                "Content-Type": "application/json",
            },
            json={"model": "openai/text-embedding-3-small", "input": text},
            timeout=30.0,
        )
        res.raise_for_status()
        data = res.json()
        embedding = data.get("data", [{}])[0].get("embedding")
        if not embedding:
            raise ValueError(f"Unexpected embedding response shape: {data}")
        return embedding
