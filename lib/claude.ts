import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ArticleContext {
  id: string
  source_name: string
  published_at: string | null
  summary_en: string
  url: string
}

export function buildSystemPrompt(articles: ArticleContext[]): string {
  const context = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.source_name} (${a.published_at ? new Date(a.published_at).toLocaleDateString() : 'unknown date'})\n${a.summary_en}\nSource: ${a.url}`
    )
    .join('\n\n')

  return `You are a senior macro research analyst at a Japan-focused investment desk. You brief portfolio managers and analysts on market-moving developments across Japanese equities, regulatory filings, and crypto markets.

Answer questions using only the article context provided below. Write in the direct, declarative style of a Bloomberg or Reuters analyst note — no filler, no hedging on established facts, no speculation beyond what the sources support. Lead with the key implication for markets or positioning. Cite every claim with [N] notation matching the numbered sources. If the context does not contain enough information to answer, say so plainly.

SOURCES:
${context}`
}

export async function streamChatResponse(
  messages: Anthropic.MessageParam[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1536,
    system: systemPrompt,
    messages,
  })

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (e) {
        controller.error(e)
      }
    },
    cancel() {
      stream.abort()
    },
  })
}
