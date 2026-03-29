'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatPane() {
  const [messages, setMessages] = useState<Message[]>([])
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(userText: string) {
    const userMessage: Message = { role: 'user', content: userText }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setStreaming(true)

    // Add empty assistant message that we'll stream into
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: 'Error: failed to get response.',
          }
          return updated
        })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[#131d2e] bg-[#0a0f1a] flex-shrink-0">
        <span className="font-mono text-[9px] tracking-widest text-[#2a3a52]">
          RESEARCH CHAT
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="text-center text-[#2a3a52] font-mono text-xs py-8">
            ask a question about Japan macro or crypto
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSubmit={handleSubmit} disabled={streaming} />
    </div>
  )
}
