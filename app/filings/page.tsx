import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'
import { ChatPane } from '@/components/chat/ChatPane'
import { MarketsPanel } from '@/components/markets/MarketsPanel'

export default function FilingsPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={1} />}
      chat={<ChatPane />}
      markets={<MarketsPanel />}
    />
  )
}
