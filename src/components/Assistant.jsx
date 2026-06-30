import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, X, Send, MessageCircle } from 'lucide-react'
import { askAssistant, quickQuestions, getHelp, APP_NAME } from '../lib/help'

// Assistente virtuale: pulsante fluttuante in basso a destra + pannello chat.
// Conosce la sezione in cui ti trovi e risponde a domande su cosa puoi farci.
export default function Assistant({ path }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [text, setText] = useState('')
  const scrollRef = useRef(null)
  const help = getHelp(path)

  // messaggio di benvenuto, aggiornato in base alla sezione corrente
  useEffect(() => {
    if (!open) return
    setMsgs((m) => {
      const greet = {
        from: 'bot',
        text: `Ciao! Sono l’assistente di ${APP_NAME}. Sei in “${help.title}”. ${help.tagline} Chiedimi pure cosa puoi fare qui o in un’altra sezione.`,
      }
      // se la chat è vuota o la sezione è cambiata, rinfresca il saluto iniziale
      if (m.length === 0) return [greet]
      return m
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, path])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open])

  const send = (q) => {
    const question = (q ?? text).trim()
    if (!question) return
    const { text: answer, section } = askAssistant(path, question)
    setMsgs((m) => [
      ...m,
      { from: 'me', text: question },
      { from: 'bot', text: answer, section },
    ])
    setText('')
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Pulsante fluttuante */}
      <button
        className={'cc-asst-fab' + (open ? ' hidden' : '')}
        onClick={() => setOpen(true)}
        aria-label="Apri l'assistente"
      >
        <Sparkles size={20} />
        <span className="cc-asst-fab-txt">Assistente</span>
      </button>

      {/* Pannello chat */}
      {open && (
        <div className="cc-asst-panel cc-anim-rise" role="dialog" aria-label="Assistente Vitae">
          <div className="cc-asst-head">
            <div className="cc-asst-avatar"><Sparkles size={16} /></div>
            <div className="cc-asst-head-txt">
              <div className="cc-asst-name">Assistente {APP_NAME}</div>
              <div className="cc-asst-sec">Sezione: {help.title}</div>
            </div>
            <button className="cc-asst-x" onClick={() => setOpen(false)} aria-label="Chiudi">
              <X size={18} />
            </button>
          </div>

          <div className="cc-asst-msgs" ref={scrollRef}>
            {msgs.map((m, k) => (
              <div key={k} className={'cc-asst-msg ' + m.from}>
                {m.from === 'bot' && <div className="cc-asst-msg-ico"><MessageCircle size={14} /></div>}
                <div className="cc-asst-bubble">
                  {m.text.split('\n').map((line, j) => <div key={j}>{line || ' '}</div>)}
                  {m.section && (
                    <div className="cc-asst-hint">↳ Questa funzione è nella sezione “{m.section}”.</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cc-asst-chips">
            {quickQuestions(path).map((q, k) => (
              <button key={k} className="cc-asst-chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          <div className="cc-asst-input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              placeholder="Scrivi una domanda…"
              aria-label="Scrivi una domanda"
            />
            <button onClick={() => send()} aria-label="Invia" disabled={!text.trim()}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
