'use client'

import { useEffect, useState } from 'react'
import { AssetBlock } from './AssetBlock'

interface Snapshot {
  asset: string
  mark_price: number | null
  funding_rate: number | null
  open_interest: number | null
}

export function MarketsPanel() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  async function fetchMarkets() {
    const res = await fetch('/api/markets')
    if (!res.ok) return
    const data = await res.json()
    setSnapshots(data.snapshots ?? [])
  }

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full bg-[#0a0f1a] px-2 py-3 flex flex-col">
      <div className="font-mono text-[9px] tracking-widest text-[#2a3a52] mb-1">
        MARKETS
      </div>
      <div className="flex flex-col gap-1 flex-1">
        {['BTC', 'ETH', 'SOL'].map((asset) => {
          const snap = snapshots.find((s) => s.asset === asset)
          return (
            <AssetBlock
              key={asset}
              asset={asset}
              markPrice={snap?.mark_price ?? null}
              fundingRate={snap?.funding_rate ?? null}
              openInterest={snap?.open_interest ?? null}
            />
          )
        })}
      </div>
      <div className="font-mono text-[8px] text-[#1e3a5a] mt-auto pt-2">
        ↻ 30s
      </div>
    </div>
  )
}
