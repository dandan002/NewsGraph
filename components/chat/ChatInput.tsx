'use client'

import { useState } from 'react'

interface ChatInputProps {
  onSubmit: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit(value.trim())
    setValue('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!value.trim() || disabled) return
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-2 border-t border-[#131d2e] bg-[#0a0f1a]"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ask a research question..."
        disabled={disabled}
        aria-label="Research question"
        className="flex-1 bg-[#0d1525] border border-[#1a2740] rounded px-3 py-2 text-slate-300 font-mono text-[11px] placeholder:text-[#2a3a52] focus:outline-none focus:border-blue-600 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="bg-[#1a3a6e] hover:bg-[#1e4a8e] text-blue-300 font-mono text-[11px] px-3 py-2 rounded transition-colors disabled:opacity-40"
      >
        ↵
      </button>
    </form>
  )
}
