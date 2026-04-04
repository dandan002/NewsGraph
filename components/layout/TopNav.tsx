import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function TopNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="bg-[#0a0f1a] flex-shrink-0 flex items-center justify-between px-5 h-12 border-b border-[#131d2e]">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="text-white font-bold tracking-[0.2em] text-sm">ATLASROOM</span>
        <span className="text-[#1e3a5a] text-xs">|</span>
        <span className="text-[#3a5a7a] text-[10px] tracking-widest font-medium">
          MACRO INTELLIGENCE
        </span>
      </div>

      {/* Right: user */}
      <div className="flex items-center gap-3 text-[11px] text-[#3a5a7a]">
        {user?.email && (
          <span className="text-[#2a4060]">{user.email}</span>
        )}
        <form action="/auth/signout" method="POST" className="inline">
          <button
            type="submit"
            className="text-[#3a5a7a] hover:text-red-400 transition-colors text-[11px]"
          >
            sign out
          </button>
        </form>
      </div>
    </nav>
  )
}
