'use client'

interface FilterBarProps {
  tier: number | null
  dateRange: number
  onTierChange: (tier: number | null) => void
  onDateRangeChange: (days: number) => void
}

const TIERS = [
  { label: 'All', value: null },
  { label: 'REG', value: 1 },
  { label: 'PRESS', value: 2 },
  { label: 'WIRE', value: 3 },
]

const DATE_RANGES = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
]

export function FilterBar({ tier, dateRange, onTierChange, onDateRangeChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {TIERS.map((t) => (
        <button
          key={String(t.value)}
          onClick={() => onTierChange(t.value)}
          className={`text-[10px] tracking-wider px-2.5 py-1 rounded-full transition-all duration-150 ${
            tier === t.value
              ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40'
              : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
          }`}
        >
          {t.label}
        </button>
      ))}

      <div className="h-3 w-px bg-[#1a2a3a] mx-1" />

      {DATE_RANGES.map((d) => (
        <button
          key={d.value}
          onClick={() => onDateRangeChange(d.value)}
          className={`text-[10px] tracking-wider px-2.5 py-1 rounded-full transition-all duration-150 ${
            dateRange === d.value
              ? 'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30'
              : 'text-slate-600 hover:text-slate-400 hover:bg-white/5'
          }`}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}
