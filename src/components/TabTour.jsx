import React, { useEffect, useState } from 'react'
import { X, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react'
import { getHelp, hasSeenTour, markTourSeen } from '../lib/help'

// Tutorial della singola scheda: si apre da solo la prima volta che apri
// una sezione, oppure su richiesta (pulsante "?") tramite `replayKey`.
export default function TabTour({ path, replayKey = 0, enabled = true }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const help = getHelp(path)
  const steps = help.steps || []

  // apertura automatica al primo accesso alla scheda
  // (sospesa finché l'onboarding iniziale è a schermo: enabled === false)
  useEffect(() => {
    if (!enabled || !steps.length) return
    if (!hasSeenTour(path)) {
      setStep(0)
      setOpen(true)
      markTourSeen(path)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled])

  // apertura su richiesta (replay dal pulsante "?")
  useEffect(() => {
    if (replayKey > 0 && steps.length) {
      setStep(0)
      setOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey])

  if (!open || !steps.length) return null

  const cur = steps[step]
  const last = step === steps.length - 1
  const close = () => setOpen(false)

  return (
    <div className="cc-tour-scrim" role="dialog" aria-modal="true" onClick={close}>
      <div className="cc-tour-card cc-anim-pop" onClick={(e) => e.stopPropagation()}>
        <div className="cc-tour-head">
          <div className="cc-tour-badge"><Lightbulb size={15} /></div>
          <div>
            <div className="cc-tour-eyebrow">Tutorial · {help.title}</div>
            <div className="cc-tour-tag">{help.tagline}</div>
          </div>
          <button className="cc-tour-x" onClick={close} aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="cc-tour-body" key={step}>
          <div className="cc-tour-step-n">Passo {step + 1} di {steps.length}</div>
          <h3 className="cc-tour-title">{cur.title}</h3>
          <p className="cc-tour-text">{cur.body}</p>
        </div>

        <div className="cc-tour-progress">
          {steps.map((_, k) => (
            <span key={k} className={'cc-tour-bar' + (k <= step ? ' on' : '')} />
          ))}
        </div>

        <div className="cc-tour-actions">
          {step > 0 ? (
            <button className="cc-ob-btn ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={16} /> Indietro
            </button>
          ) : (
            <button className="cc-ob-btn ghost" onClick={close}>Chiudi</button>
          )}
          <button className="cc-ob-btn primary" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? 'Ho capito' : 'Avanti'} {!last && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
