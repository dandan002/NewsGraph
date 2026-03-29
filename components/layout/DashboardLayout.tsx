import { TopNav } from './TopNav'

interface DashboardLayoutProps {
  newsFeed: React.ReactNode
  chat: React.ReactNode
  markets: React.ReactNode
}

export function DashboardLayout({ newsFeed, chat, markets }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: News Feed */}
        <div className="flex-[1.5] border-r border-[#131d2e] overflow-hidden flex flex-col min-w-0">
          {newsFeed}
        </div>
        {/* Middle: Chat */}
        <div className="flex-1 border-r border-[#131d2e] overflow-hidden flex flex-col min-w-0">
          {chat}
        </div>
        {/* Right: Markets */}
        <div className="w-[120px] flex-shrink-0 overflow-hidden flex flex-col">
          {markets}
        </div>
      </div>
    </div>
  )
}
