interface AssetBlockProps {
  asset: string
  markPrice: number | null
  fundingRate: number | null
  openInterest: number | null
}

function formatOI(oi: number | null): string {
  if (oi === null) return '—'
  if (oi >= 1e9) return `${(oi / 1e9).toFixed(1)}B`
  if (oi >= 1e6) return `${(oi / 1e6).toFixed(0)}M`
  return oi.toFixed(0)
}

function formatFunding(rate: number | null): { text: string; color: string } {
  if (rate === null) return { text: '—', color: 'text-slate-600' }
  const pct = (rate * 100).toFixed(3)
  if (rate > 0) return { text: `+${pct}%`, color: 'text-amber-400' }
  if (rate < 0) return { text: `${pct}%`, color: 'text-red-400' }
  return { text: `${pct}%`, color: 'text-slate-500' }
}

export function AssetBlock({ asset, markPrice, fundingRate, openInterest }: AssetBlockProps) {
  const funding = formatFunding(fundingRate)

  return (
    <div className="border-t border-[#131d2e] pt-3 pb-1">
      <div className="text-blue-400 font-mono text-[10px] mb-1">{asset}-PERP</div>
      <div className="text-slate-200 font-mono text-sm font-bold">
        {markPrice !== null ? markPrice.toLocaleString() : '—'}
      </div>
      <div className="font-mono text-[10px] mt-1 text-slate-500">
        Fund <span className={funding.color}>{funding.text}</span>
      </div>
      <div className="font-mono text-[10px] text-slate-500">
        OI <span className="text-slate-300">{formatOI(openInterest)}</span>
      </div>
    </div>
  )
}
