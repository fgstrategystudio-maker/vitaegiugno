import { useState, useMemo } from 'react'
import * as store from '../../store'

const lsLoad = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? [] } catch { return [] }
}

const TYPE_COLOR = {
  infortunio: '#dc2626',
  ricaduta:   '#7f1d1d',
  intervento: '#1d4ed8',
  malattia:   '#7e22ce',
  screening:  '#15803d',
  watchlist:  '#b45309',
}
const TYPE_LABEL = {
  infortunio: 'Infortunio', ricaduta: 'Ricaduta',
  intervento: 'Intervento', malattia: 'Malattia',
  screening:  'Screening',  watchlist: 'Da monitorare',
}
const OUTCOME_LABEL = {
  risolto: 'Risolto', in_corso: 'In corso',
  ricorrente: 'Ricorrente', migliorato: 'Migliorato',
}
const KIND_PRIORITY = ['ricaduta', 'infortunio', 'malattia', 'intervento', 'watchlist', 'screening']

const ZONES = {
  testa:         { label: 'Testa / Cervello',    fx: 0.500, fy: 0.225 },
  occhi:         { label: 'Occhi',               fx: 0.500, fy: 0.268 },
  orecchio_sx:   { label: 'Orecchio sinistro',   fx: 0.585, fy: 0.272 },
  naso:          { label: 'Naso',                fx: 0.500, fy: 0.300 },
  collo_schiena: { label: 'Collo / Schiena',     fx: 0.500, fy: 0.362 },
  torace:        { label: 'Torace / Costole sx', fx: 0.562, fy: 0.405 },
  addome:        { label: 'Addome',              fx: 0.500, fy: 0.472 },
  inguine:       { label: 'Zona inguinale',      fx: 0.500, fy: 0.548 },
  pelle:         { label: 'Pelle / Nei',         fx: 0.375, fy: 0.360 },
  polso_sx:      { label: 'Polso / Scafoide sx', fx: 0.710, fy: 0.400 },
  coscia_dx:     { label: 'Coscia destra',       fx: 0.465, fy: 0.640 },
  coscia_sx:     { label: 'Coscia sinistra',     fx: 0.535, fy: 0.640 },
  polpaccio_dx:  { label: 'Polpaccio',           fx: 0.468, fy: 0.748 },
  caviglia_dx:   { label: 'Caviglia destra',     fx: 0.472, fy: 0.845 },
}

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

function matchZone(text) {
  if (!text) return null
  const t = text.toLowerCase()
  for (const [zone, kws] of ZONE_MATCH)
    if (kws.some(k => t.includes(k))) return zone
  return null
}

