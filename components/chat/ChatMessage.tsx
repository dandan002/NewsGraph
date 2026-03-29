interface Citation {
  index: number
  source: string
  date: string
  url: string
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export function ChatMessage({ role, content, citations = [] }: ChatMessageProps) {
  const isUser = role === 'user'

  // Parse [N] citation markers in content
  const parts = content.split(/(\[\d+\])/g)

  return (
    <div
      className={`rounded p-2.5 border-l-2 ${
        isUser ? 'border-l-[#1e3a5a] bg-[#0d1525]' : 'border-l-blue-500 bg-[#0a1628]'
      }`}
    >
      <div
        className={`font-mono text-[9px] mb-1.5 ${
          isUser ? 'text-slate-500' : 'text-blue-400'
        }`}
      >
        {isUser ? 'analyst' : 'research assistant'}
      </div>
      <div className="font-mono text-[11px] text-slate-300 leading-relaxed">
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/)
          if (match) {
            return (
              <span key={i} className="text-blue-400 font-semibold">
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>
      {citations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#131d2e] flex flex-col gap-0.5">
          {citations.map((c) => (
            <a
              key={c.index}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[9px] text-[#2a3a52] hover:text-blue-400 transition-colors"
            >
              [{c.index}] {c.source} · {c.date}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
