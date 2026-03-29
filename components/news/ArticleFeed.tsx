'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArticleCard, type Article } from './ArticleCard'
import { FilterBar } from './FilterBar'

interface ArticleFeedProps {
  initialTier: number | null
}

export function ArticleFeed({ initialTier }: ArticleFeedProps) {
  const [query, setQuery] = useState('')
  const [tier, setTier] = useState<number | null>(initialTier)
  const [dateRange, setDateRange] = useState(7)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)

  const fetchArticles = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tier, dateRange }),
      })
      if (!res.ok) return
      const data = await res.json()
      setArticles(data.articles ?? [])
    } finally {
      setLoading(false)
    }
  }, [tier, dateRange])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchArticles(query)
  }, [tier, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchArticles(query)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + filters header */}
      <div className="px-3 py-3 border-b border-[#131d2e] bg-[#0a0f1a] flex-shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search articles... (semantic)"
            className="flex-1 bg-[#0d1525] border border-[#1a2740] rounded px-3 py-1.5 text-slate-300 font-mono text-[11px] placeholder:text-[#2a3a52] focus:outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-[10px] px-3 py-1.5 rounded transition-colors"
          >
            SEARCH
          </button>
        </form>
        <div className="flex items-center gap-2">
          <FilterBar
            tier={tier}
            dateRange={dateRange}
            onTierChange={setTier}
            onDateRangeChange={setDateRange}
          />
          <span className="font-mono text-[9px] text-blue-500 border border-[#1a3a5e] rounded px-1.5 py-0.5 ml-1">
            ● LIVE
          </span>
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {loading && (
          <div className="text-center text-slate-600 font-mono text-xs py-8">
            loading...
          </div>
        )}
        {!loading && articles.length === 0 && (
          <div className="text-center text-slate-600 font-mono text-xs py-8">
            no articles found
          </div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
