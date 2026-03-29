'use client'

import { useActionState } from 'react'
import { signUp } from '@/app/signup/actions'

const initialState = { error: '' }

export function SignupForm() {
  const [state, formAction] = useActionState(signUp as any, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <p className="text-red-400 text-sm font-mono">{state.error}</p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-sm py-2 rounded transition-colors"
      >
        CREATE ACCOUNT
      </button>
    </form>
  )
}
