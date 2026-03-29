import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function DashboardPage() {
  return (
    <DashboardLayout
      newsFeed={<div className="flex-1 bg-[#080c14]" />}
      chat={<div className="flex-1 bg-[#080c14]" />}
      markets={<div className="h-full bg-[#0a0f1a]" />}
    />
  )
}
