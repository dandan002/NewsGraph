import { createClient } from '@/lib/supabase/server'
import { embed } from '@/lib/openrouter'
import { NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  tier?: number | null
  dateRange?: number
}

interface Article {
  id: string
  url: string
  source_name: string
  credibility_tier: number
  published_at: string | null
  summary_en: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: SearchRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { query = '', dateRange = 7 } = body
  // Validate tier: must be 1, 2, 3, null, or undefined
  const tier = [1, 2, 3].includes(body.tier as number) ? (body.tier as number) : null

  const since = new Date(Date.now() - Math.max(1, dateRange) * 24 * 3_600_000).toISOString()

  if (query.trim()) {
    let embedding: number[]
    try {
      embedding = await embed(query)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Embedding failed'
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const { data, error } = await supabase.rpc('search_articles', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 10,
      filter_tier: tier,
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

  if (tier !== null) {
    dbQuery = dbQuery.eq('credibility_tier', tier)
  }

  const { data, error } = await dbQuery
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ articles: data })
}
