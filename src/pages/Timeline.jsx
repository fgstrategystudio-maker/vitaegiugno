import React, { useState, useCallback, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, LayoutList, GitBranch, Edit2, Paperclip, X, List } from 'lucide-react'
import Modal from '../components/Modal'
import FileUpload from '../components/FileUpload'
import * as store from '../store'

const TYPES = ['malattia', 'infortunio', 'intervento', 'ricaduta', 'evento_positivo']
const OUTCOMES = ['in_corso', 'risolto', 'migliorato', 'ricorrente']
const OUTCOME_LABEL = { in_corso: 'In corso', risolto: 'Risolto', migliorato: 'Migliorato', ricorrente: 'Ricorrente' }
const OUTCOME_COLOR = {
  in_corso: 'bg-amber-100 text-amber-700',
  risolto: 'bg-emerald-100 text-emerald-700',
  migliorato: 'bg-sky-100 text-sky-700',
  ricorrente: 'bg-orange-100 text-orange-700',
}
const TYPE_COLOR = {
  malattia: 'bg-blue-100 text-blue-700',
  infortunio: 'bg-red-100 text-red-700',
  intervento: 'bg-purple-100 text-purple-700',
  ricaduta: 'bg-orange-100 text-orange-700',
  evento_positivo: 'bg-emerald-100 text-emerald-700',
}
const TYPE_DOT = {
  malattia: 'bg-blue-500', infortunio: 'bg-red-500', intervento: 'bg-purple-500',
  ricaduta: 'bg-orange-500', evento_positivo: 'bg-emerald-500',
  screening: 'bg-green-500', watchlist: 'bg-yellow-600',
}

const defaultPolarity = (type) => type === 'evento_positivo'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const EMPTY = {
  start_date: '', end_date: '', type: 'malattia', body_area: '', diagnosis: '', symptoms: '',
  intensity: 5, probable_cause: '', doctor: '', facility: '', therapy: '', stop_days: '',
  outcome: 'in_corso', notes: '', is_positive: false,
  injury: { sport: '', movement: '', body_side: '', pain_type: 'progressivo', swelling: false, hematoma: false, continued_activity: false, physiotherapy_sessions: '', recurrences: 0, residual_limitations: '' }
}

