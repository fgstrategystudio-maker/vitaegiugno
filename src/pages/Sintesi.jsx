import React, { useState } from 'react'
import { Printer, ClipboardList, Brain, SlidersHorizontal } from 'lucide-react'
import * as store from '../store'

const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
const lsSave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

function Section({ title, children, color = 'text-gray-700', empty }) {
  if (empty) return null
  return (
    <div className="mb-5 print:mb-4">
      <h2 className={`text-xs font-bold uppercase tracking-widest mb-2 pb-1 border-b border-gray-200 ${color}`}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm py-0.5">
      <span className="text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  )
}

function isDrugAllergy(a) {
  return a.drug_allergy || (a.type || '').toLowerCase().includes('farmaco') || (a.type || '').toLowerCase().includes('drug')
}

const ALL_SECTIONS = [
  { key: 'profile',       label: 'Dati paziente',           group: 'Anagrafica' },
  { key: 'allergies',     label: 'Allergie e intolleranze',  group: 'Anagrafica' },
  { key: 'meds_active',   label: 'Farmaci attivi',           group: 'Clinico' },
  { key: 'meds_past',     label: 'Farmaci — storico',        group: 'Clinico' },
  { key: 'conditions',    label: 'Patologie e condizioni',   group: 'Clinico' },
  { key: 'vaccinations',  label: 'Vaccinazioni',             group: 'Clinico' },
  { key: 'doctors',       label: 'Medici di riferimento',    group: 'Clinico' },
  { key: 'family',        label: 'Anamnesi familiare',       group: 'Clinico' },
  { key: 'episodes',      label: 'Episodi clinici',          group: 'Storia' },
  { key: 'injuries',      label: 'Infortuni',                group: 'Storia' },
  { key: 'watchlist',     label: 'Diario / Appunti',         group: 'Storia' },
  { key: 'screening',     label: 'Screening periodici',      group: 'Prevenzione' },
  { key: 'measurements',  label: 'Ultime misurazioni',       group: 'Dati' },
  { key: 'blood',         label: 'Analisi del sangue',       group: 'Dati' },
  { key: 'documents',     label: 'Documenti ed esami',       group: 'Dati' },
  { key: 'ai',            label: 'Analisi AI',               group: 'Extra' },
]

const DEFAULT_SECTIONS = ['profile', 'allergies', 'meds_active', 'conditions', 'vaccinations', 'doctors', 'measurements', 'screening']

export default function Sintesi() {
  const savedAnalyses = (() => { try { return JSON.parse(localStorage.getItem('mcd_ai_analyses') || '[]') } catch { return [] } })()
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(savedAnalyses[0]?.id ?? '__none__')
  const [showConfig, setShowConfig] = useState(false)
  const [selected, setSelected] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mcd_sintesi_sections') || JSON.stringify(DEFAULT_SECTIONS)) }
    catch { return DEFAULT_SECTIONS }
  })

  const selectedAnalysis = selectedAnalysisId === '__none__' ? null : savedAnalyses.find(a => a.id === selectedAnalysisId) ?? null

  const has = (key) => selected.includes(key)

  const toggle = (key) => {
    const next = has(key) ? selected.filter(k => k !== key) : [...selected, key]
    setSelected(next)
    lsSave('mcd_sintesi_sections', next)
  }

  const profile      = store.getProfile?.() ?? {}
  const allergies    = store.allergies.all()
  const medications  = store.medications.all()
  const conditions   = store.conditions.all()
  const vaccinations = store.vaccinations.all()
  const episodes     = store.episodes.all()
  const exams        = store.exams.all()
  const family       = store.family.all()
  const doctors      = store.doctors?.all?.() ?? lsGet('mcd_doctors')
  const measurements = lsGet('mcd_measurements')
  const bloodAnalyses= lsGet('mcd_blood_analyses')
  const screening    = lsGet('mcd_screening')
  const watchlist    = lsGet('mcd_watchlist')
  const injuries     = lsGet('mcd_injuries')

  const today = new Date().toISOString().slice(0, 10)

  const activeMeds  = medications.filter(m => !m.end_date || m.end_date >= today)
  const pastMeds    = medications.filter(m => m.end_date && m.end_date < today)
  const activeConds = conditions.filter(c => !c.status || c.status === 'active' || c.status === 'monitorato' || c.status === 'attivo' || c.status === 'cronico')
  const drugAllergies = allergies.filter(isDrugAllergy)

  const sortedEpisodes = [...episodes].sort((a, b) => (b.start_date || b.date || b.created_at || '').localeCompare(a.start_date || a.date || a.created_at || ''))
  const sortedScreening = [...screening].sort((a, b) => (a.next_date || '').localeCompare(b.next_date || ''))

  const measByType = {}
  measurements.forEach(m => {
    if (!measByType[m.type] || m.date > measByType[m.type].date) measByType[m.type] = m
  })

  const groups = [...new Set(ALL_SECTIONS.map(s => s.group))]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center shadow-sm">
            <ClipboardList size={20} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Sintesi clinica</h1>
            <p className="text-xs text-gray-400 mt-0.5">Documento personalizzato per il medico</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAnalyses.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Brain size={14} className="text-violet-500 flex-shrink-0" />
              <span className="text-xs text-gray-500 whitespace-nowrap">Analisi AI:</span>
              <select value={selectedAnalysisId} onChange={e => setSelectedAnalysisId(e.target.value)}
                className="text-xs text-gray-700 bg-transparent focus:outline-none cursor-pointer max-w-[180px]">
                <option value="__none__">— Non includere —</option>
                {savedAnalyses.map(a => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })} {a.isAI ? '(AI)' : '(locale)'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => setShowConfig(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border shadow-sm transition-colors ${showConfig ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            <SlidersHorizontal size={15} /> Sezioni
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm">
            <Printer size={16} /> Stampa / PDF
          </button>
        </div>
      </div>

      {/* Section picker */}
      {showConfig && (
        <div className="no-print bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Seleziona le sezioni da includere nel documento</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
            {groups.map(g => (
              <div key={g}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1.5 mt-2">{g}</div>
                {ALL_SECTIONS.filter(s => s.group === g).map(s => (
                  <label key={s.key} className="flex items-center gap-2 cursor-pointer py-0.5 group">
                    <input type="checkbox" checked={has(s.key)} onChange={() => toggle(s.key)}
                      className="w-3.5 h-3.5 accent-sky-600 cursor-pointer" />
                    <span className="text-xs text-gray-600 group-hover:text-gray-900">{s.label}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
            <button onClick={() => { const all = ALL_SECTIONS.map(s => s.key); setSelected(all); lsSave('mcd_sintesi_sections', all) }}
              className="text-xs text-sky-600 hover:underline cursor-pointer">Seleziona tutto</button>
            <button onClick={() => { setSelected(DEFAULT_SECTIONS); lsSave('mcd_sintesi_sections', DEFAULT_SECTIONS) }}
              className="text-xs text-gray-400 hover:underline cursor-pointer">Ripristina default</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 print:border-0 print:p-0 max-w-3xl space-y-1">

        {/* Print title */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-800">
          <h1 className="text-2xl font-bold">Sintesi Clinica</h1>
          {profile.name && <div className="text-lg text-gray-700 mt-1">{profile.name}</div>}
          <div className="text-sm text-gray-500 mt-1">Generata il {new Date().toLocaleString('it-IT')}</div>
        </div>

        {/* DRUG ALLERGY WARNING — sempre visibile se presente */}
        {drugAllergies.length > 0 && (
          <div className="mb-5 bg-red-50 border-2 border-red-500 rounded-xl p-4">
            <div className="font-bold text-red-700 uppercase tracking-wide text-sm mb-2">⚠️ Allergie Farmacologiche</div>
            {drugAllergies.map(a => (
              <div key={a.id} className="text-red-800 font-semibold text-sm">• {a.name} {a.severity && `(${a.severity})`} {a.notes && `— ${a.notes}`}</div>
            ))}
          </div>
        )}

        {has('profile') && (
          <Section title="Dati paziente" color="text-sky-700" empty={!profile.name && !profile.birth_date}>
            <Row label="Nome" value={profile.name} />
            <Row label="Data di nascita" value={profile.birth_date} />
            <Row label="Codice fiscale" value={profile.cf} />
            <Row label="Altezza" value={profile.height ? `${profile.height} cm` : null} />
            <Row label="Peso" value={profile.weight ? `${profile.weight} kg` : null} />
            <Row label="Gruppo sanguigno" value={profile.blood_type} />
            <Row label="Medico di base" value={profile.gp_name} />
            <Row label="Telefono" value={profile.phone} />
            <Row label="Email" value={profile.email} />
          </Section>
        )}

        {has('allergies') && (
          <Section title="Allergie e intolleranze" color="text-orange-600" empty={allergies.length === 0}>
            {allergies.map(a => (
              <div key={a.id} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{a.name}</span>
                {a.type && <span className="text-gray-500 ml-2 text-xs">({a.type})</span>}
                {a.severity && <span className={`ml-2 text-xs font-semibold ${a.severity === 'grave' ? 'text-red-600' : 'text-orange-600'}`}>{a.severity}</span>}
                {isDrugAllergy(a) && <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">⚠️ FARMACO</span>}
                {a.notes && <span className="text-gray-400 ml-2 text-xs">— {a.notes}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('meds_active') && (
          <Section title="Farmaci attivi" color="text-violet-700" empty={activeMeds.length === 0}>
            {activeMeds.map(m => (
              <div key={m.id} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{m.name}</span>
                {m.dosage && <span className="text-gray-600 ml-2">{m.dosage}</span>}
                {m.frequency && <span className="text-gray-500 ml-2 text-xs">({m.frequency})</span>}
                {m.reason && <span className="text-gray-400 ml-2 text-xs">per {m.reason}</span>}
                {m.start_date && <span className="text-gray-400 ml-2 text-xs">dal {m.start_date}</span>}
                {m.end_date && <span className="text-gray-400 ml-1 text-xs">al {m.end_date}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('meds_past') && (
          <Section title="Farmaci — storico" color="text-gray-500" empty={pastMeds.length === 0}>
            {pastMeds.map(m => (
              <div key={m.id} className="text-sm text-gray-500 py-0.5">
                {m.name}{m.dosage && ` ${m.dosage}`}{m.start_date && ` — dal ${m.start_date}`}{m.end_date && ` al ${m.end_date}`}
              </div>
            ))}
          </Section>
        )}

        {has('conditions') && (
          <Section title="Patologie e condizioni" color="text-red-700" empty={conditions.length === 0}>
            {conditions.map(c => (
              <div key={c.id} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{c.name}</span>
                {c.chronic && <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Cronica</span>}
                {c.type && <span className="text-gray-500 ml-2 text-xs">({c.type})</span>}
                {c.diagnosed_date && <span className="text-gray-400 ml-2 text-xs">dal {c.diagnosed_date}</span>}
                {c.notes && <span className="text-gray-400 ml-2 text-xs">— {c.notes}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('vaccinations') && (
          <Section title="Vaccinazioni" color="text-emerald-700" empty={vaccinations.length === 0}>
            {vaccinations.map(v => (
              <div key={v.id} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{v.name}</span>
                {v.date && <span className="text-gray-500 ml-2 text-xs">{v.date}</span>}
                {v.next_dose && <span className="text-gray-400 ml-2 text-xs">prossima dose: {v.next_dose}</span>}
                {v.notes && <span className="text-gray-400 ml-2 text-xs">— {v.notes}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('doctors') && (
          <Section title="Medici di riferimento" color="text-cyan-700" empty={doctors.length === 0}>
            {doctors.map((d, i) => (
              <div key={d.id || i} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{d.name}</span>
                {d.specialty && <span className="text-gray-500 ml-2 text-xs">({d.specialty})</span>}
                {d.phone && <span className="text-gray-400 ml-2 text-xs">☎ {d.phone}</span>}
                {d.email && <span className="text-gray-400 ml-2 text-xs">✉ {d.email}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('family') && (
          <Section title="Anamnesi familiare" color="text-teal-700" empty={family.length === 0}>
            {family.map(f => (
              <div key={f.id} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{f.member}</span>
                {f.condition && <span className="text-gray-700 ml-2">— {f.condition}</span>}
                {f.age_of_onset && <span className="text-gray-400 ml-2 text-xs">età insorgenza: {f.age_of_onset}</span>}
                {f.notes && <span className="text-gray-400 ml-2 text-xs">({f.notes})</span>}
              </div>
            ))}
          </Section>
        )}

        {has('episodes') && (
          <Section title="Episodi clinici (timeline)" color="text-blue-700" empty={sortedEpisodes.length === 0}>
            {sortedEpisodes.map(e => (
              <div key={e.id} className="text-sm py-0.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 text-xs mr-2">{e.start_date || e.date || ''}</span>
                <span className="font-medium text-gray-800">{e.diagnosis || e.type || 'Episodio'}</span>
                {e.body_area && <span className="text-gray-500 ml-2 text-xs">({e.body_area})</span>}
                {e.stop_days > 0 && <span className="text-gray-400 ml-2 text-xs">{e.stop_days}gg stop</span>}
                {e.outcome && <span className="text-gray-400 ml-2 text-xs">→ {e.outcome}</span>}
                {e.notes && <div className="text-gray-400 text-xs ml-4 mt-0.5">{e.notes}</div>}
              </div>
            ))}
          </Section>
        )}

        {has('injuries') && (
          <Section title="Infortuni" color="text-red-600" empty={injuries.length === 0}>
            {injuries.map((inj, i) => (
              <div key={inj.id || i} className="text-sm py-0.5">
                <span className="text-gray-400 text-xs mr-2">{inj.date || ''}</span>
                <span className="font-medium text-gray-800">{inj.title || inj.type || 'Infortunio'}</span>
                {inj.body_area && <span className="text-gray-500 ml-2 text-xs">({inj.body_area})</span>}
                {inj.notes && <span className="text-gray-400 ml-2 text-xs">— {inj.notes}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('watchlist') && (
          <Section title="Diario / Appunti" color="text-yellow-700" empty={watchlist.length === 0}>
            {watchlist.map((w, i) => (
              <div key={w.id || i} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{w.title || w.name}</span>
                {w.body_area && <span className="text-gray-500 ml-2 text-xs">({w.body_area})</span>}
                {w.status && <span className="text-gray-400 ml-2 text-xs">{w.status}</span>}
                {w.context && <span className="text-gray-400 ml-2 text-xs">— {w.context}</span>}
              </div>
            ))}
          </Section>
        )}

        {has('screening') && (
          <Section title="Screening e visite periodiche" color="text-lime-700" empty={sortedScreening.length === 0}>
            {sortedScreening.map((s, i) => {
              const days = s.next_date ? Math.round((new Date(s.next_date) - new Date()) / 86400000) : null
              return (
                <div key={s.id || i} className="text-sm py-0.5">
                  <span className="font-medium text-gray-800">{s.name}</span>
                  {s.last_date && <span className="text-gray-400 ml-2 text-xs">ultima: {s.last_date}</span>}
                  {s.next_date && <span className={`ml-2 text-xs font-semibold ${days !== null && days < 0 ? 'text-red-600' : days !== null && days < 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                    prossima: {s.next_date}{days !== null && ` (${days < 0 ? `scaduta da ${-days}gg` : `tra ${days}gg`})`}
                  </span>}
                </div>
              )
            })}
          </Section>
        )}

        {has('measurements') && (
          <Section title="Ultime misurazioni" color="text-rose-700" empty={Object.keys(measByType).length === 0}>
            {Object.values(measByType).map((m, i) => (
              <div key={m.id || i} className="text-sm py-0.5">
                <span className="font-medium text-gray-800">{m.type}</span>
                <span className="text-gray-700 ml-2">{m.value}{m.value2 ? `/${m.value2}` : ''}</span>
                {m.unit && <span className="text-gray-400 ml-1 text-xs">{m.unit}</span>}
                {m.date && <span className="text-gray-400 ml-2 text-xs">({m.date})</span>}
              </div>
            ))}
          </Section>
        )}

        {has('blood') && (
          <Section title="Analisi del sangue" color="text-red-700" empty={bloodAnalyses.length === 0}>
            {bloodAnalyses.map((a, i) => (
              <div key={a.id || i} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="font-semibold text-gray-700 text-sm mb-1">
                  {a.date && new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  {a.lab && <span className="text-gray-400 font-normal ml-2 text-xs">— {a.lab}</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
                  {Object.entries(a.values || {}).filter(([, v]) => v !== '' && v != null).map(([key, val]) => (
                    <div key={key} className="text-xs text-gray-600">
                      <span className="text-gray-400">{key}:</span> <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>
        )}

        {has('documents') && (
          <Section title="Documenti ed esami" color="text-emerald-700" empty={exams.length === 0}>
            {exams.map(e => (
              <div key={e.id} className="text-sm py-0.5">
                <span className="text-gray-400 text-xs mr-2">{e.date || ''}</span>
                <span className="font-medium text-gray-800">{e.type || 'Documento'}</span>
                {e.category && <span className="text-gray-500 ml-2 text-xs">({e.category})</span>}
                {e.reason && <span className="text-gray-400 ml-2 text-xs">— {e.reason}</span>}
                {e.result_summary && <div className="text-gray-500 text-xs ml-4 mt-0.5">{e.result_summary}</div>}
              </div>
            ))}
          </Section>
        )}

        {has('ai') && selectedAnalysis && (
          <Section title={`Analisi AI — ${new Date(selectedAnalysis.date).toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' })}${selectedAnalysis.isAI ? ' (Gemini AI)' : ' (locale)'}`} color="text-violet-700" empty={false}>
            {selectedAnalysis.insights.map((ins, i) => {
              const urgencyColor = ins.urgency === 'alta' ? 'text-red-700' : ins.urgency === 'media' ? 'text-amber-700' : 'text-blue-700'
              const urgencyBg    = ins.urgency === 'alta' ? 'bg-red-50 border-red-200' : ins.urgency === 'media' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              return (
                <div key={i} className={`rounded-lg border p-3 mb-2 ${urgencyBg}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${urgencyColor}`}>Priorità {ins.urgency}</div>
                  <div className="font-semibold text-gray-800 text-sm mb-1">{ins.title}</div>
                  <div className="text-xs text-gray-600 leading-relaxed mb-2">{ins.body}</div>
                  {ins.source && <div className="text-[10px] text-gray-400 mb-2 italic">Fonte: {ins.source}</div>}
                  {ins.connections?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ins.connections.map((c, j) => <span key={j} className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{c}</span>)}
                    </div>
                  )}
                  {ins.actions?.length > 0 && (
                    <ul className="space-y-0.5">
                      {ins.actions.map((a, j) => <li key={j} className="text-xs text-gray-600 flex gap-1.5"><span className="text-gray-400">→</span>{a}</li>)}
                    </ul>
                  )}
                </div>
              )
            })}
          </Section>
        )}

        <div className="text-xs text-gray-400 text-right mt-6 pt-4 border-t border-gray-100 print:mt-4">
          Generato il {new Date().toLocaleString('it-IT')} — Cartella Clinica
        </div>
      </div>
    </div>
  )
}
