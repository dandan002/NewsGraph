import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'

export default function DashboardPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={null} />}
      chat={<div className="flex-1 bg-[#080c14]" />}
      markets={<div className="w-full bg-[#080c14]" />}
    />
  )
}
