'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BookOpen, Send, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Citation {
  index: number
  entityId: string
  entityType: string
  similarity: number
  excerpt: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

const SUGGESTED_QUESTIONS = [
  'Come funziona il fee waterfall?',
  'Cosa succede se non firmo entro 30 giorni?',
  'Quali sono le sanzioni del Codice Etico?',
  "Cos'è la non-circumvention?",
  'Come funziona il Patto di Ingresso?',
  'Quali sono i diritti di un Friend originator?',
]

export default function KnowledgeBaseClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }, [input])

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return

      const userMessage: Message = { role: 'user', content: question.trim() }
      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      // Add placeholder assistant message
      const assistantIndex = messages.length + 1
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      try {
        const res = await fetch('/api/knowledge-base/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.trim(), conversationId }),
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || 'Errore nella richiesta')
        }

        const contentType = res.headers.get('content-type') || ''

        if (contentType.includes('application/json')) {
          // Non-streaming response (no results found)
          const data = await res.json()
          setMessages((prev) => {
            const updated = [...prev]
            updated[assistantIndex] = {
              role: 'assistant',
              content: data.answer,
              citations: data.citations,
            }
            return updated
          })
        } else {
          // Streaming NDJSON response
          const reader = res.body?.getReader()
          if (!reader) throw new Error('No response body')

          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const event = JSON.parse(line)

                if (event.type === 'text') {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const msg = updated[assistantIndex]
                    if (msg) {
                      updated[assistantIndex] = {
                        ...msg,
                        content: msg.content + event.text,
                      }
                    }
                    return updated
                  })
                } else if (event.type === 'citations') {
                  setMessages((prev) => {
                    const updated = [...prev]
                    const msg = updated[assistantIndex]
                    if (msg) {
                      updated[assistantIndex] = {
                        ...msg,
                        citations: event.citations,
                      }
                    }
                    return updated
                  })
                } else if (event.type === 'error') {
                  setMessages((prev) => {
                    const updated = [...prev]
                    updated[assistantIndex] = {
                      role: 'assistant',
                      content: event.error,
                    }
                    return updated
                  })
                }
              } catch {
                // Skip malformed JSON lines
              }
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Errore sconosciuto'
        setMessages((prev) => {
          const updated = [...prev]
          updated[assistantIndex] = {
            role: 'assistant',
            content: `Si è verificato un errore: ${errorMessage}`,
          }
          return updated
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages.length, conversationId]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#D4AF37]/20">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#b8962d] shadow-md shadow-[#D4AF37]/20">
          <BookOpen className="w-5 h-5 text-[#001220]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#001220] font-[family-name:var(--font-cormorant)]">
            Chiedi a Minerva
          </h1>
          <p className="text-xs text-slate-500">
            Knowledge Base Q&A — Codici e regolamenti
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#001220]">
              <Sparkles className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#001220] font-[family-name:var(--font-cormorant)] mb-1">
                Knowledge Base Minerva
              </h2>
              <p className="text-sm text-slate-500 max-w-md">
                Fai una domanda sui Codici, regolamenti e procedure di Minerva
                Partners. Le risposte sono basate esclusivamente sui documenti
                ufficiali.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className={cn(
                    'text-left px-4 py-3 rounded-xl text-sm transition-all',
                    'border border-[#D4AF37]/30 text-[#001220]',
                    'hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60',
                    'active:scale-[0.98]'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3',
                    msg.role === 'user'
                      ? 'bg-[#D4AF37] text-[#001220]'
                      : 'bg-[#001220] text-white border border-[#D4AF37]/30'
                  )}
                >
                  {/* Message content */}
                  {msg.content ? (
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  ) : isLoading && msg.role === 'assistant' ? (
                    <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sto cercando nei Codici...
                    </div>
                  ) : null}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/20 space-y-2">
                      <p className="text-xs font-medium text-[#D4AF37]">
                        Fonti utilizzate:
                      </p>
                      {msg.citations.map((c) => (
                        <div
                          key={c.index}
                          className="text-xs rounded-lg bg-white/10 px-3 py-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-[#D4AF37]">
                              [FONTE {c.index}]
                            </span>
                            <span className="text-[#D4AF37]/70">
                              {(c.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-white/70 line-clamp-2">
                            {c.entityId}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi la tua domanda..."
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm',
              'text-[#001220] placeholder:text-slate-400',
              'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]',
              'disabled:bg-slate-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl transition-all',
              'bg-[#001220] text-white hover:bg-[#001220]/90',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              input.trim() && !isLoading && 'shadow-md shadow-[#001220]/20'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Le risposte sono generate dall&apos;AI basandosi sui documenti della
          Knowledge Base. Verifica sempre le informazioni critiche.
        </p>
      </div>
    </div>
  )
}
