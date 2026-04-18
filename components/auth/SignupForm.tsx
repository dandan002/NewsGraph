'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { signUp } from '@/app/signup/actions'
import type { AuthState } from '@/app/login/actions'
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

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, initialState)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pwOk = password.length >= 6

  return (
    <form action={formAction}>
      <h1 className="text-[36px] font-semibold tracking-[-0.035em] leading-[1.05] mb-2.5 text-[var(--text)]">
        Open an <span className="accent-text">account.</span>
      </h1>
      <p className="text-[15px] text-[var(--text-dim)] mb-8 leading-relaxed">
        Free during beta. Use a work email so we can fast-track approval.
      </p>

      {state?.error && (
        <p className="text-[13px] mb-4" style={{ color: 'var(--red)' }}>{state.error}</p>
      )}

      <div className="mb-4">
        <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-1)' }}>Work email</label>
        <FieldInput icon={<MailIcon />} error={!!email && !emailOk} valid={emailOk}>
          <input
            name="email"
            type="email"
            placeholder="you@fund.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-[var(--text-mute)]"
            style={{ color: 'var(--text)' }}
          />
          {emailOk && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
        </FieldInput>
        {email && !emailOk && (
          <p className="text-[12.5px] mt-1.5" style={{ color: 'var(--red)' }}>Looks malformed — check the address.</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-[13px] font-medium mb-2" style={{ color: 'var(--text-1)' }}>Password</label>
        <FieldInput icon={<LockIcon />}>
          <input
            name="password"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
        <p
          className="text-[12.5px] mt-1.5"
          style={{ color: pwOk ? 'var(--accent)' : 'var(--text-mute)' }}
        >
          {password.length === 0
            ? 'At least 6 characters · 1 number recommended'
            : pwOk
            ? 'Strong enough — proceed.'
            : `${6 - password.length} more characters · 1 number recommended`}
        </p>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
        style={{ background: 'var(--accent)', color: '#001a3a', boxShadow: '0 8px 24px -10px rgba(77,141,255,0.5)' }}
        disabled={!emailOk || !pwOk}
      >
        Create account <ArrowRight />
      </button>

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
            className="flex items-center justify-center gap-2.5 py-3 px-3.5 rounded-xl text-[14px] font-medium transition-all hover:bg-[var(--bg-3)]"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--line-2)', color: 'var(--text)' }}
          >
            <span className="font-bold" style={{ color: s.color }}>{s.glyph}</span>
            {s.label}
          </button>
        ))}
      </div>

      <p className="text-center text-[13.5px] mt-7" style={{ color: 'var(--text-mute)' }}>
        By creating an account you agree to the{' '}
        <a href="#" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Terms</a>
        {' '}and{' '}
        <a href="#" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>Privacy Policy</a>.
      </p>

      <p className="text-center text-[13.5px] mt-3" style={{ color: 'var(--text-mute)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--accent)' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
