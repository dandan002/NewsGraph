import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workerUrl = process.env.INGEST_WORKER_URL
  const secret = process.env.INGEST_WORKER_SECRET

  if (!workerUrl || !secret) {
    return NextResponse.json(
      { error: 'INGEST_WORKER_URL or INGEST_WORKER_SECRET not configured' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(`${workerUrl}/trigger`, {
      method: 'POST',
      headers: { 'x-ingest-secret': secret },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Worker trigger failed' }, { status: 502 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
