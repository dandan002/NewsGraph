interface AssetBlockProps {
  asset: string
  markPrice: number | null
  fundingRate: number | null
  openInterest: number | null
}

function formatPrice(price: number | null): string {
  if (price === null) return '—'
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  if (rate > 0) return { text: `+${pct}%`, color: 'text-emerald-400' }
  if (rate < 0) return { text: `${pct}%`, color: 'text-red-400' }
  return { text: `${pct}%`, color: 'text-slate-500' }
}

export function AssetBlock({ asset, markPrice, fundingRate, openInterest }: AssetBlockProps) {
  const funding = formatFunding(fundingRate)

  return (
    <div className="px-3 py-3 bg-[#0d1424] rounded-lg">
      <div className="text-[9px] tracking-widest text-slate-600 mb-1.5">{asset}-PERP</div>
      <div className="text-slate-100 text-[13px] font-semibold tabular-nums mb-2">
        {formatPrice(markPrice)}
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between text-[9.5px]">
          <span className="text-slate-700">FUND</span>
          <span className={`tabular-nums ${funding.color}`}>{funding.text}</span>
        </div>
        <div className="flex justify-between text-[9.5px]">
          <span className="text-slate-700">OI</span>
          <span className="text-slate-400 tabular-nums">{formatOI(openInterest)}</span>
        </div>
      </div>
    </div>
  )
}
