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

  return `You are a macro research assistant for professional investors focused on Japanese equities and crypto markets. Answer questions using only the provided article context. Cite sources using [N] notation matching the numbered articles below. Be concise and factual.

CONTEXT:
${context}`
}

export async function streamChatResponse(
  messages: Anthropic.MessageParam[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder()

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
    cancel() {
      stream.abort()
    },
  })
}
