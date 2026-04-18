import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
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
          <div className="mark-logo w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[#001530] font-extrabold text-xs">
            A
          </div>
          AtlasRoom
        </div>

        {/* Pitch */}
        <div className="mt-auto">
          <h2
            className="text-[36px] font-semibold tracking-[-0.03em] leading-[1.05] mb-5"
            style={{ color: 'var(--text)' }}
          >
            Join the research desk that{' '}
            <span className="accent-text">never sleeps.</span>
          </h2>
          <p className="text-[15px] leading-relaxed mb-7" style={{ color: 'var(--text-dim)', maxWidth: 460 }}>
            Automated ingestion from EDINET, NHK, Asahi, GDELT, and Hyperliquid — running 24/7 so you don&apos;t miss the filing that moved the market.
          </p>

          {/* Feature bullets */}
          <div className="flex flex-col gap-4 max-w-[420px]">
            {[
              { icon: '⚡', title: 'Live in minutes', desc: 'Connect your keys and start querying the same day.' },
              { icon: '🔍', title: 'Semantic search', desc: '1,536-dim embeddings over every English summary.' },
              { icon: '💬', title: 'RAG chat with citations', desc: 'Every answer traces back to a source article.' },
            ].map((f) => (
              <div
                key={f.title}
                className="flex gap-4 items-start p-4 rounded-xl"
                style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}
              >
                <span className="text-[20px] leading-none mt-0.5">{f.icon}</span>
                <div>
                  <div className="text-[14px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{f.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-dim)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-9 pt-6 flex gap-6 flex-wrap text-[12px]" style={{ borderTop: '1px solid var(--line)', color: 'var(--text-mute)' }}>
          {['Free during beta', 'Supabase · EU‑West', 'Claude Sonnet 4'].map((t) => (
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
          <SignupForm />
        </div>

        <div className="text-center text-[12px]" style={{ color: 'var(--text-faint)' }}>
          AtlasRoom · v0.4
        </div>
      </main>
    </div>
  )
}
