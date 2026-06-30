import React, { useEffect, useRef, useState } from 'react'
import { X, ArrowRight, ArrowLeft, Lightbulb, Compass, LogOut } from 'lucide-react'
import { getHelp, hasSeenTour, markTourSeen } from '../lib/help'

// Tutorial della singola scheda.
// Tre modi di apertura:
//  1) automatico, la prima volta che apri una sezione (enabled === true)
//  2) su richiesta, dal pulsante "Rivedi tutorial" (replayKey)
//  3) giro guidato: Layout naviga di sezione in sezione e lo tiene aperto
//     (guidedActive === true), avanzando con onGuidedNext / uscendo con onGuidedExit
export default function TabTour({
  path,
  replayKey = 0,
  enabled = true,
  guidedActive = false,
  guidedIndex = 0,
  guidedTotal = 0,
  onGuidedNext,
  onGuidedExit,
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const help = getHelp(path)
  const steps = help.steps || []
  const wasGuided = useRef(false)

  // 1) apertura automatica al primo accesso alla scheda
  //    (sospesa durante l'onboarding e durante il giro guidato: enabled === false)
  useEffect(() => {
    if (!enabled || !steps.length) return
    if (!hasSeenTour(path)) {
      setStep(0)
      setOpen(true)
      markTourSeen(path)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled])

  // 2) apertura su richiesta (replay dal pulsante "Rivedi tutorial")
  useEffect(() => {
    if (replayKey > 0 && steps.length) {
      setStep(0)
      setOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayKey])

  // 3) giro guidato: ad ogni sezione riapri dal primo passo
  useEffect(() => {
    if (!guidedActive) return
    if (!steps.length) { onGuidedNext?.(); return } // sezione senza tutorial: salta
    setStep(0)
    setOpen(true)
    markTourSeen(path)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, guidedActive])

  // chiudi quando il giro guidato termina (transizione true -> false)
  useEffect(() => {
    if (wasGuided.current && !guidedActive) setOpen(false)
    wasGuided.current = guidedActive
  }, [guidedActive])

  if (!open || !steps.length) return null

  // Al cambio sezione `steps` si aggiorna subito ma `step` viene azzerato solo
  // nell'effetto (post-render): blindiamo l'indice per non leggere steps[undefined].
  const safeStep = Math.min(step, steps.length - 1)
  const cur = steps[safeStep]
  const last = safeStep === steps.length - 1
  const guidedLastSection = guidedActive && guidedIndex >= guidedTotal - 1
  const close = () => setOpen(false)

  const handlePrimary = () => {
    if (!last) { setStep(safeStep + 1); return }
    if (guidedActive) { onGuidedNext?.(); return }
    close()
  }

  const handleX = () => (guidedActive ? onGuidedExit?.() : close())
  const handleScrim = () => { if (!guidedActive) close() }

  return (
    <div className="cc-tour-scrim" role="dialog" aria-modal="true" onClick={handleScrim}>
      <div className="cc-tour-card cc-anim-pop" onClick={(e) => e.stopPropagation()}>
        <div className="cc-tour-head">
          <div className="cc-tour-badge">
            {guidedActive ? <Compass size={15} /> : <Lightbulb size={15} />}
          </div>
          <div>
            <div className="cc-tour-eyebrow">
              {guidedActive
                ? `Giro guidato · ${guidedIndex + 1} di ${guidedTotal}`
                : `Tutorial · ${help.title}`}
            </div>
            <div className="cc-tour-tag">{guidedActive ? help.title : help.tagline}</div>
          </div>
          <button className="cc-tour-x" onClick={handleX} aria-label={guidedActive ? 'Esci dal giro' : 'Chiudi'}>
            <X size={18} />
          </button>
        </div>

        <div className="cc-tour-body" key={safeStep}>
          <div className="cc-tour-step-n">Passo {safeStep + 1} di {steps.length}</div>
          <h3 className="cc-tour-title">{cur.title}</h3>
          <p className="cc-tour-text">{cur.body}</p>
        </div>

        <div className="cc-tour-progress">
          {steps.map((_, k) => (
            <span key={k} className={'cc-tour-bar' + (k <= safeStep ? ' on' : '')} />
          ))}
        </div>

        <div className="cc-tour-actions">
          {safeStep > 0 ? (
            <button className="cc-ob-btn ghost" onClick={() => setStep(safeStep - 1)}>
              <ArrowLeft size={16} /> Indietro
            </button>
          ) : guidedActive ? (
            <button className="cc-ob-btn ghost" onClick={() => onGuidedExit?.()}>
              <LogOut size={15} /> Esci dal giro
            </button>
          ) : (
            <button className="cc-ob-btn ghost" onClick={close}>Chiudi</button>
          )}
          <button className="cc-ob-btn primary" onClick={handlePrimary}>
            {guidedActive
              ? (guidedLastSection && last ? 'Fine 🎉' : <>Avanti <ArrowRight size={16} /></>)
              : (last ? 'Ho capito' : <>Avanti <ArrowRight size={16} /></>)}
          </button>
        </div>
      </div>
    </div>
  )
}
