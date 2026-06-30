import React, { useState } from 'react'
import { Heart, Menu, Compass, Sparkles, ShieldCheck, ArrowRight, ArrowLeft, Wand2, MapPin } from 'lucide-react'
import { ONBOARDING, APP_NAME } from '../lib/help'

const ICONS = { heart: Heart, menu: Menu, compass: Compass, sparkles: Sparkles, shield: ShieldCheck }

// Onboarding mostrato una sola volta, al primo accesso in assoluto.
// onClose(startTour) — startTour === true se l'utente sceglie il giro guidato.
export default function OnboardingModal({ onClose }) {
  const [i, setI] = useState(0)
  const [ask, setAsk] = useState(false) // schermata finale: "vuoi fare un giro di prova?"
  const slide = ONBOARDING[i]
  const Icon = ICONS[slide.icon] || Sparkles
  const last = i === ONBOARDING.length - 1

  const next = () => (last ? setAsk(true) : setI(i + 1))
  const back = () => setI(Math.max(0, i - 1))

  // ── Schermata finale: proposta del giro guidato ──
  if (ask) {
    return (
      <div className="cc-ob-scrim" role="dialog" aria-modal="true">
        <div className="cc-ob-card cc-anim-pop">
          <div className="cc-ob-icon">
            <Wand2 />
          </div>
          <div className="cc-ob-eyebrow">{APP_NAME} · Tutto pronto</div>
          <h2 className="cc-ob-title">Vuoi fare un giro di prova? 🚀</h2>
          <p className="cc-ob-body">
            Posso accompagnarti sezione per sezione e mostrarti al volo tutte le funzionalità. 👀
            Bastano un paio di minuti — oppure esplori da solo e ti spiego ogni scheda appena la apri.
          </p>

          <div className="cc-ob-choice">
            <button className="cc-ob-btn primary" onClick={() => onClose(true)}>
              <MapPin size={16} /> Sì, fammi vedere tutto
            </button>
            <button className="cc-ob-btn ghost" onClick={() => onClose(false)}>
              No, esploro da solo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Slide introduttive ──
  return (
    <div className="cc-ob-scrim" role="dialog" aria-modal="true">
      <div className="cc-ob-card cc-anim-pop">
        <button className="cc-ob-skip" onClick={() => onClose(false)}>Salta</button>

        <div className="cc-ob-icon" key={i}>
          <Icon />
        </div>

        <div className="cc-ob-eyebrow">{APP_NAME} · Guida rapida</div>
        <h2 className="cc-ob-title" key={'t' + i}>{slide.title}</h2>
        <p className="cc-ob-body" key={'b' + i}>{slide.body}</p>

        <div className="cc-ob-dots">
          {ONBOARDING.map((_, k) => (
            <button
              key={k}
              className={'cc-ob-dot' + (k === i ? ' on' : '')}
              onClick={() => setI(k)}
              aria-label={`Vai alla slide ${k + 1}`}
            />
          ))}
        </div>

        <div className="cc-ob-actions">
          {i > 0 ? (
            <button className="cc-ob-btn ghost" onClick={back}>
              <ArrowLeft size={16} /> Indietro
            </button>
          ) : <span />}
          <button className="cc-ob-btn primary" onClick={next}>
            {last ? 'Continua' : 'Avanti'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
