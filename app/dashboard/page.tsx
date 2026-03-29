import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'
import { ChatPane } from '@/components/chat/ChatPane'
import { MarketsPanel } from '@/components/markets/MarketsPanel'

export default function DashboardPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={null} />}
      chat={<ChatPane />}
      markets={<MarketsPanel />}
    />
  )
}
