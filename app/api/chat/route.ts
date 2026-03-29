import { createClient } from '@/lib/supabase/server'
import { embed } from '@/lib/openrouter'
import { buildSystemPrompt, streamChatResponse, type ArticleContext } from '@/lib/claude'
import { NextResponse } from 'next/server'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'

interface ChatRequest {
  messages: MessageParam[]
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { messages } = body
  const lastUserMessage = messages.at(-1)
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return NextResponse.json({ error: 'No user message' }, { status: 400 })
  }

  const userText =
    typeof lastUserMessage.content === 'string'
      ? lastUserMessage.content
      : (lastUserMessage.content as Array<{ type: string; text?: string }>)[0]?.text ?? ''

  if (!userText.trim()) {
    return NextResponse.json({ error: 'No text content in user message' }, { status: 400 })
  }

  let embedding: number[]
  try {
    embedding = await embed(userText)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Embedding failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const since = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString()

  const { data: articles } = await supabase.rpc('search_articles', {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
    filter_tier: null,
    filter_since: since,
  })

  const context: ArticleContext[] = ((articles as ArticleContext[] | null) ?? []).map((a) => ({
    id: a.id,
    source_name: a.source_name,
    published_at: a.published_at,
    summary_en: a.summary_en,
    url: a.url,
  }))

  const systemPrompt = buildSystemPrompt(context)
  const responseStream = await streamChatResponse(messages, systemPrompt)

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
