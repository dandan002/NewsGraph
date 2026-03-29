interface Article {
  id: string
  url: string
  source_name: string
  credibility_tier: 1 | 2 | 3
  published_at: string | null
  summary_en: string
  // headline extracted from summary_en first sentence
}

const TIER_CONFIG = {
  1: { border: 'border-l-blue-500', badge: 'bg-[#0f2a4a] text-blue-300', label: 'REG' },
  2: { border: 'border-l-indigo-500', badge: 'bg-[#1a1a3a] text-indigo-300', label: 'PRESS' },
  3: { border: 'border-l-[#1e3a5a]', badge: 'bg-[#131d2e] text-slate-500', label: 'WIRE' },
}

function extractHeadline(summary: string): string {
  return summary.split('.')[0] + '.'
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function ArticleCard({ article }: { article: Article }) {
  const tier = TIER_CONFIG[article.credibility_tier]
  const headline = extractHeadline(article.summary_en)
  const snippet = article.summary_en.slice(headline.length).trim().split('.')[0]

  return (
    <div
      className={`bg-[#0d1525] rounded p-3 border-l-2 ${tier.border} hover:bg-[#111c30] transition-colors`}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-slate-200 font-mono text-[11px] font-semibold leading-snug">
          {headline}
        </span>
        <span
          className={`${tier.badge} font-mono text-[9px] px-1.5 py-0.5 rounded-sm whitespace-nowrap flex-shrink-0`}
        >
          {tier.label}
        </span>
      </div>
      {snippet && (
        <p className="text-slate-500 font-mono text-[10px] leading-snug mb-2 line-clamp-2">
          {snippet}.
        </p>
      )}
      <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#2a3a52]">
        <span>{article.source_name}</span>
        <span>·</span>
        <span>{timeAgo(article.published_at)}</span>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-500 hover:text-blue-400"
        >
          ↗
        </a>
      </div>
    </div>
  )
}

export type { Article }
