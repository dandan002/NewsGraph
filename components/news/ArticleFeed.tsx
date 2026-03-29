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

  useEffect(() => {
    fetchArticles(query)
  }, [tier, dateRange]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchArticles(query)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] tracking-[0.15em] text-slate-500 font-medium">
            INTELLIGENCE FEED
          </h2>
          <span className="flex items-center gap-1.5 text-[9px] tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center gap-2 bg-[#0d1424] rounded-lg px-3 py-2">
            <svg className="text-slate-600 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles semantically..."
              className="flex-1 bg-transparent text-slate-300 text-[11px] placeholder:text-slate-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] tracking-wider font-medium px-3 py-2 rounded-lg transition-colors"
          >
            SEARCH
          </button>
        </form>

        <FilterBar
          tier={tier}
          dateRange={dateRange}
          onTierChange={setTier}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1.5">
        {loading && (
          <div className="text-center text-slate-700 text-xs py-12 tracking-wider">
            LOADING...
          </div>
        )}
        {!loading && articles.length === 0 && (
          <div className="text-center text-slate-700 text-xs py-12 tracking-wider">
            NO ARTICLES FOUND
          </div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
