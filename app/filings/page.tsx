import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ArticleFeed } from '@/components/news/ArticleFeed'

export default function FilingsPage() {
  return (
    <DashboardLayout
      newsFeed={<ArticleFeed initialTier={1} />}
      chat={<div className="flex-1 bg-[#080c14]" />}
      markets={<div className="w-full bg-[#080c14]" />}
    />
  )
}
