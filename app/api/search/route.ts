import { createClient } from '@/lib/supabase/server'
import { embed } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  tier?: number | null
  dateRange?: number // days
}

interface Article {
  id: string
  url: string
  source_name: string
  credibility_tier: number
  published_at: string
  summary_en: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: SearchRequest = await request.json()
  const { query, tier, dateRange = 7 } = body

  // Embed the query (or use recent articles if query is empty)
  let embedding: number[] | null = null
  if (query && query.trim()) {
    embedding = await embed(query)
  }

  const since = new Date(Date.now() - dateRange * 24 * 3_600_000).toISOString()

  // If we have an embedding, use pgvector cosine similarity via RPC
  if (embedding) {
    const { data, error } = await supabase.rpc('search_articles', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 10,
      filter_tier: tier ?? null,
      filter_since: since,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ articles: data as Article[] })
  }

  // Fallback: recent articles sorted by date
  let dbQuery = supabase
    .from('articles')
    .select('id, url, source_name, credibility_tier, published_at, summary_en')
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(10)

  if (tier !== null && tier !== undefined) {
    dbQuery = dbQuery.eq('credibility_tier', tier)
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data })
}
