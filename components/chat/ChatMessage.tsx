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

  const parts = content.split(/(\[\d+\])/g)

  return (
    <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
      <span className={`text-[9px] tracking-widest ${isUser ? 'text-slate-600' : 'text-blue-500/70'}`}>
        {isUser ? 'YOU' : 'ANALYST'}
      </span>
      <div
        className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[11.5px] leading-relaxed ${
          isUser
            ? 'bg-[#131d2e] text-slate-300'
            : 'bg-[#0d1a2e] text-slate-200 ring-1 ring-blue-900/40'
        }`}
      >
        {parts.map((part, i) => {
          const match = part.match(/^\[(\d+)\]$/)
          if (match) {
            return (
              <span key={i} className="text-blue-400 font-semibold text-[10px]">
                {part}
              </span>
            )
          }
          return <span key={i}>{part}</span>
        })}
      </div>

      {citations.length > 0 && (
        <div className="flex flex-col gap-0.5 w-full max-w-[92%] mt-0.5">
          {citations.map((c) => (
            <a
              key={c.index}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-slate-700 hover:text-blue-400 transition-colors"
            >
              [{c.index}] {c.source} · {c.date}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
