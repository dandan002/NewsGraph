import Link from 'next/link'

/* ── Nav ── */
function NavBar() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-7 py-4"
      style={{
        background: 'rgba(10,11,15,0.72)',
        backdropFilter: 'blur(16px) saturate(140%)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div className="flex items-center gap-2.5 font-bold text-[17px] tracking-tight text-[var(--text)]">
        <div className="mark-logo w-[22px] h-[22px] rounded-[7px] flex items-center justify-center text-[#001530] font-extrabold text-xs">
          A
        </div>
        AtlasRoom
      </div>

      <div className="hidden md:flex gap-1 text-sm text-[var(--text-dim)]">
        {['Product', 'Sources', 'How it works', 'Pricing'].map((l) => (
          <a
            key={l}
            href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
            className="px-3.5 py-2 rounded-lg transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
          >
            {l}
          </a>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <Link
          href="/login"
          className="px-4 py-2 rounded-full border text-sm font-medium transition-all hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
          style={{ borderColor: 'var(--line-2)', color: 'var(--text-1)' }}
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: 'var(--accent)',
            color: '#001a3a',
            boxShadow: '0 8px 24px -10px rgba(77,141,255,0.6)',
          }}
        >
          Get started
        </Link>
      </div>
    </nav>
  )
}

/* ── Hero terminal mock ── */
const ARTICLES = [
  { tier: 1, badge: 'REG', src: 'EDINET · 02m', head: 'Toyota Motor Corp — annual securities report filed', snip: 'Operating margin 11.4% YoY. Lists ¥2.1T capex earmark for solid-state battery line.' },
  { tier: 2, badge: 'PRESS', src: 'NHK · 08m', head: 'BoJ holds policy rate at 0.50%, signals patience', snip: 'Governor Ueda emphasized data dependence; markets had priced 22% chance of move.' },
  { tier: 1, badge: 'REG', src: 'EDINET · 14m', head: 'SoftBank — extraordinary report on Arm stake', snip: 'Discloses partial monetization plan; ~3% of holdings via collared structure.' },
  { tier: 2, badge: 'PRESS', src: 'Asahi · 22m', head: 'METI proposes revised semiconductor subsidy framework', snip: 'Targets advanced packaging and HBM supply. Up to ¥800B over three years.' },
  { tier: 3, badge: 'WIRE', src: 'GDELT · 31m', head: 'Nikkei 225 closes +0.4% on weak yen, exporters lead', snip: 'Auto and electronics sectors outperformed. Chip-related names mixed.' },
]

const TIER_COLORS: Record<number, { badge: string; bar: string }> = {
  1: { badge: 'bg-[var(--accent-soft)] text-[var(--accent)]', bar: 'bg-[var(--accent)]' },
  2: { badge: 'bg-[var(--blue-soft)] text-[var(--blue)]', bar: 'bg-[var(--blue)]' },
  3: { badge: 'bg-[rgba(148,163,184,0.10)] text-[var(--slate)]', bar: 'bg-[var(--text-faint)]' },
}

function FeedCard({ tier, badge, src, head, snip }: typeof ARTICLES[0]) {
  const c = TIER_COLORS[tier]
  return (
    <div
      className="relative px-3.5 py-3 rounded-lg mb-2 border border-transparent transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)] overflow-hidden"
      style={{ background: 'var(--bg-2)' }}
    >
      <div
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-sm ${c.bar}`}
      />
      <div className="flex gap-2 items-center text-[11px] text-[var(--text-mute)] mb-1.5 pl-1">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>
          {badge}
        </span>
        <span className="font-mono">{src}</span>
      </div>
      <div className="text-[13.5px] leading-snug font-medium text-[var(--text)] mb-1 pl-1">{head}</div>
      <div className="text-[12.5px] leading-relaxed text-[var(--text-dim)] pl-1">{snip}</div>
    </div>
  )
}

function HeroTerminal() {
  return (
    <div
      className="rounded-[22px] overflow-hidden text-[13px] relative"
      style={{
        background: 'linear-gradient(180deg, var(--bg-1), var(--bg))',
        border: '1px solid var(--line)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,141,255,0.04), 0 60px 120px -40px rgba(77,141,255,0.10)',
      }}
    >
      {/* ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(109,213,255,0.06), transparent 50%)' }}
      />
      {/* title bar */}
      <div
        className="relative flex items-center gap-3 px-4 py-3.5"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="flex gap-1.5">
          <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
          <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
          <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 text-center font-mono text-[12px] text-[var(--text-mute)]">
          atlasroom.app / dashboard
        </div>
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[var(--accent)] before:shadow-[0_0_6px_var(--accent)] before:animate-pulse-dot"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          LIVE
        </div>
      </div>

      {/* 3-col body */}
      <div className="grid grid-cols-[1.6fr_1fr_0.7fr] min-h-[440px]">
        {/* Feed */}
        <div className="p-4" style={{ borderRight: '1px solid var(--line)' }}>
          <div className="flex justify-between items-center text-[11px] mb-3.5">
            <span className="text-[var(--text-dim)] font-medium">News feed · Japan</span>
            <span className="font-mono text-[var(--text-faint)]">1,284 · 24h</span>
          </div>
          {ARTICLES.map((a, i) => <FeedCard key={i} {...a} />)}
        </div>

        {/* Chat */}
        <div className="p-4" style={{ borderRight: '1px solid var(--line)' }}>
          <div className="flex justify-between items-center text-[11px] mb-3.5">
            <span className="text-[var(--text-dim)] font-medium">Research chat</span>
            <span className="font-mono text-[var(--text-faint)]">claude · sonnet 4</span>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-mute)] mb-1.5">
              <span className="w-[18px] h-[18px] rounded-[6px] bg-[var(--bg-3)] text-[var(--text-dim)] flex items-center justify-center text-[10px] font-semibold">Y</span>
              You · 09:46
            </div>
            <div className="text-[13.5px] leading-relaxed text-[var(--text-1)] pl-[26px]">
              What&apos;s the BoJ doing about rates? Brief.
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-mute)] mb-1.5">
              <span
                className="w-[18px] h-[18px] rounded-[6px] flex items-center justify-center text-[10px] font-extrabold text-[#001530]"
                style={{ background: 'linear-gradient(135deg, var(--accent), #2f6fe6)' }}
              >
                A
              </span>
              Atlas · research
            </div>
            <div className="text-[13.5px] leading-relaxed text-[var(--text-1)] pl-[26px]">
              The BoJ held the policy rate at 0.50% this morning{' '}
              <span className="text-[var(--accent)] font-semibold">[1]</span>, with Governor Ueda stressing data dependence. Yen weakened ~0.7%.
            </div>
            <div
              className="mt-1.5 mx-[26px] flex gap-2 items-center text-[11px] text-[var(--text-mute)] px-2.5 py-1.5 rounded-[6px]"
              style={{ background: 'var(--bg-2)' }}
            >
              <span className="text-[var(--accent)] font-semibold">[1]</span>
              NHK · 08m · BoJ holds policy rate at 0.50%
            </div>
          </div>

          <div
            className="flex gap-2 items-center px-3.5 py-2.5 rounded-xl"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)' }}
          >
            <span className="flex-1 text-[13px] text-[var(--text-mute)]">Ask about EDINET filings, BoJ…</span>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[#001a3a]"
              style={{ background: 'var(--accent)' }}
            >
              ↑
            </span>
          </div>
        </div>

        {/* Markets */}
        <div className="p-4">
          <div className="flex justify-between items-center text-[11px] mb-3.5">
            <span className="text-[var(--text-dim)] font-medium">Markets</span>
            <span className="font-mono text-[var(--text-faint)]">↻ 30s</span>
          </div>
          {[
            { name: 'BTC-PERP', price: '94,128.40', delta: '+0.74%', pos: true, funding: '+0.0124%', oi: '$3.2B' },
            { name: 'ETH-PERP', price: '3,284.10', delta: '−0.21%', pos: false, funding: '−0.0041%', oi: '$1.1B' },
            { name: 'SOL-PERP', price: '218.46', delta: '+1.82%', pos: true, funding: '+0.0089%', oi: '$412M' },
          ].map((m) => (
            <div key={m.name} className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-2)' }}>
              <div className="flex justify-between items-center text-[11px] font-semibold tracking-wide text-[var(--text-dim)] mb-1.5">
                <span>{m.name}</span>
                <span className={`font-mono ${m.pos ? 'text-[var(--accent)]' : 'text-[var(--red)]'}`}>{m.delta}</span>
              </div>
              <div className="text-lg font-semibold tracking-tight text-[var(--text)] mb-2 tabular-nums">{m.price}</div>
              <div className="flex justify-between text-[11px] text-[var(--text-mute)]">
                <span>Funding</span>
                <span className="font-mono text-[var(--text-1)] tabular-nums">{m.funding}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[var(--text-mute)] mt-0.5">
                <span>OI</span>
                <span className="font-mono text-[var(--text-1)] tabular-nums">{m.oi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Hero ── */
function Hero() {
  return (
    <section className="relative px-7 pt-24 pb-18 overflow-hidden">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-18 items-center">
        <div>
          {/* eyebrow */}
          <div
            className="inline-flex items-center gap-2.5 text-[13px] text-[var(--text-dim)] px-3 py-1.5 pr-1.5 rounded-full border mb-8"
            style={{ borderColor: 'var(--line-2)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse-dot" />
              LIVE
            </div>
            1,284 items ingested in the last 24h
          </div>

          <h1
            className="text-[clamp(48px,6.2vw,80px)] leading-[0.98] font-semibold tracking-[-0.04em] mb-6 text-[var(--text)]"
          >
            Foreign‑language<br />
            macro signal,<br />
            <span className="accent-text">in plain English.</span>
          </h1>

          <p className="text-[19px] leading-relaxed text-[var(--text-dim)] max-w-[540px] mb-9 font-normal">
            AtlasRoom watches Japanese press, regulatory filings, and crypto market microstructure — summarized, embedded, and queryable in one workspace. Stop missing the news that already moved.
          </p>

          <div className="flex gap-3 items-center flex-wrap mb-14">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-px"
              style={{
                background: 'var(--accent)',
                color: '#001a3a',
                boxShadow: '0 8px 24px -10px rgba(77,141,255,0.6)',
              }}
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-medium border transition-all hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
              style={{ borderColor: 'var(--line-2)', color: 'var(--text-1)' }}
            >
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-12">
            {[
              { v: '30s', l: 'Markets refresh' },
              { v: '2–3', l: 'Sentence summaries' },
              { v: '1,536d', l: 'Embeddings' },
            ].map((m) => (
              <div key={m.l}>
                <span className="block text-[28px] font-semibold tracking-tight text-[var(--text)] tabular-nums">{m.v}</span>
                <span className="text-[13px] text-[var(--text-mute)]">{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <HeroTerminal />
        </div>
      </div>
    </section>
  )
}

/* ── Sources strip ── */
function Sources() {
  const items = [
    { name: 'EDINET', tag: 'FSA filings', tier: 1 },
    { name: 'NHK', tag: 'National broadcaster', tier: 2 },
    { name: 'Asahi', tag: 'Major press', tier: 2 },
    { name: 'Japan Times', tag: 'Major press', tier: 2 },
    { name: 'GDELT', tag: 'Wire · global', tier: 3 },
    { name: 'Hyperliquid', tag: 'Crypto perps', tier: 0 },
  ]
  const dotColor: Record<number, string> = {
    1: 'bg-[var(--accent)]',
    2: 'bg-[var(--blue)]',
    3: 'bg-[var(--text-mute)]',
    0: 'bg-[var(--text-faint)]',
  }
  return (
    <section className="px-7 pb-12" id="sources">
      <div
        className="max-w-[1280px] mx-auto flex items-center gap-8 flex-wrap justify-between px-7 py-5 rounded-2xl"
        style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
      >
        <div className="text-[12px] text-[var(--text-mute)] font-medium whitespace-nowrap">Coverage</div>
        <div className="flex gap-7 flex-wrap items-center text-[14px] text-[var(--text-dim)]">
          {items.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-2 font-medium text-[var(--text-1)]">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor[s.tier]}`} />
              {s.name}
              <span className="text-[12px] text-[var(--text-mute)] font-normal">{s.tag}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Feature triptych ── */
function Triptych() {
  return (
    <section className="px-7 py-28" id="product">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-14 gap-8 flex-wrap">
          <h2 className="text-[48px] tracking-[-0.035em] font-semibold text-[var(--text)] leading-[1.05] m-0 max-w-[720px]">
            Three panes. <span className="accent-text">One research loop.</span>
          </h2>
          <div
            className="inline-flex items-center gap-2.5 text-[13px] text-[var(--text-mute)] px-3.5 py-1.5 rounded-full border"
            style={{ borderColor: 'var(--line-2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            The dashboard
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Feed */}
          <div
            className="flex flex-col gap-4 p-8 rounded-2xl border min-h-[420px] relative overflow-hidden transition-all hover:border-[var(--line-2)] group"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
          >
            <div className="text-[12px] font-semibold tracking-wide flex items-center gap-2 text-[var(--accent)]">
              <span
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] font-mono text-[11px]"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >01</span>
              News feed
            </div>
            <h3 className="text-2xl font-semibold tracking-tight leading-snug m-0 text-[var(--text)]">
              Filterable, tier-tagged headlines from sources you don&apos;t read.
            </h3>
            <p className="text-[14.5px] text-[var(--text-dim)] leading-relaxed m-0">
              Every article comes through with a credibility tier, source name, and English summary — scan a hundred items in the time it takes to read one in Japanese.
            </p>
            <div className="mt-auto rounded-lg p-3.5" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)' }}
              >
                <span className="text-[var(--text-mute)]">⌕</span>
                <span className="flex-1 font-mono text-[12px] text-[var(--text)]">&quot;semiconductor subsidy&quot; tier:reg 7d</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: 'var(--bg-3)', border: '1px solid var(--line-2)', color: 'var(--text-dim)' }}
                >⌘K</span>
              </div>
              {[
                { t: 'METI · subsidy framework 2H26', s: '0.91' },
                { t: 'EDINET · TSMC JP fab amendment', s: '0.87' },
                { t: 'EDINET · Renesas ¥120B equipment', s: '0.82' },
                { t: 'NHK · packaging-investment push', s: '0.78' },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-1.5 text-[12.5px] text-[var(--text-1)]"
                  style={{ borderTop: i > 0 ? '1px solid var(--line)' : undefined }}
                >
                  <span>{r.t}</span>
                  <span className="font-mono font-semibold text-[var(--accent)] text-[11.5px]">{r.s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div
            className="flex flex-col gap-4 p-8 rounded-2xl border min-h-[420px] relative overflow-hidden transition-all hover:border-[var(--line-2)]"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
          >
            <div className="text-[12px] font-semibold tracking-wide flex items-center gap-2 text-[var(--accent)]">
              <span
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] font-mono text-[11px]"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >02</span>
              Research chat
            </div>
            <h3 className="text-2xl font-semibold tracking-tight leading-snug m-0 text-[var(--text)]">
              Ask anything. Get answers with sources attached.
            </h3>
            <p className="text-[14.5px] text-[var(--text-dim)] leading-relaxed m-0">
              The chat pane runs RAG over the same corpus the feed shows you. Every claim Claude makes carries an inline citation — no hallucinated headlines.
            </p>
            <div className="mt-auto rounded-lg p-3.5 text-[13px] leading-relaxed text-[var(--text-1)]" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
              The MoF intervened verbally on FX twice this week{' '}
              <span className="text-[var(--accent)] font-semibold">[1]</span> while the BoJ held steady{' '}
              <span className="text-[var(--accent)] font-semibold">[2]</span>. OIS imply the next hike around July.
              {[
                { m: '[1]', src: 'Asahi · 1h · Suzuki: "excessive volatility"' },
                { m: '[2]', src: 'NHK · 8m · BoJ holds at 0.50%' },
              ].map((c) => (
                <div
                  key={c.m}
                  className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-mute)] px-2.5 py-1.5 rounded-[6px]"
                  style={{ background: 'var(--bg-2)' }}
                >
                  <span className="text-[var(--accent)] font-semibold">{c.m}</span>
                  {c.src}
                </div>
              ))}
            </div>
          </div>

          {/* Markets */}
          <div
            className="flex flex-col gap-4 p-8 rounded-2xl border min-h-[420px] relative overflow-hidden transition-all hover:border-[var(--line-2)]"
            style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
          >
            <div className="text-[12px] font-semibold tracking-wide flex items-center gap-2 text-[var(--accent)]">
              <span
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] font-mono text-[11px]"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >03</span>
              Markets
            </div>
            <h3 className="text-2xl font-semibold tracking-tight leading-snug m-0 text-[var(--text)]">
              Live perp prices, funding, open interest.
            </h3>
            <p className="text-[14.5px] text-[var(--text-dim)] leading-relaxed m-0">
              30-second refresh from Hyperliquid for BTC, ETH, SOL — mark price, funding, OI. Color flips with the sign.
            </p>
            <div className="mt-auto rounded-lg p-3.5" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
              {[
                { name: 'BTC-PERP', px: '94,128.40', d: '+0.74%', pos: true },
                { name: 'ETH-PERP', px: '3,284.10', d: '−0.21%', pos: false },
                { name: 'SOL-PERP', px: '218.46', d: '+1.82%', pos: true },
                { name: 'USD/JPY', px: '152.84', d: '+0.71%', pos: true },
              ].map((t, i) => (
                <div
                  key={t.name}
                  className="flex justify-between items-center py-2 text-[12.5px]"
                  style={{ borderTop: i > 0 ? '1px solid var(--line)' : undefined }}
                >
                  <span className="font-semibold text-[12px] text-[var(--text)]">{t.name}</span>
                  <span className="font-mono tabular-nums text-[var(--text)]">{t.px}</span>
                  <span
                    className={`font-mono text-[11.5px] px-2 py-0.5 rounded-full font-semibold ${t.pos ? 'text-[var(--accent)] bg-[var(--accent-soft)]' : 'text-[var(--red)] bg-[rgba(255,93,108,0.10)]'}`}
                  >
                    {t.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Pipeline ── */
function Pipeline() {
  const steps = [
    { num: '01', title: 'Fetch', body: 'RSS, REST, GDELT 15-min CSV dumps. Source-tagged with credibility tier at ingest, never inferred.' },
    { num: '02', title: 'Dedupe', body: 'URL-keyed insertion. Skips known articles before any LLM call — never pay twice for the same text.' },
    { num: '03', title: 'Summarize', body: 'Single Claude pass: translate Japanese → 2–3 English sentences for an investor. Factual, not editorial.' },
    { num: '04', title: 'Embed', body: 'OpenRouter text-embedding-3-small · 1536-dim on the English summary. pgvector with ivfflat index.' },
    { num: '05', title: 'Serve', body: 'Cosine similarity + SQL filters (country, tier, date). Top-K injected as RAG context for the chat.' },
  ]
  const highlighted = new Set([0, 2, 4])
  return (
    <section className="px-7 py-28" id="how-it-works">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-14 gap-8 flex-wrap">
          <h2 className="text-[48px] tracking-[-0.035em] font-semibold text-[var(--text)] leading-[1.05] m-0 max-w-[720px]">
            From RSS feed to <span className="accent-text">citation-grade</span> research, in one pipeline.
          </h2>
          <div
            className="inline-flex items-center gap-2.5 text-[13px] text-[var(--text-mute)] px-3.5 py-1.5 rounded-full border"
            style={{ borderColor: 'var(--line-2)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            Always running
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {steps.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border transition-all hover:border-[var(--line-3)] hover:-translate-y-0.5"
              style={{ background: 'var(--bg-1)', border: '1px solid var(--line)' }}
            >
              <div
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-semibold font-mono mb-3.5"
                style={
                  highlighted.has(i)
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                    : { background: 'var(--bg-3)', color: 'var(--text-dim)' }
                }
              >
                {s.num}
              </div>
              <h3 className="text-[17px] text-[var(--text)] font-semibold tracking-tight m-0 mb-2">{s.title}</h3>
              <p className="text-[13.5px] text-[var(--text-dim)] leading-relaxed m-0">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA ── */
function CTA() {
  return (
    <section
      className="px-7 py-28 text-center relative overflow-hidden"
      id="pricing"
      style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 100%, rgba(77,141,255,0.10), transparent 60%)' }}
    >
      <h2 className="text-[56px] tracking-[-0.04em] leading-none font-semibold max-w-[800px] mx-auto mb-5 text-[var(--text)]">
        Spin up a research desk in <span className="accent-text">one evening.</span>
      </h2>
      <p className="text-[17px] text-[var(--text-dim)] max-w-[560px] mx-auto mb-9">
        Closed beta for systematic funds, family offices, and individual macro researchers. Bring your own keys, or use a hosted instance.
      </p>
      <div className="inline-flex gap-3">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-px"
          style={{
            background: 'var(--accent)',
            color: '#001a3a',
            boxShadow: '0 8px 24px -10px rgba(77,141,255,0.6)',
          }}
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[15px] font-medium border transition-all hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
          style={{ borderColor: 'var(--line-2)', color: 'var(--text-1)' }}
        >
          I have an account
        </Link>
      </div>
    </section>
  )
}

/* ── Footer ── */
function Footer() {
  return (
    <footer
      className="px-7 py-8 flex justify-between items-center flex-wrap gap-4 max-w-[1280px] mx-auto text-[13px] text-[var(--text-mute)]"
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <div>© AtlasRoom · 2026</div>
      <div className="flex gap-6">
        {['Docs', 'Status', 'Privacy', 'Terms'].map((l) => (
          <a key={l} href="#" className="hover:text-[var(--text)] transition-colors">{l}</a>
        ))}
      </div>
    </footer>
  )
}

/* ── Page ── */
export default function LandingPage() {
  return (
    <div
      style={{
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(109,213,255,0.08), transparent 60%),
                     radial-gradient(ellipse 60% 40% at 100% 30%, rgba(77,141,255,0.06), transparent 60%),
                     var(--bg)`,
        minHeight: '100vh',
      }}
    >
      <NavBar />
      <Hero />
      <Sources />
      <Triptych />
      <Pipeline />
      <CTA />
      <Footer />
    </div>
  )
}
