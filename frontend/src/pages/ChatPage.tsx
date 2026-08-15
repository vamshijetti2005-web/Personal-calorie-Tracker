import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api'
import { Button, Card, ErrorBanner, PageHeader } from '../components/UI'
import type { ChatMessage } from '../types'

const welcome: ChatMessage = {
  role: 'assistant',
  content:
    'Hi! I can log meals, check your goals, review date ranges, and summarize nutrition reports. What would you like to do?',
}

const suggestions = [
  'What is my current goal?',
  'Summarize my calories this week.',
  'How are my macros looking today?',
  'Help me log lunch.',
]

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcome])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTools, setLastTools] = useState<string[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function send(content: string) {
    const text = content.trim()
    if (!text || sending) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user' as const, content: text },
    ].slice(-20)
    setMessages(nextMessages)
    setDraft('')
    setSending(true)
    setError(null)
    setLastTools([])

    try {
      const response = await api.chat.send(nextMessages)
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.reply },
      ])
      setLastTools(response.toolsUsed)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The assistant could not respond',
      )
    } finally {
      setSending(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void send(draft)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gemini assistant"
        title="Nutrition chat"
        description="Use natural language to review your diary and goals or log a meal through the same secured backend services."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className="flex min-h-[620px] flex-col p-0">
          <div
            className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-emerald-900 text-white'
                      : 'rounded-bl-md bg-stone-100 text-stone-700'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3 text-sm text-stone-400">
                  Thinking and checking your data…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-stone-100 p-4 sm:p-5">
            <ErrorBanner error={error} />
            {lastTools.length > 0 && (
              <p className="mb-2 text-xs text-stone-400">
                Used: {lastTools.join(', ')}
              </p>
            )}
            <form className="flex gap-2" onSubmit={submit}>
              <label className="sr-only" htmlFor="chat-message">
                Message
              </label>
              <input
                id="chat-message"
                className="min-h-11 flex-1 rounded-xl border border-stone-200 bg-stone-50 px-4 text-sm outline-none focus:border-emerald-700 focus:bg-white focus:ring-3 focus:ring-emerald-700/10"
                value={draft}
                maxLength={4000}
                placeholder="Ask about your nutrition…"
                onChange={(event) => setDraft(event.target.value)}
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !draft.trim()}>
                Send
              </Button>
            </form>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card>
            <h2 className="font-display text-xl text-emerald-950">
              Try asking
            </h2>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-left text-sm text-stone-600 transition hover:border-emerald-600 hover:bg-emerald-50"
                  disabled={sending}
                  onClick={() => void send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
          <Card className="bg-amber-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Before it writes
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              The assistant asks for required meal or goal details. Check its
              confirmation after any action. Nutrition guidance is not medical
              advice.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  )
}