export default function BodyMap({ doctorMode = false }) {
  const [activeZone, setActiveZone] = useState(null)
  const [imgLoaded, setImgLoaded]   = useState(false)

  const episodes  = store.episodes.all()
  const screening = lsLoad('mcd_screening')
  const watchlist = lsLoad('mcd_watchlist')

  const zoneEvents = useMemo(() => {
    const map = {}
    const add = (z, ev) => { map[z] = [...(map[z] || []), ev] }

    episodes.forEach(ep => {
      const zone = matchZone(ep.body_area) || matchZone(ep.diagnosis) || matchZone(ep.symptoms)
      if (!zone) return
      add(zone, {
        kind: ep.type, color: TYPE_COLOR[ep.type] || '#6b7280',
        label: ep.diagnosis || ep.body_area, sub: ep.body_area,
        date: ep.start_date, status: ep.outcome, notes: ep.notes,
      })
    })

    screening.forEach(sc => {
      const zone = matchZone(sc.name) || matchZone(sc.category)
      if (!zone) return
      const overdue = sc.next_date && sc.next_date < new Date().toISOString().slice(0, 10)
      add(zone, {
        kind: 'screening', color: overdue ? '#7f1d1d' : TYPE_COLOR.screening,
        label: sc.name, sub: sc.category, date: sc.last_date,
        status: sc.next_date
          ? `Prossimo: ${new Date(sc.next_date).toLocaleDateString('it-IT')}${overdue ? ' ⚠️ scaduto' : ''}`
          : '',
        notes: sc.notes,
      })
    })

    watchlist.forEach(w => {
      const zone = matchZone(w.title) || matchZone(w.body_area) || matchZone(w.context)
      if (!zone) return
      add(zone, {
        kind: 'watchlist', color: TYPE_COLOR.watchlist,
        label: w.title, sub: w.body_area || w.context || '',
        date: w.date_noticed,
        status: w.status === 'da_controllare' ? 'Da controllare' : (w.status || ''),
        notes: w.notes,
      })
    })

    return map
  }, [])

  const getDominant = (zoneId) => {
    const evs = zoneEvents[zoneId] || []
    for (const kind of KIND_PRIORITY) {
      const e = evs.find(e => e.kind === kind)
      if (e) return e.color
    }
    return evs[0]?.color || '#6b7280'
  }

  const activeEvents = activeZone ? (zoneEvents[activeZone] || []) : []

  const W = doctorMode ? 620 : 567
  const H = doctorMode ? 620 : 567

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', maxWidth: '100%', overflow: 'hidden' }}>

      {/* Silhouette + markers + correlation lines */}
      <div style={{ flexShrink: 0, position: 'relative', width: W, height: H, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,150,130,0.25)', maxWidth: '100%' }}>

        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#f0ece4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.85rem', opacity: 0.6,
          }}>
            Caricamento…
          </div>
        )}

        <img
          src="/vitruvian.jpg?v=2"
          alt="Mappa corporea"
          width={W}
          height={H}
          onLoad={() => setImgLoaded(true)}
          style={{ display: 'block', width: W, height: H, objectFit: 'cover', opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
        />

        {/* Markers */}
        {Object.entries(ZONES).map(([zoneId, zone]) => {
          const evs = zoneEvents[zoneId] || []
          if (!evs.length) return null
          const color    = getDominant(zoneId)
          const isActive = activeZone === zoneId
          const size     = isActive ? 22 : 16
          const showLabel = doctorMode || isActive

          return (
            <div
              key={zoneId}
              onClick={() => !doctorMode && setActiveZone(isActive ? null : zoneId)}
              title={zone.label}
              style={{
                position:  'absolute',
                left:      `${zone.fx * 100}%`,
                top:       `${zone.fy * 100}%`,
                transform: 'translate(-50%, -50%)',
                cursor:    doctorMode ? 'default' : 'pointer',
                zIndex:    10,
              }}
            >
              <div style={{
                position: 'absolute',
                inset: -7,
                borderRadius: '50%',
                background: color,
                opacity: isActive ? 0.4 : 0.25,
                animation: !isActive ? 'pulse 2s ease-in-out infinite' : 'none',
              }}/>
              <div style={{
                width:          size,
                height:         size,
                borderRadius:   '50%',
                background:     color,
                border:         '2.5px solid white',
                boxShadow:      `0 0 ${isActive ? 14 : 7}px ${color}cc, 0 2px 8px rgba(0,0,0,0.4)`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       9,
                fontWeight:     700,
                color:          'white',
                transition:     'all 0.15s ease',
              }}>
                {evs.length > 1 ? evs.length : ''}
              </div>

              {showLabel && (
                <div style={{
                  position:      'absolute',
                  bottom:        '140%',
                  left:          '50%',
                  transform:     'translateX(-50%)',
                  background:    'rgba(10,20,30,0.92)',
                  color:         'white',
                  fontSize:      '0.7rem',
                  fontWeight:    600,
                  padding:       '4px 10px',
                  borderRadius:  6,
                  whiteSpace:    'nowrap',
                  pointerEvents: 'none',
                  boxShadow:     '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  {zone.label}
                </div>
              )}
            </div>
          )
        })}

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.25; }
            50%       { transform: scale(1.3); opacity: 0.12; }
          }
        `}</style>
      </div>

      {/* Right panel — hidden in doctorMode (DoctorView shows its own panel) */}
      {!doctorMode && (
        <div style={{ flex: 1, minWidth: 240, maxWidth: 320 }}>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', textAlign: 'center' }}>
              Legenda
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.5rem', justifyItems: 'start' }}>
              {Object.entries(TYPE_COLOR).map(([kind, color]) => (
                <div key={kind} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#334155' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                  {TYPE_LABEL[kind]}
                </div>
              ))}
            </div>
          </div>

          {activeZone ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: getDominant(activeZone) }}/>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {ZONES[activeZone]?.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {activeEvents.map((ev, i) => (
                  <div key={i} style={{
                    borderLeft: `3px solid ${ev.color}`,
                    background: '#f0fdf8',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.65rem 0.9rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontSize: '0.63rem', fontWeight: 700, color: ev.color,
                        background: ev.color + '1a', borderRadius: 4,
                        padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {TYPE_LABEL[ev.kind] || ev.kind}
                      </span>
                      {ev.date && (
                        <span style={{ fontSize: '0.7rem', color: '#0f766e' }}>
                          {new Date(ev.date).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>{ev.label}</div>
                    {ev.sub && ev.sub !== ev.label && (
                      <div style={{ fontSize: '0.74rem', color: '#0f766e', marginTop: '0.1rem' }}>{ev.sub}</div>
                    )}
                    {ev.status && (
                      <div style={{ fontSize: '0.7rem', color: '#0d9488', marginTop: '0.25rem' }}>
                        {OUTCOME_LABEL[ev.status] || ev.status}
                      </div>
                    )}
                    {ev.notes && (
                      <div style={{ fontSize: '0.7rem', color: '#0d9488', marginTop: '0.2rem', fontStyle: 'italic' }}>{ev.notes}</div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveZone(null)} style={{
                marginTop: '1rem', background: 'none', border: 'none',
                color: '#0f766e', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline',
              }}>
                ← Torna alla lista
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>
                Aree con eventi ({Object.keys(zoneEvents).length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {Object.entries(zoneEvents).map(([zoneId, evs]) => {
                  const dominant = getDominant(zoneId)
                  const kinds = [...new Set(evs.map(e => e.kind))]
                  return (
                    <button key={zoneId} onClick={() => setActiveZone(zoneId)} style={{
                      display: 'flex', alignItems: 'center', gap: '0',
                      borderRadius: 10, overflow: 'hidden',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      border: '1px solid #e2e8f0', background: 'white',
                    }}>
                      <div style={{ width: 4, alignSelf: 'stretch', background: dominant, flexShrink: 0 }}/>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.45rem 0.7rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', flex: 1, lineHeight: 1.2 }}>
                          {ZONES[zoneId]?.label}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          {kinds.map(kind => (
                            <span key={kind} style={{
                              fontSize: '0.6rem', fontWeight: 700, color: TYPE_COLOR[kind] || '#6b7280',
                              background: (TYPE_COLOR[kind] || '#6b7280') + '18',
                              borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase',
                            }}>
                              {TYPE_LABEL[kind]?.slice(0, 3) || kind.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, color: 'white',
                          background: dominant, borderRadius: 6,
                          padding: '1px 7px', flexShrink: 0,
                        }}>{evs.length}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
