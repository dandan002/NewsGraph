import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'
import { ChatPane } from '@/components/chat/ChatPane'

export default function DashboardPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={null} />}
      chat={<ChatPane />}
      markets={<div className="w-full bg-[#080c14]" />}
    />
  )
}