function Field({ label, children, col2 }) {
  return (
    <div className={col2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Episode Documents ────────────────────────────────────────────────────────

function docIcon(doc) {
  const name = (doc.name || '').toLowerCase()
  if (/ricett/.test(name)) return '💊'
  if (/esame|analisi|laborator/.test(name)) return '🔬'
  if (/referto|visita|consult/.test(name)) return '📋'
  return '📄'
}

function EpisodeDocuments({ episodeId, docs, onChange }) {
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (fileData) => {
    if (fileData.file.size > 5 * 1024 * 1024) {
      alert('File troppo grande (max 5MB). Scegli un file più piccolo.')
      return
    }
    setUploading(true)
    store.attachDocToEpisode(episodeId, {
      name: fileData.filename,
      url: fileData.dataUrl,
      type: fileData.mediaType,
    })
    onChange()
    setShowUpload(false)
    setUploading(false)
  }

  const removeDoc = (idx) => {
    store.detachDocFromEpisode(episodeId, idx)
    onChange()
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Paperclip size={13} className="text-violet-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documenti allegati</span>
      </div>

      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1 group">
              <span className="text-sm">{docIcon(doc)}</span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-700 font-medium hover:underline max-w-[140px] truncate"
              >
                {doc.name}
              </a>
              <button
                onClick={() => removeDoc(i)}
                className="text-violet-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUpload ? (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <FileUpload onFileSelect={handleFileSelect} />
          {uploading && <p className="text-xs text-gray-500 mt-1">Caricamento…</p>}
          <button onClick={() => setShowUpload(false)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Annulla</button>
        </div>
      ) : (
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 border border-dashed border-violet-300 rounded-lg px-2.5 py-1.5 hover:border-violet-500 transition-colors"
        >
          <Plus size={12} /> Allega documento
        </button>
      )}
    </div>
  )
}

// ─── Visual year-by-year chart ────────────────────────────────────────────────
function TimelineChart({ episodes, onEditEpisode }) {
  if (episodes.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-200">
        Nessun episodio. Aggiungine uno per vedere il grafico.
      </div>
    )
  }

  const byYear = episodes.reduce((acc, ep) => {
    const y = ep.start_date?.slice(0, 4)
    if (!y) return acc
    if (!acc[y]) acc[y] = []
    acc[y].push(ep)
    return acc
  }, {})

  const minYear = Math.min(...Object.keys(byYear).map(Number))
  const maxYear = Math.max(...Object.keys(byYear).map(Number))
  const years = []
  for (let y = maxYear; y >= minYear; y--) years.push(String(y))

  const pillStyle = (ep) => {
    if (ep.is_positive || ep.type === 'evento_positivo')
      return { pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-200' }
    if (ep.type === 'ricaduta')
      return { pill: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-200' }
    return { pill: 'bg-red-50 text-red-800 border-red-200', dot: 'bg-red-500', bar: 'bg-red-200' }
  }

  const durationDays = (ep) => {
    if (!ep.start_date || !ep.end_date) return null
    const ms = new Date(ep.end_date) - new Date(ep.start_date)
    return Math.round(ms / 86400000)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden">
      <div className="relative">
        <div className="absolute left-14 top-3 bottom-3 w-0.5 bg-gradient-to-b from-violet-300 via-slate-200 to-violet-300" />

        {years.map((year) => {
          const evs = byYear[year] || []
          const hasEvents = evs.length > 0
          const shown = evs.sort((a, b) => (b.intensity || 0) - (a.intensity || 0)).slice(0, 4)
          const extra = evs.length - 4

          return (
            <div key={year} className="flex gap-4 mb-5 relative items-start">
              <div className={`w-12 text-right text-sm font-bold pt-1 flex-shrink-0 ${hasEvents ? 'text-slate-700' : 'text-slate-300'}`}>
                {year}
              </div>
              <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 z-10 ring-2 ring-white ${hasEvents ? 'bg-violet-500' : 'bg-slate-200'}`} />
              {hasEvents ? (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {shown.map((ep) => {
                    const s = pillStyle(ep)
                    const days = durationDays(ep)
                    return (
                      <button
                        key={ep.id}
                        title={[ep.diagnosis, ep.body_area, ep.symptoms].filter(Boolean).join(' • ') + (days ? ` — ${days} giorni` : '') + ' — clicca per modificare'}
                        onClick={() => onEditEpisode(ep)}
                        className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-xs font-medium border select-none transition-transform hover:scale-105 hover:shadow-sm ${s.pill}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                          {ep.diagnosis || ep.type}
                          {ep.body_area && <span className="opacity-60">· {ep.body_area}</span>}
                          <Edit2 size={10} className="opacity-40 ml-0.5" />
                        </div>
                        {days !== null && (
                          <div className="w-full mt-1.5 flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded-full bg-black/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${s.bar}`}
                                style={{ width: `${Math.min(100, (days / 180) * 100)}%`, minWidth: '8%' }}
                              />
                            </div>
                            <span className="opacity-60 text-[10px] whitespace-nowrap">{days}gg</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {extra > 0 && (
                    <div className="px-3 py-1 rounded-full text-xs text-slate-400 border border-dashed border-slate-200">+{extra} altri</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-300 pt-1.5">—</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Malattia / infortunio / intervento</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Ricaduta</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Positivo / guarigione / traguardo</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-10 h-1 rounded-full bg-red-200 inline-block" />Durata recupero (giorni)</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Edit2 size={10} className="text-gray-400" />Clicca per modificare</div>
      </div>
    </div>
  )
}

// ─── Feed view ────────────────────────────────────────────────────────────────
function FeedView({ episodes, onEditEpisode, onRefresh }) {
  const [filter, setFilter] = useState('tutti')
  const [expandedId, setExpandedId] = useState(null)
  const [episodeMap, setEpisodeMap] = useState(() => {
    return Object.fromEntries(store.episodes.all().map(e => [e.id, e]))
  })

  const screening = (() => { try { return JSON.parse(localStorage.getItem('mcd_screening')) ?? [] } catch { return [] } })()
  const watchlist = (() => { try { return JSON.parse(localStorage.getItem('mcd_watchlist')) ?? [] } catch { return [] } })()

  const allEvents = [
    ...episodes.map(ep => ({ ...ep, _source: 'episode', _date: ep.start_date, _title: ep.diagnosis || ep.type, _type: ep.type })),
    ...screening.map(sc => ({ ...sc, _source: 'screening', _date: sc.last_date || sc.next_date, _title: sc.name, _type: 'screening' })),
    ...watchlist.map(w => ({ ...w, _source: 'watchlist', _date: w.date_noticed, _title: w.title, _type: 'watchlist' })),
  ].filter(e => e._date).sort((a, b) => (b._date || '').localeCompare(a._date || ''))

  const FILTERS = [
    { id: 'tutti', label: 'Tutti' },
    { id: 'infortunio', label: 'Infortuni' },
    { id: 'intervento', label: 'Interventi' },
    { id: 'screening', label: 'Screening' },
    { id: 'watchlist', label: 'Watchlist' },
  ]

  const filtered = filter === 'tutti' ? allEvents : allEvents.filter(e => e._type === filter)

  const refreshEpMap = () => {
    setEpisodeMap(Object.fromEntries(store.episodes.all().map(e => [e.id, e])))
    onRefresh()
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.id ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
          Nessun evento trovato.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-200 via-slate-100 to-violet-200" />
          <div className="space-y-3 pl-12">
            {filtered.map((ev, i) => {
              const isEp = ev._source === 'episode'
              const isOpen = expandedId === (ev.id || i)
              const dot = TYPE_DOT[ev._type] || 'bg-gray-400'
              const currentEp = isEp ? (episodeMap[ev.id] || ev) : ev

              return (
                <div key={ev.id || i} className="relative">
                  <div className={`absolute -left-8 top-3 w-3 h-3 rounded-full border-2 border-white ${dot}`} />
                  <div
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => setExpandedId(isOpen ? null : (ev.id || i))}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {ev._type && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[ev._type] || 'bg-gray-100 text-gray-600'}`}>
                              {ev._type}
                            </span>
                          )}
                          {ev.body_area && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ev.body_area}</span>
                          )}
                          <span className="text-xs text-gray-400">{ev._date}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">{ev._title}</div>
                        {ev.outcome && (
                          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${OUTCOME_COLOR[ev.outcome] || 'bg-gray-100 text-gray-600'}`}>
                            {OUTCOME_LABEL[ev.outcome] || ev.outcome}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isEp && (currentEp.documents || []).length > 0 && (
                          <span className="text-xs text-violet-500"><Paperclip size={11} className="inline" /> {(currentEp.documents || []).length}</span>
                        )}
                        {isEp && (
                          <button
                            onClick={e => { e.stopPropagation(); onEditEpisode(ev) }}
                            className="text-gray-300 hover:text-violet-500 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {isOpen ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                      </div>
                    </div>

                    {isOpen && isEp && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          {[['Sintomi', currentEp.symptoms], ['Terapia', currentEp.therapy], ['Causa probabile', currentEp.probable_cause], ['Medico', currentEp.doctor], ['Struttura', currentEp.facility], ['Giorni di stop', currentEp.stop_days], ['Note', currentEp.notes]].map(([label, val]) => val ? (
                            <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700 text-sm">{val}</div></div>
                          ) : null)}
                        </div>
                        <EpisodeDocuments
                          episodeId={ev.id}
                          docs={(currentEp.documents || [])}
                          onChange={refreshEpMap}
                        />
                      </div>
                    )}

                    {isOpen && ev._source === 'screening' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                        {ev.category && <div><span className="text-xs text-gray-400">Categoria: </span>{ev.category}</div>}
                        {ev.next_date && <div><span className="text-xs text-gray-400">Prossima data: </span>{ev.next_date}</div>}
                        {ev.notes && <div className="text-gray-600 text-xs mt-1">{ev.notes}</div>}
                      </div>
                    )}

                    {isOpen && ev._source === 'watchlist' && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                        {ev.context && <div><span className="text-xs text-gray-400">Contesto: </span>{ev.context}</div>}
                        {ev.status && <div><span className="text-xs text-gray-400">Stato: </span>{ev.status}</div>}
                        {ev.notes && <div className="text-gray-600 text-xs mt-1">{ev.notes}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Timeline() {
  const [episodes, setEpisodes] = useState(store.episodes.all)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [view, setView] = useState('chart') // 'chart' | 'list' | 'feed'
  const [filterYear, setFilterYear] = useState('tutti')
  const [filterType, setFilterType] = useState('tutti')
  const [filterOutcome, setFilterOutcome] = useState('tutti')
  const [filterArea, setFilterArea] = useState('')

  const refresh = useCallback(() => setEpisodes(store.episodes.all()), [])

  const years = [...new Set(episodes.map(e => e.start_date?.slice(0, 4)).filter(Boolean))].sort().reverse()

  const filtered = episodes.filter(e => {
    if (filterYear !== 'tutti' && !e.start_date?.startsWith(filterYear)) return false
    if (filterType !== 'tutti' && e.type !== filterType) return false
    if (filterOutcome !== 'tutti' && e.outcome !== filterOutcome) return false
    if (filterArea && !e.body_area?.toLowerCase().includes(filterArea.toLowerCase())) return false
    return true
  }).sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''))

  const set = (field, val) => setForm(f => {
    const next = { ...f, [field]: val }
    if (field === 'type') next.is_positive = defaultPolarity(val)
    return next
  })
  const setInj = (field, val) => setForm(f => ({ ...f, injury: { ...f.injury, [field]: val } }))

  const openEdit = (ep) => {
    setEditingId(ep.id)
    setForm({ ...EMPTY, ...ep, injury: ep.injury || EMPTY.injury })
    setShowModal(true)
  }

  const save = () => {
    if (!form.start_date || !form.type) return
    const { injury, ...rest } = form
    if (editingId) {
      store.updateEpisode(editingId, rest)
      if (form.type === 'infortunio') store.updateEpisode(editingId, { injury })
    } else {
      const ep = store.addEpisode(rest)
      if (form.type === 'infortunio') store.updateEpisode(ep.id, { injury })
    }
    setEpisodes(store.episodes.all())
    setShowModal(false)
    setForm(EMPTY)
    setEditingId(null)
  }

  const del = (id) => {
    store.deleteEpisode(id)
    setEpisodes(store.episodes.all())
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-xl shadow-sm">📅</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Timeline episodi</h1>
              <p className="text-xs text-gray-400 mt-0.5">Tutti gli eventi della tua storia clinica</p>
            </div>
          </div>
          <button
            onClick={() => { setShowModal(true); setEditingId(null); setForm(EMPTY) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-2xl hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Plus size={14} />Nuovo episodio
          </button>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1 w-fit">
          <button
            onClick={() => setView('chart')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'chart' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <GitBranch size={13} />Grafico
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'list' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutList size={13} />Lista
          </button>
          <button
            onClick={() => setView('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === 'feed' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List size={13} />Feed
          </button>
        </div>
      </div>

      {view === 'chart' && (
        <TimelineChart episodes={episodes} onEditEpisode={openEdit} />
      )}

      {view === 'feed' && (
        <FeedView episodes={episodes} onEditEpisode={openEdit} onRefresh={refresh} />
      )}

      {view === 'list' && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="tutti">Tutti gli anni</option>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="tutti">Tutti i tipi</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
              <option value="tutti">Tutti gli esiti</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" placeholder="Filtra per zona..." value={filterArea} onChange={e => setFilterArea(e.target.value)} />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-16 bg-white rounded-2xl border border-gray-200">
              Nessun episodio trovato.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 border-b bg-slate-50">
                  <th className="text-left px-4 py-3">Inizio</th>
                  <th className="text-left px-4 py-3">Fine</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Zona</th>
                  <th className="text-left px-4 py-3">Diagnosi</th>
                  <th className="text-left px-4 py-3">Int.</th>
                  <th className="text-left px-4 py-3">Esito</th>
                  <th />
                </tr></thead>
                <tbody>
                  {filtered.map(e => {
                    const currentEp = store.getEpisode(e.id) || e
                    return (
                      <React.Fragment key={e.id}>
                        <tr
                          className={`border-b border-gray-50 hover:bg-slate-50 cursor-pointer ${e.is_positive || e.type === 'evento_positivo' ? 'border-l-2 border-l-emerald-400' : ''}`}
                          onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                        >
                          <td className="px-4 py-3 text-gray-600">{e.start_date}</td>
                          <td className="px-4 py-3 text-gray-500">{e.end_date || '—'}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR[e.type]}`}>{e.type}</span></td>
                          <td className="px-4 py-3 text-gray-700">{e.body_area}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{e.diagnosis}</td>
                          <td className="px-4 py-3">
                            {e.intensity && (
                              <div className="flex items-center gap-1">
                                <div className="w-14 bg-gray-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${e.is_positive || e.type === 'evento_positivo' ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${e.intensity * 10}%` }} />
                                </div>
                                <span className="text-xs text-gray-400">{e.intensity}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_COLOR[e.outcome]}`}>{OUTCOME_LABEL[e.outcome]}</span></td>
                          <td className="px-4 py-3 flex items-center gap-2">
                            {(currentEp.documents || []).length > 0 && (
                              <span className="text-xs text-violet-400"><Paperclip size={11} className="inline" /> {(currentEp.documents || []).length}</span>
                            )}
                            {expanded === e.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            <button onClick={(ev) => { ev.stopPropagation(); openEdit(e) }} className="text-gray-300 hover:text-violet-500"><Edit2 size={14} /></button>
                            <button onClick={(ev) => { ev.stopPropagation(); del(e.id) }} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                        {expanded === e.id && (
                          <tr className="bg-violet-50/40">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                {[['Sintomi', currentEp.symptoms], ['Terapia', currentEp.therapy], ['Causa probabile', currentEp.probable_cause], ['Medico', currentEp.doctor], ['Struttura', currentEp.facility], ['Giorni di stop', currentEp.stop_days], ['Note', currentEp.notes]].map(([label, val]) => val ? (
                                  <div key={label}><div className="text-xs text-gray-400">{label}</div><div className="text-gray-700">{val}</div></div>
                                ) : null)}
                              </div>
                              <EpisodeDocuments
                                episodeId={e.id}
                                docs={(currentEp.documents || [])}
                                onChange={() => setEpisodes(store.episodes.all())}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(EMPTY); setEditingId(null) }} title={editingId ? 'Modifica episodio' : 'Nuovo episodio'}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data inizio *"><input type="date" className={input} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></Field>
          <Field label="Data fine"><input type="date" className={input} value={form.end_date} onChange={e => set('end_date', e.target.value)} /></Field>
          <Field label="Tipo *">
            <select className={input} value={form.type} onChange={e => set('type', e.target.value)}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Zona del corpo"><input className={input} placeholder="ginocchio dx, schiena..." value={form.body_area} onChange={e => set('body_area', e.target.value)} /></Field>
          <Field label="Diagnosi / descrizione" col2><input className={input} value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} /></Field>
          <Field label="Sintomi" col2><input className={input} value={form.symptoms} onChange={e => set('symptoms', e.target.value)} /></Field>
          <Field label={`Intensità: ${form.intensity}/10`} col2>
            <input type="range" min={1} max={10} className="w-full accent-violet-500" value={form.intensity} onChange={e => set('intensity', Number(e.target.value))} />
          </Field>
          <Field label="Causa probabile"><input className={input} value={form.probable_cause} onChange={e => set('probable_cause', e.target.value)} /></Field>
          <Field label="Medico"><input className={input} value={form.doctor} onChange={e => set('doctor', e.target.value)} /></Field>
          <Field label="Struttura"><input className={input} value={form.facility} onChange={e => set('facility', e.target.value)} /></Field>
          <Field label="Terapia" col2><input className={input} value={form.therapy} onChange={e => set('therapy', e.target.value)} /></Field>
          <Field label="Giorni di stop"><input type="number" className={input} value={form.stop_days} onChange={e => set('stop_days', e.target.value)} /></Field>
          <Field label="Esito">
            <select className={input} value={form.outcome} onChange={e => set('outcome', e.target.value)}>
              {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_LABEL[o]}</option>)}
            </select>
          </Field>
          <Field label="Note" col2><textarea className={`${input} h-20`} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>

          <div className="col-span-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => set('is_positive', !form.is_positive)}
                className={`w-10 h-6 rounded-full transition-colors relative ${form.is_positive ? 'bg-emerald-500' : 'bg-red-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_positive ? 'left-5' : 'left-1'}`} />
              </div>
              <span className={`text-sm font-medium ${form.is_positive ? 'text-emerald-700' : 'text-red-600'}`}>
                {form.is_positive ? '🟢 Evento positivo (verde nel grafico)' : '🔴 Evento negativo (rosso nel grafico)'}
              </span>
            </label>
          </div>

          {form.type === 'infortunio' && (
            <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Dettaglio infortunio</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Sport/attività"><input className={input} value={form.injury.sport} onChange={e => setInj('sport', e.target.value)} /></Field>
                <Field label="Movimento che ha causato"><input className={input} value={form.injury.movement} onChange={e => setInj('movement', e.target.value)} /></Field>
                <Field label="Lato">
                  <select className={input} value={form.injury.body_side} onChange={e => setInj('body_side', e.target.value)}>
                    <option value="">—</option><option>sinistro</option><option>destro</option><option>bilaterale</option>
                  </select>
                </Field>
                <Field label="Tipo dolore">
                  <select className={input} value={form.injury.pain_type} onChange={e => setInj('pain_type', e.target.value)}>
                    <option>progressivo</option><option>immediato</option>
                  </select>
                </Field>
                <Field label="Sedute fisioterapia"><input type="number" className={input} value={form.injury.physiotherapy_sessions} onChange={e => setInj('physiotherapy_sessions', e.target.value)} /></Field>
                <Field label="Recidive"><input type="number" className={input} value={form.injury.recurrences} onChange={e => setInj('recurrences', Number(e.target.value))} /></Field>
                <Field label="Limitazioni residue" col2><input className={input} value={form.injury.residual_limitations} onChange={e => setInj('residual_limitations', e.target.value)} /></Field>
                <div className="col-span-2 flex gap-4">
                  {[['swelling', 'Gonfiore'], ['hematoma', 'Ematoma'], ['continued_activity', "Ha continuato l'attività"]].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={form.injury[key]} onChange={e => setInj(key, e.target.checked)} className="rounded accent-violet-500" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={save} className={`${btn} bg-violet-600 text-white hover:bg-violet-700`}>{editingId ? 'Aggiorna episodio' : 'Salva episodio'}</button>
          <button onClick={() => { setShowModal(false); setForm(EMPTY); setEditingId(null) }} className={`${btn} bg-gray-100 text-gray-700`}>Annulla</button>
        </div>
      </Modal>
    </div>
  )
}
