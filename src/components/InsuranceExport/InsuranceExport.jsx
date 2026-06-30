import { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Download, Mail, Check } from 'lucide-react'
import * as store from '../../store'
import { buildInsuranceReport } from '../../lib/insuranceExport'

const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

function Step1({ profile, episodes, selectedEpisodes, setSelectedEpisodes, includeProfile, setIncludeProfile, onNext, onClose }) {
  const byZone = episodes.reduce((acc, ep) => {
    const key = ep.body_area || 'Altro'
    if (!acc[key]) acc[key] = []
    acc[key].push(ep)
    return acc
  }, {})

  const toggleEp = (id) => {
    setSelectedEpisodes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedEpisodes.length === episodes.length)
      setSelectedEpisodes([])
    else
      setSelectedEpisodes(episodes.map(e => e.id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Seleziona dati da includere</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      {/* Profile section */}
      <div className="mb-4 bg-blue-50 rounded-xl p-3 border border-blue-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeProfile} onChange={e => setIncludeProfile(e.target.checked)} className="rounded accent-blue-600" />
          <span className="text-sm font-medium text-blue-800">Includi profilo (allergie, farmaci, condizioni)</span>
        </label>
        {includeProfile && (
          <div className="mt-2 text-xs text-blue-600 pl-6">
            {store.allergies.all().length} allergie · {store.medications.all().length} farmaci · {store.conditions.all().length} condizioni
          </div>
        )}
      </div>

      {/* Episodes */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Episodi ({episodes.length})</span>
          <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
            {selectedEpisodes.length === episodes.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
          {Object.entries(byZone).map(([zone, eps]) => (
            <div key={zone}>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{zone}</div>
              {eps.map(ep => (
                <label key={ep.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedEpisodes.includes(ep.id)}
                    onChange={() => toggleEp(ep.id)}
                    className="mt-0.5 rounded accent-violet-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{ep.diagnosis || ep.type}</div>
                    <div className="text-xs text-gray-400">{ep.start_date}{ep.end_date ? ` → ${ep.end_date}` : ''}</div>
                    {(ep.documents || []).length > 0 && (
                      <div className="text-xs text-violet-500 mt-0.5">
                        {ep.documents.length} allegato/i
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ))}
          {episodes.length === 0 && (
            <div className="text-center text-gray-400 py-4 text-sm">Nessun episodio registrato.</div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <button onClick={onClose} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`}>Annulla</button>
        <button
          onClick={onNext}
          disabled={!includeProfile && selectedEpisodes.length === 0}
          className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          Anteprima <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function Step2({ html, onBack, onNext, onClose }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Anteprima report</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <div
        className="border border-gray-200 rounded-xl p-4 max-h-72 overflow-y-auto bg-white text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex justify-between gap-2 pt-3 border-t border-gray-100 mt-4">
        <button onClick={onBack} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1`}>
          <ChevronLeft size={14} /> Indietro
        </button>
        <button onClick={onNext} className={`${btn} bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1`}>
          Invia / Scarica <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function Step3({ html, profile, onBack, onClose }) {
  const [email, setEmail] = useState('')
  const [printed, setPrinted] = useState(false)

  const printReport = () => {
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>Report Medico</title><style>body{font-family:Georgia,serif;margin:0;padding:2rem;}@media print{body{padding:0;}}</style></head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
    setPrinted(true)
  }

  const mailtoLink = () => {
    const subject = encodeURIComponent(`Report Medico — ${profile.name || 'Paziente'}`)
    const body = encodeURIComponent('In allegato il report medico generato dalla Medical Dashboard.\n\n[Allegare il PDF scaricato]')
    return `mailto:${email}?subject=${subject}&body=${body}`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Invia / Scarica</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Scarica come PDF</p>
          <p className="text-xs text-gray-400 mb-3">Apre il report in una nuova finestra pronto per la stampa / salvataggio PDF.</p>
          <button
            onClick={printReport}
            className={`${btn} bg-gray-900 text-white hover:bg-gray-700 flex items-center gap-1.5`}
          >
            {printed ? <Check size={14} /> : <Download size={14} />}
            {printed ? 'Report aperto' : 'Scarica PDF'}
          </button>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm font-medium text-blue-800 mb-2">Invia via email</p>
          <input
            type="email"
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2"
            placeholder="email@assicurazione.it"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <a
            href={mailtoLink()}
            className={`${btn} inline-flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 ${!email ? 'opacity-40 pointer-events-none' : ''}`}
          >
            <Mail size={14} /> Apri in email
          </a>
          <p className="text-xs text-blue-500 mt-2">Allega manualmente il PDF scaricato.</p>
        </div>
      </div>

      <div className="flex justify-start pt-3 border-t border-gray-100 mt-4">
        <button onClick={onBack} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1`}>
          <ChevronLeft size={14} /> Indietro
        </button>
      </div>
    </div>
  )
}

export default function InsuranceExport({ onClose }) {
  const [step, setStep] = useState(1)
  const [selectedEpisodes, setSelectedEpisodes] = useState([])
  const [includeProfile, setIncludeProfile] = useState(true)
  const [html, setHtml] = useState('')

  const profile    = store.getProfile()
  const episodes   = store.episodes.all()
  const allergyList  = store.allergies.all()
  const medList      = store.medications.all()
  const condList     = store.conditions.all()

  const buildHtml = () => {
    const selEps = episodes.filter(e => selectedEpisodes.includes(e.id))
    return buildInsuranceReport({
      profile,
      selectedEpisodes: selEps,
      allergies: includeProfile ? allergyList : [],
      medications: includeProfile ? medList : [],
      conditions: includeProfile ? condList : [],
    })
  }

  const goToStep2 = () => {
    setHtml(buildHtml())
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-1.5 ${s < 3 ? 'flex-1' : ''}`}>
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-colors
                ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Step1
            profile={profile}
            episodes={episodes}
            selectedEpisodes={selectedEpisodes}
            setSelectedEpisodes={setSelectedEpisodes}
            includeProfile={includeProfile}
            setIncludeProfile={setIncludeProfile}
            onNext={goToStep2}
            onClose={onClose}
          />
        )}
        {step === 2 && (
          <Step2
            html={html}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            onClose={onClose}
          />
        )}
        {step === 3 && (
          <Step3
            html={html}
            profile={profile}
            onBack={() => setStep(2)}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
