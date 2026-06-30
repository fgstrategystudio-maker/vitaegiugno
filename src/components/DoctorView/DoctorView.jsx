import { useState } from 'react'
import { X, Printer, ChevronDown, ChevronUp } from 'lucide-react'
import BodyMap from '../BodyMap/BodyMap'
import * as store from '../../store'

const ZONES_LABEL = {
  testa: 'Testa / Cervello', occhi: 'Occhi', orecchio_sx: 'Orecchio sinistro',
  naso: 'Naso', collo_schiena: 'Collo / Schiena', torace: 'Torace / Costole sx',
  addome: 'Addome', inguine: 'Zona inguinale', pelle: 'Pelle / Nei',
  polso_sx: 'Polso / Scafoide sx', coscia_dx: 'Coscia destra', coscia_sx: 'Coscia sinistra',
  polpaccio_dx: 'Polpaccio', caviglia_dx: 'Caviglia destra',
}

const TYPE_COLOR = {
  infortunio: '#dc2626', ricaduta: '#7f1d1d', intervento: '#1d4ed8',
  malattia: '#7e22ce', screening: '#15803d', watchlist: '#b45309',
}

export default function DoctorView({ onClose, correlations = [] }) {
  const profile    = store.getProfile()
  const allergyList  = store.allergies.all()
  const medList      = store.medications.all()
  const condList     = store.conditions.all()
  const [expandedZone, setExpandedZone] = useState(null)
  const [zoneEvents, setZoneEvents]     = useState({})

  const activeMeds = medList.filter(m => m.active !== false)

  const age = profile.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date)) / (365.25 * 86400000))
    : null

  const handleCorrChange = (corrs) => { /* received from BodyMap */ }

  // Capture zoneEvents from BodyMap via a trick: we build them here from store
  // (BodyMap already computes them; for the right panel we re-compute from episodes)
  const episodes  = store.episodes.all()
  const screening = (() => { try { return JSON.parse(localStorage.getItem('mcd_screening')) ?? [] } catch { return [] } })()
  const watchlist = (() => { try { return JSON.parse(localStorage.getItem('mcd_watchlist')) ?? [] } catch { return [] } })()

  const ZONE_MATCH = [
    ['testa',         ['testa', 'cisti', 'cervello', 'cranio', 'psicologici', 'paura', 'altezze']],
    ['occhi',         ['occhio', 'occhi', 'oculis', 'miopia', 'astigmatismo', 'vista']],
    ['orecchio_sx',   ['orecchio', 'orecchie', 'acufene', 'ipoacusia', 'udito', 'sauna']],
    ['naso',          ['naso', 'setto', 'turbinati', 'rinite']],
    ['collo_schiena', ['collo', 'schiena', 'cervicale', 'lombare', 'postura']],
    ['torace',        ['costola', 'torace', 'petto', 'polmone', 'cuore', 'sterno']],
    ['addome',        ['ano', 'addome', 'intestino', 'stomaco', 'emorroide', 'ascesso', 'perianale']],
    ['inguine',       ['testicol', 'inguine', 'ecodoppler', 'sperma', 'urologica']],
    ['pelle',         ['neo', 'nevo', 'nevi', 'pelle', 'dermatol', 'cute', 'nei']],
    ['polso_sx',      ['scafoide', 'polso sx', 'mano sx', 'braccio sx']],
    ['coscia_dx',     ['quadricipite dx', 'coscia dx', 'femore dx']],
    ['coscia_sx',     ['quadricipite sx', 'coscia sx', 'femore sx']],
    ['polpaccio_dx',  ['polpaccio']],
    ['caviglia_dx',   ['caviglia dx']],
  ]

  const matchZone = (text) => {
    if (!text) return null
    const t = text.toLowerCase()
    for (const [zone, kws] of ZONE_MATCH)
      if (kws.some(k => t.includes(k))) return zone
    return null
  }

  const computedZoneEvents = (() => {
    const map = {}
    const add = (z, ev) => { map[z] = [...(map[z] || []), ev] }
    episodes.forEach(ep => {
      const zone = matchZone(ep.body_area) || matchZone(ep.diagnosis) || matchZone(ep.symptoms)
      if (!zone) return
      add(zone, { kind: ep.type, color: TYPE_COLOR[ep.type] || '#6b7280', label: ep.diagnosis || ep.body_area, sub: ep.body_area, date: ep.start_date, status: ep.outcome, notes: ep.notes })
    })
    screening.forEach(sc => {
      const zone = matchZone(sc.name) || matchZone(sc.category)
      if (!zone) return
      add(zone, { kind: 'screening', color: '#15803d', label: sc.name, sub: sc.category, date: sc.last_date, status: '', notes: sc.notes })
    })
    watchlist.forEach(w => {
      const zone = matchZone(w.title) || matchZone(w.body_area) || matchZone(w.context)
      if (!zone) return
      add(zone, { kind: 'watchlist', color: '#b45309', label: w.title, sub: w.body_area || '', date: w.date_noticed, status: '', notes: w.notes })
    })
    return map
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col print:static print:block"
      style={{ background: 'rgba(3,7,18,0.96)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-white/60 text-sm">Vista Medico</span>
          <span className="text-white font-semibold">{profile.name || 'Paziente'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            <Printer size={13} /> Stampa
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-red-500/60 transition-colors print:hidden"
          >
            <X size={13} /> Chiudi
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left 55% — BodyMap */}
        <div
          className="flex items-center justify-center bg-gray-950 overflow-hidden"
          style={{ width: '55%', borderRight: '1px solid rgba(255,255,255,0.08)' }}
        >
          <BodyMap doctorMode={true} onCorrelationsChange={() => {}} />
        </div>

        {/* Right 45% — scrollable panel */}
        <div className="overflow-y-auto flex-1 p-6 text-white" style={{ background: '#0c1120' }}>

          {/* Profilo rapido */}
          <section className="mb-6">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Profilo rapido</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {age !== null && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-white/40 text-xs mb-0.5">Età</div>
                  <div className="font-semibold">{age} anni</div>
                </div>
              )}
              {profile.blood_type && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-white/40 text-xs mb-0.5">Gruppo sanguigno</div>
                  <div className="font-semibold">{profile.blood_type}</div>
                </div>
              )}
              {profile.birth_date && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-white/40 text-xs mb-0.5">Data di nascita</div>
                  <div className="font-semibold">{profile.birth_date}</div>
                </div>
              )}
              {profile.gp_name && (
                <div className="bg-white/5 rounded-lg px-3 py-2">
                  <div className="text-white/40 text-xs mb-0.5">Medico di base</div>
                  <div className="font-semibold">{profile.gp_name}</div>
                </div>
              )}
            </div>

            {allergyList.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-white/40 mb-1.5">Allergie</div>
                <div className="flex flex-wrap gap-1.5">
                  {allergyList.map(a => (
                    <span key={a.id} className="px-2 py-0.5 bg-red-900/40 text-red-300 border border-red-700/40 rounded-full text-xs font-medium">
                      {a.name} ({a.severity})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeMeds.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-white/40 mb-1.5">Farmaci attivi</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeMeds.map(m => (
                    <span key={m.id} className="px-2 py-0.5 bg-violet-900/40 text-violet-300 border border-violet-700/40 rounded-full text-xs font-medium">
                      {m.name}{m.dosage ? ` ${m.dosage}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {condList.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-white/40 mb-1.5">Condizioni</div>
                <div className="flex flex-wrap gap-1.5">
                  {condList.map(c => (
                    <span key={c.id} className="px-2 py-0.5 bg-blue-900/40 text-blue-300 border border-blue-700/40 rounded-full text-xs font-medium">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Zone attive */}
          {Object.keys(computedZoneEvents).length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">
                Zone attive ({Object.keys(computedZoneEvents).length})
              </h2>
              <div className="space-y-2">
                {Object.entries(computedZoneEvents).map(([zoneId, evs]) => {
                  const dominant = evs[0]?.color || '#6b7280'
                  const isOpen = expandedZone === zoneId
                  return (
                    <div key={zoneId} className="rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                        onClick={() => setExpandedZone(isOpen ? null : zoneId)}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dominant }} />
                        <span className="text-sm font-medium text-white flex-1">{ZONES_LABEL[zoneId] || zoneId}</span>
                        <span className="text-xs text-white/40">{evs.length} eventi</span>
                        {isOpen ? <ChevronUp size={13} className="text-white/40" /> : <ChevronDown size={13} className="text-white/40" />}
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3 space-y-1.5">
                          {evs.map((ev, i) => (
                            <div key={i} className="pl-2 border-l-2 rounded-r" style={{ borderColor: ev.color, background: ev.color + '15' }}>
                              <div className="px-2 py-1.5">
                                <div className="text-xs font-semibold" style={{ color: ev.color }}>{ev.kind?.toUpperCase()}</div>
                                <div className="text-sm text-white/90">{ev.label}</div>
                                {ev.date && <div className="text-xs text-white/40">{ev.date}</div>}
                                {ev.notes && <div className="text-xs text-white/50 italic">{ev.notes}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Correlazioni rilevate */}
          {correlations.length > 0 && (
            <section className="mb-6">
              <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
                Correlazioni rilevate ({correlations.length})
              </h2>
              <div className="space-y-2">
                {correlations.map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: c.strength === 'alta' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${c.strength === 'alta' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: c.strength === 'alta' ? '#ef4444' : '#f59e0b', color: 'white' }}>
                      {c.strength.toUpperCase()}
                    </span>
                    <div>
                      <div className="text-sm text-white/90">{c.reason}</div>
                      <div className="text-xs text-white/40">{c.zones.map(z => ZONES_LABEL[z] || z).join(' ↔ ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .fixed { position: static !important; }
          .overflow-hidden { overflow: visible !important; }
          .overflow-y-auto { overflow: visible !important; }
          .flex { display: block !important; }
          [style*="width: 55%"] { width: 100% !important; }
          [style*="background: #0c1120"] { background: white !important; color: black !important; }
          [style*="background: rgba(3"] { background: white !important; }
          .text-white { color: black !important; }
          .text-white\\/60, .text-white\\/40, .text-white\\/50, .text-white\\/90 { color: #374151 !important; }
          .bg-white\\/5, .bg-white\\/10 { background: #f3f4f6 !important; }
        }
      `}</style>
    </div>
  )
}
