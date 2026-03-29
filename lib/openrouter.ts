const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings'

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/text-embedding-3-small',
      input: text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter embeddings failed: ${err}`)
  }

  const data = await res.json()
  return data.data[0].embedding as number[]
}
