'use client'

import { useState, useRef } from 'react'
import { useActionState } from 'react'
import { signIn, type AuthState } from '@/app/login/actions'
import Link from 'next/link'

const initialState: AuthState = { error: '' }

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" /><path d="M4 7l8 6 8-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="1" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function Stepper({ step }: { step: number }) {
  const labels = ['Identity', 'Credential']
  return (
    <div className="flex items-center mb-7 text-[12px] text-[var(--text-mute)]">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold font-mono transition-all"
              style={
                i < step
                  ? { background: 'var(--accent)', color: '#001530' }
                  : i === step
                  ? { border: '1.5px solid var(--accent)', color: 'var(--accent)', background: 'var(--accent-soft)', boxShadow: '0 0 0 4px var(--accent-soft)' }
                  : { border: '1.5px solid var(--line-2)', color: 'var(--text-mute)' }
              }
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span
              className="text-[12px] font-medium"
              style={{ color: i === step ? 'var(--text)' : i < step ? 'var(--text-1)' : 'var(--text-mute)' }}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className="flex-1 h-[1.5px] mx-3 rounded-sm min-w-[32px] transition-all"
              style={{ background: i < step ? 'var(--accent)' : 'var(--line-2)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function MethodTabs({ method, onSelect }: { method: string; onSelect: (m: string) => void }) {
  const tabs = [
    { id: 'password', label: 'Password' },
    { id: 'magic', label: 'Magic link' },
    { id: 'code', label: 'One‑time code' },
  ]
  return (
    <div className="flex gap-0 p-1 rounded-xl mb-6" style={{ background: 'var(--bg-2)' }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className="flex-1 py-2 px-2.5 rounded-lg text-[13px] font-medium transition-all"
          style={
            method === t.id
              ? { background: 'var(--bg)', color: 'var(--text)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
              : { background: 'transparent', color: 'var(--text-mute)' }
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function FieldInput({
  icon,
  children,
  error,
  valid,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  error?: boolean
  valid?: boolean
}) {
  return (
    <div
      className="field-focus flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all"
      style={{
        background: 'var(--bg-2)',
        borderColor: error ? 'var(--red)' : valid ? 'rgba(77,141,255,0.4)' : 'var(--line-2)',
      }}
    >
      <span style={{ color: 'var(--text-mute)', display: 'flex' }}>{icon}</span>
      {children}
    </div>
  )
}

function VerifyBox({
  title,
  desc,
  onBack,
  children,
}: {
  title: string
  desc: string
  onBack: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="text-center py-4">
      <div
        className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
        style={{ background: 'var(--accent-soft)', border: '1px solid rgba(77,141,255,0.2)', color: 'var(--accent)' }}
      >
        <MailIcon />
      </div>
      <div className="text-[18px] font-semibold text-[var(--text)] mb-1.5 tracking-tight">{title}</div>
      <div className="text-[14px] text-[var(--text-dim)] leading-relaxed max-w-[320px] mx-auto">{desc}</div>
      {children}
      <button
        type="button"
        onClick={onBack}
        className="mt-5 px-5 py-2 rounded-full border text-[14px] font-medium transition-all hover:bg-[var(--bg-2)] hover:text-[var(--text)]"
        style={{ borderColor: 'var(--line-2)', color: 'var(--text-1)' }}
      >
        Resend
      </button>
    </div>
  )
}

function CodeGrid({
  code,
  onChange,
}: {
  code: string[]
  onChange: (next: string[]) => void
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const handleChange = (i: number, v: string) => {
    if (!/^[0-9]?$/.test(v)) return
    const next = [...code]
    next[i] = v
    onChange(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus()
  }
  return (
    <div className="flex gap-2.5 justify-center my-5">
      {code.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          value={c}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-14 text-center text-[22px] font-semibold rounded-lg outline-none tabular-nums transition-all"
          style={{
            background: 'var(--bg-2)',
            border: `1.5px solid ${c ? 'var(--accent)' : 'var(--line-2)'}`,
            color: c ? 'var(--accent)' : 'var(--text)',
          }}
        />
      ))}
    </div>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, initialState)
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [method, setMethod] = useState('password')
  const [showPw, setShowPw] = useState(false)
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState(['', '', '', '', '', ''])

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const goBack = () => { setStep(0); setSent(false) }

  const primaryBtn = (
    label: string,
    type: 'submit' | 'button' = 'button',
    onClick?: () => void,
    disabled?: boolean,
  ) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
      style={{ background: 'var(--accent)', color: '#001a3a', boxShadow: '0 8px 24px -10px rgba(77,141,255,0.5)' }}
    >
      {label} <ArrowRight />
    </button>
  )

  /* Step 0 — email */
  if (step === 0) {
    return (
      <div>
        <Stepper step={0} />
        <h1 className="text-[36px] font-semibold tracking-[-0.035em] leading-[1.05] mb-2.5 text-[var(--text)]">
          Welcome <span className="accent-text">back.</span>
        </h1>
        <p className="text-[15px] text-[var(--text-dim)] mb-8 leading-relaxed">
          Sign in with your work email to continue to the research desk.
        </p>

        {state?.error && step === 0 && (
          <p className="text-[var(--red)] text-[13px] mb-4">{state.error}</p>
        )}

        <div className="mb-4">
          <label className="block text-[13px] text-[var(--text-1)] font-medium mb-2">Work email</label>
          <FieldInput icon={<MailIcon />} error={!!email && !emailOk} valid={emailOk}>
            <input
              type="email"
              placeholder="you@fund.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-[var(--text-mute)]"
              style={{ color: 'var(--text)' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && emailOk) setStep(1) }}
            />
            {emailOk && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
          </FieldInput>
          {email && !emailOk && (
            <p className="text-[12.5px] mt-1.5" style={{ color: 'var(--red)' }}>Looks malformed — check the address.</p>
          )}
        </div>

        {primaryBtn('Continue', 'button', () => { if (emailOk) setStep(1) }, !emailOk)}

        <div className="flex items-center gap-3 my-6 text-[12px] text-[var(--text-mute)]">
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          or continue with
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Google', glyph: 'G', color: '#4285f4' }, { label: 'GitHub', glyph: '⌥', color: undefined }].map((s) => (
            <button
              key={s.label}
              type="button"
              className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl text-[14px] font-medium transition-all hover:bg-[var(--bg-3)] hover:border-[var(--line-3)]"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--text)' }}
            >
              <span className="font-bold" style={{ color: s.color }}>{s.glyph}</span>
              {s.label}
            </button>
          ))}
        </div>

        <p className="text-center text-[13.5px] text-[var(--text-mute)] mt-7">
          New to AtlasRoom?{' '}
          <Link href="/signup" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
            Create an account
          </Link>
        </p>
      </div>
    )
  }

  /* Step 1 — credential */
  return (
    <form action={formAction}>
      <Stepper step={1} />
      <h1 className="text-[36px] font-semibold tracking-[-0.035em] leading-[1.05] mb-2.5 text-[var(--text)]">
        Enter your <span className="accent-text">password.</span>
      </h1>
      <p className="text-[15px] text-[var(--text-dim)] mb-6 leading-relaxed">
        Signing in as{' '}
        <span style={{ color: 'var(--text)', fontWeight: 500 }}>{email}</span>{' '}
        ·{' '}
        <button type="button" onClick={goBack} className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
          change
        </button>
      </p>

      <input type="hidden" name="email" value={email} />

      <MethodTabs method={method} onSelect={(m) => { setMethod(m); setSent(false) }} />

      {state?.error && (
        <p className="text-[var(--red)] text-[13px] mb-4">{state.error}</p>
      )}

      {method === 'password' && (
        <>
          <div className="mb-4">
            <label className="block text-[13px] text-[var(--text-1)] font-medium mb-2">Password</label>
            <FieldInput icon={<LockIcon />}>
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••••••"
                autoFocus
                required
                className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-[var(--text-mute)]"
                style={{ color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-[12px] font-medium px-1.5 py-0.5 rounded-md transition-colors hover:bg-[var(--bg-3)] hover:text-[var(--text)]"
                style={{ color: 'var(--text-mute)', background: 'transparent', border: 'none' }}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </FieldInput>
          </div>

          <div className="flex justify-between items-center mb-5">
            <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer select-none" style={{ color: 'var(--text-dim)' }}>
              <input type="checkbox" defaultChecked className="hidden" />
              <span
                className="w-[18px] h-[18px] flex items-center justify-center rounded-[5px] text-[11px] font-bold"
                style={{ border: '1.5px solid var(--line-3)', background: 'var(--bg-2)', color: '#001530' }}
              >✓</span>
              Trust this device · 30 days
            </label>
            <a href="#" className="text-[13px] font-medium hover:underline" style={{ color: 'var(--accent)' }}>Forgot?</a>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-px"
            style={{ background: 'var(--accent)', color: '#001a3a', boxShadow: '0 8px 24px -10px rgba(77,141,255,0.5)' }}
          >
            Sign in <ArrowRight />
          </button>
        </>
      )}

      {method === 'magic' && (
        !sent
          ? primaryBtn('Email me a magic link', 'button', () => setSent(true))
          : <VerifyBox
              title="Link sent to your inbox."
              desc="Click the link in the email — it expires in 10 minutes."
              onBack={() => setSent(false)}
            />
      )}

      {method === 'code' && (
        !sent
          ? primaryBtn('Send 6‑digit code', 'button', () => setSent(true))
          : (
            <VerifyBox
              title={`Code sent to ${email}`}
              desc="Enter the 6‑digit code below."
              onBack={() => { setSent(false); setCode(['', '', '', '', '', '']) }}
            >
              <CodeGrid code={code} onChange={setCode} />
              {primaryBtn('Verify', 'button', undefined, code.join('').length < 6)}
            </VerifyBox>
          )
      )}

      <p className="text-center text-[13.5px] text-[var(--text-mute)] mt-7">
        Trouble signing in?{' '}
        <a href="#" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Get help</a>
      </p>
    </form>
  )
}
