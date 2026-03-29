import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function TopNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="bg-[#0a0f1a] border-b border-[#131d2e] px-4 py-2 flex items-center justify-between flex-shrink-0">
      <span className="text-blue-400 font-mono font-bold tracking-widest text-sm">
        NEWSGRAPH
      </span>
      <div className="flex gap-6 font-mono text-xs text-[#2a3a52]">
        <Link
          href="/dashboard"
          className="hover:text-blue-400 transition-colors"
        >
          DASHBOARD
        </Link>
        <Link href="/filings" className="hover:text-blue-400 transition-colors">
          FILINGS
        </Link>
        <span className="cursor-not-allowed opacity-40">SETTINGS</span>
      </div>
      <div className="font-mono text-xs text-[#2a3a52]">
        {user?.email}&nbsp;·&nbsp;
        <form action="/auth/signout" method="POST" className="inline">
          <button
            type="submit"
            className="text-red-500 hover:text-red-400 transition-colors"
          >
            sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
