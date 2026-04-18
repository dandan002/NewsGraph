import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

const FEED_ITEMS = [
  { tier: 1, badge: 'REG', src: 'EDINET · 02m', head: 'Toyota — annual securities report filed', snip: 'Operating margin 11.4% YoY. ¥2.1T capex for solid-state batteries.' },
  { tier: 2, badge: 'PRESS', src: 'NHK · 08m', head: 'BoJ holds policy rate at 0.50%', snip: 'Ueda emphasized data dependence; yen weakened 0.7%.' },
  { tier: 1, badge: 'REG', src: 'EDINET · 14m', head: 'SoftBank — extraordinary report on Arm', snip: 'Partial monetization via collared structure.' },
]

const TIER = {
  1: { badge: 'bg-[var(--accent-soft)] text-[var(--accent)]', bar: 'bg-[var(--accent)]' },
  2: { badge: 'bg-[var(--blue-soft)] text-[var(--blue)]', bar: 'bg-[var(--blue)]' },
  3: { badge: 'bg-[rgba(148,163,184,0.10)] text-[var(--slate)]', bar: 'bg-[var(--text-faint)]' },
} as const

export default function LoginPage() {
  return (
    <div
      className="min-h-screen grid md:grid-cols-[1fr_1.05fr]"
      style={{ background: 'var(--bg)' }}
    >
      {/* Left — marketing side */}
      <aside
        className="hidden md:flex flex-col p-11"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 0% 100%, rgba(77,141,255,0.08), transparent 60%),
                       radial-gradient(ellipse 60% 40% at 100% 0%, rgba(109,213,255,0.06), transparent 60%),
                       var(--bg-1)`,
          borderRight: '1px solid var(--line)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 font-bold text-[17px] tracking-tight" style={{ color: 'var(--text)' }}>
          <div
            className="mark-logo w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[#001530] font-extrabold text-xs"
          >A</div>
          AtlasRoom
        </div>

        {/* Pitch */}
        <div className="mt-auto">
          <h2
            className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.05] mb-5"
            style={{ color: 'var(--text)' }}
          >
            The macro desk that{' '}
            <span className="accent-text">reads Japanese</span> for you.
          </h2>
          <p className="text-[15px] leading-relaxed mb-7" style={{ color: 'var(--text-dim)', maxWidth: 460 }}>
            1,284 items ingested in the last 24 hours from EDINET, NHK, Asahi, and GDELT. Summarized, embedded, and ready to query the moment you sign in.
          </p>

          {/* Mini feed */}
          <div className="rounded-xl p-4 max-w-[480px]" style={{ background: 'var(--bg)', border: '1px solid var(--line)', boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)' }}>
            <div className="flex justify-between items-center text-[11px] mb-3">
              <span className="font-medium" style={{ color: 'var(--text-dim)' }}>Live feed · Japan</span>
              <span className="font-mono" style={{ color: 'var(--text-faint)' }}>streaming</span>
            </div>
            {FEED_ITEMS.map((a, i) => {
              const c = TIER[a.tier as keyof typeof TIER]
              return (
                <div
                  key={i}
                  className="relative px-3.5 py-3 rounded-lg mb-2 overflow-hidden"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-sm ${c.bar}`} />
                  <div className="flex gap-2 items-center text-[11px] mb-1.5 pl-1" style={{ color: 'var(--text-mute)' }}>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>{a.badge}</span>
                    <span className="font-mono">{a.src}</span>
                  </div>
                  <div className="text-[13px] font-medium leading-snug mb-0.5 pl-1" style={{ color: 'var(--text)' }}>{a.head}</div>
                  <div className="text-[12px] leading-relaxed pl-1" style={{ color: 'var(--text-dim)' }}>{a.snip}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-9 pt-6 flex gap-6 flex-wrap text-[12px]" style={{ borderTop: '1px solid var(--line)', color: 'var(--text-mute)' }}>
          {['SOC 2 in progress', 'Supabase · EU‑West', 'Claude Sonnet 4'].map((t) => (
            <span key={t} className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-faint)' }} />
              {t}
            </span>
          ))}
        </div>
      </aside>

      {/* Right — form */}
      <main className="flex flex-col p-11" style={{ background: 'var(--bg)' }}>
        <div className="flex justify-between items-center text-[13px]" style={{ color: 'var(--text-mute)' }}>
          <Link href="/" className="transition-colors hover:text-[var(--text)]" style={{ color: 'var(--text-dim)' }}>
            ← Back to site
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
            Secure session · TLS 1.3
          </span>
        </div>

        <div className="my-auto w-full max-w-[420px] self-center">
          <LoginForm />
        </div>

        <div className="text-center text-[12px]" style={{ color: 'var(--text-faint)' }}>
          AtlasRoom · v0.4
        </div>
      </main>
    </div>
  )
}
