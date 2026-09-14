import { Bot, Headphones, MessageCircle, RefreshCw, Send, Sparkles, X } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { getGuide } from '../guides'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const SUPPORT_URL = '/'
const createMessage = (role: AssistantMessage['role'], content: string): AssistantMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
})

export function LogAssistant() {
  const { t } = useTranslation()
  const { session, brand } = useApp()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [createMessage('assistant', t('assistant.welcome'))])
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const guide = brand && session.method ? getGuide(brand.id, session.method) : null
  const step = guide?.steps[session.guideStep]

  const suggestions = useMemo(() => [
    t('assistant.suggestions.adb'),
    t('assistant.suggestions.clean'),
    t('assistant.suggestions.mobile'),
  ], [t])

  useEffect(() => {
    setMessages([createMessage('assistant', t('assistant.welcome'))])
    setError(null)
  }, [session.language, t])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight })
  }, [messages, open, sending])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const reset = () => {
    setMessages([createMessage('assistant', t('assistant.welcome'))])
    setInput('')
    setError(null)
  }

  const send = async (content: string) => {
    const clean = content.trim()
    if (!clean || sending) return

    const userMessage = createMessage('user', clean.slice(0, 1_200))
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          context: {
            language: session.language,
            country: session.countryCode,
            brand: brand?.id ?? null,
            method: session.method,
            stepTitle: step ? t(step.titleKey) : null,
            stepDescription: step ? t(step.descriptionKey) : null,
          },
        }),
      })

      const data = await response.json() as { reply?: string; error?: string }
      if (!response.ok || !data.reply) throw new Error(data.error ?? 'assistant_unavailable')
      setMessages((current) => [...current, createMessage('assistant', data.reply as string)])
    } catch (requestError) {
      const code = requestError instanceof Error ? requestError.message : 'assistant_unavailable'
      setError(code === 'rate_limited' ? t('assistant.errors.rateLimited') : t('assistant.errors.unavailable'))
    } finally {
      setSending(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  if (!session.language || session.stage === 'language') return null

  return (
    <div className={'log-assistant' + (open ? ' is-open' : '')}>
      {open && (
        <section id="assistant-panel" className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <span className="assistant-avatar"><Bot size={21} /></span>
            <div>
              <strong id="assistant-title">{t('assistant.title')}</strong>
              <small><span />{t('assistant.status')}</small>
            </div>
            <button type="button" onClick={reset} aria-label={t('assistant.reset')} title={t('assistant.reset')}><RefreshCw size={17} /></button>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('actions.close')}><X size={19} /></button>
          </header>

          {step && (
            <div className="assistant-context">
              <Sparkles size={14} />
              <span>{t('assistant.context', { step: t(step.titleKey) })}</span>
            </div>
          )}

          <div className="assistant-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={'assistant-message is-' + message.role}>
                {message.role === 'assistant' && <span><Bot size={15} /></span>}
                <p>{message.content}</p>
              </div>
            ))}
            {sending && (
              <div className="assistant-message is-assistant is-typing" aria-label={t('assistant.thinking')}>
                <span><Bot size={15} /></span><p><i /><i /><i /></p>
              </div>
            )}
            {error && (
              <div className="assistant-error">
                <p>{error}</p>
                <a href={SUPPORT_URL} target="_blank" rel="noreferrer"><Headphones size={15} />{t('assistant.support')}</a>
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="assistant-suggestions">
              {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(suggestion)}>{suggestion}</button>)}
            </div>
          )}

          <form className="assistant-form" onSubmit={submit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              maxLength={1_200}
              rows={1}
              placeholder={t('assistant.placeholder')}
              aria-label={t('assistant.placeholder')}
              disabled={sending}
            />
            <button type="submit" disabled={!input.trim() || sending} aria-label={t('assistant.send')}><Send size={18} /></button>
          </form>
          <p className="assistant-disclaimer">{t('assistant.disclaimer')}</p>
        </section>
      )}

      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        aria-label={open ? t('actions.close') : t('assistant.open')}
      >
        {open ? <X size={24} /> : <MessageCircle size={25} />}
        {!open && <span aria-hidden="true" />}
      </button>
    </div>
  )
}
