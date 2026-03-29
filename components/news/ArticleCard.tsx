interface Article {
  id: string
  url: string
  source_name: string
  credibility_tier: 1 | 2 | 3
  published_at: string | null
  summary_en: string
}

const TIER_CONFIG = {
  1: {
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-400/10 text-emerald-400',
    label: 'REG',
  },
  2: {
    bar: 'bg-blue-400',
    badge: 'bg-blue-400/10 text-blue-400',
    label: 'PRESS',
  },
  3: {
    bar: 'bg-slate-600',
    badge: 'bg-slate-600/10 text-slate-500',
    label: 'WIRE',
  },
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
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 bg-[#0d1424] hover:bg-[#111c30] rounded-lg p-3 transition-colors duration-150"
    >
      {/* Accent bar */}
      <div className={`w-0.5 rounded-full flex-shrink-0 ${tier.bar}`} />

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-slate-100 text-[11.5px] font-medium leading-snug">
            {headline}
          </span>
          <span className={`text-[9px] font-semibold tracking-widest px-1.5 py-0.5 rounded ${tier.badge} flex-shrink-0 mt-0.5`}>
            {tier.label}
          </span>
        </div>

        {/* Snippet */}
        {snippet && (
          <p className="text-slate-500 text-[10.5px] leading-relaxed mb-2 line-clamp-2">
            {snippet}.
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center gap-1.5 text-[9.5px] text-[#2a4060]">
          <span className="text-slate-600">{article.source_name}</span>
          <span>·</span>
          <span>{timeAgo(article.published_at)}</span>
          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
        </div>
      </div>
    </a>
  )
}

export type { Article }
