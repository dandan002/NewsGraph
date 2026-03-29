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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function fetchMarkets() {
    const res = await fetch('/api/markets')
    if (!res.ok) return
    const data = await res.json()
    setSnapshots(data.snapshots ?? [])
    setLastUpdated(new Date())
  }

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col px-2 py-4 gap-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <h2 className="text-[10px] tracking-[0.15em] text-slate-500 font-medium">MARKETS</h2>
        {lastUpdated && (
          <span className="text-[8px] text-slate-700">
            ↻ {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1">
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

      <div className="px-1 pt-2 border-t border-[#0f1a2e]">
        <div className="text-[8.5px] text-slate-700 tracking-wider">Hyperliquid</div>
        <div className="text-[8px] text-slate-800 mt-0.5">30s refresh</div>
      </div>
    </div>
  )
}
