import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ASSETS = ['BTC', 'ETH', 'SOL']

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get latest snapshot per asset
  const results = await Promise.all(
    ASSETS.map((asset) =>
      supabase
        .from('market_snapshots')
        .select('*')
        .eq('asset', asset)
        .eq('market_type', 'perp')
        .order('snapshot_at', { ascending: false })
        .limit(1)
        .single()
    )
  )

  const snapshots = results
    .filter((r) => r.data)
    .map((r) => r.data)

  return NextResponse.json({ snapshots })
}
