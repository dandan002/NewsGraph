'use client'

interface FilterBarProps {
  tier: number | null
  dateRange: number
  onTierChange: (tier: number | null) => void
  onDateRangeChange: (days: number) => void
}

const TIERS = [
  { label: 'All', value: null },
  { label: 'Regulatory', value: 1 },
  { label: 'Press', value: 2 },
  { label: 'Wire', value: 3 },
]

const DATE_RANGES = [
  { label: '24h', value: 1 },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
]

export function FilterBar({ tier, dateRange, onTierChange, onDateRangeChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex gap-1">
        {TIERS.map((t) => (
          <button
            key={String(t.value)}
            onClick={() => onTierChange(t.value)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              tier === t.value
                ? 'border-blue-500 text-blue-300 bg-[#0d1a2e]'
                : 'border-[#1a2740] text-[#4a6080] bg-[#0d1525] hover:border-blue-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 ml-auto">
        {DATE_RANGES.map((d) => (
          <button
            key={d.value}
            onClick={() => onDateRangeChange(d.value)}
            className={`font-mono text-[9px] px-2 py-1 rounded border transition-colors ${
              dateRange === d.value
                ? 'border-blue-500 text-blue-300 bg-[#0d1a2e]'
                : 'border-[#1a2740] text-[#4a6080] bg-[#0d1525] hover:border-blue-600'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}
