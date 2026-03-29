import type { ReactNode } from 'react'
import Link from 'next/link'
import { TopNav } from './TopNav'

interface DashboardLayoutProps {
  newsFeed: ReactNode
  chat: ReactNode
  markets: ReactNode
}

export function DashboardLayout({ newsFeed, chat, markets }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080c14]">
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-14 bg-[#0a0f1a] flex flex-col items-center py-4 gap-1 flex-shrink-0 border-r border-[#0f1a2e]">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#131d2e] text-blue-400 hover:bg-[#1a2a42] transition-colors"
            title="Dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          </Link>
          <Link
            href="/filings"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#2a3a52] hover:text-blue-400 hover:bg-[#131d2e] transition-colors"
            title="Filings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </Link>
          <div className="mt-auto w-9 h-9 rounded-lg flex items-center justify-center text-[#1e2e40] cursor-not-allowed" title="Settings (coming soon)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Feed */}
          <div className="flex-[1.6] overflow-hidden flex flex-col min-w-0 bg-[#080c14]">
            {newsFeed}
          </div>
          {/* Chat */}
          <div className="flex-[1.2] overflow-hidden flex flex-col min-w-0 bg-[#060a12]">
            {chat}
          </div>
          {/* Markets */}
          <div className="w-[160px] flex-shrink-0 overflow-hidden flex flex-col bg-[#0a0f1a]">
            {markets}
          </div>
        </div>
      </div>
    </div>
  )
}
