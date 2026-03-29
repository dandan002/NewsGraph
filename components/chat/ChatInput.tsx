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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!value.trim() || disabled) return
      onSubmit(value.trim())
      setValue('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 flex-shrink-0">
      <div className="flex items-end gap-2 bg-[#0d1424] rounded-xl ring-1 ring-[#1a2a3a] focus-within:ring-blue-700/50 transition-all px-3 py-2.5">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a research question..."
          disabled={disabled}
          aria-label="Research question"
          rows={1}
          className="flex-1 bg-transparent text-slate-300 text-[11.5px] placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed disabled:opacity-40"
          style={{ maxHeight: '96px', overflowY: 'auto' }}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-[#131d2e] disabled:text-slate-700 text-white flex items-center justify-center transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-[9px] text-slate-700 mt-1.5 text-center tracking-wide">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  )
}
