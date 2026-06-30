import React, { useState } from 'react'
import { Plus, Trash2, Baby, CalendarHeart, Activity, Stethoscope, FlaskConical, History } from 'lucide-react'
import { getPregnancy, savePregnancy, pregScansStore, pregLabsStore, pregPastStore } from '../store'

const card = { background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: 'var(--card-pad)', boxShadow: 'var(--sh-sm)', marginBottom: 'var(--gap)' }
const lab = { fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }
const btn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }
const ghost = { ...btn, background: 'var(--panel-2)', color: 'var(--ink)', border: '1px solid var(--hair)' }
const input = { width: '100%', padding: '9px 11px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)', background: 'var(--panel-2)', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }
const fld = { fontSize: 12, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }

const DELIVERY = ['naturale', 'cesareo', 'indotto', 'altro']
const fmt = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
const today = () => new Date().toISOString().slice(0, 10)

function Stat({ icon: Icon, label, value, sub, tint }) {
  return (
    <div style={{ background: tint || 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
        <Icon size={14} /> {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 8, fontFamily: 'var(--font-serif)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// Elenco generico per ecografie/appuntamenti e analisi del sangue (stessi campi)
function EventList({ title, icon: Icon, store, accent, addLabel, labelPlaceholder }) {
  const [list, setList] = useState(store.all)
  const [show, setShow] = useState(false)
  const [draft, setDraft] = useState({ date: '', label: '', notes: '' })
  const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  const add = () => {
    if (!draft.date && !draft.label) return
    setList(store.add(draft)); setDraft({ date: '', label: '', notes: '' }); setShow(false)
  }
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ ...lab, display: 'flex', alignItems: 'center', gap: 8 }}><Icon size={15} style={{ color: accent }} /> {title}</div>
        {!show && <button style={btn} onClick={() => setShow(true)}><Plus size={15} /> {addLabel}</button>}
      </div>

      {show && (
        <div style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={fld}>Data</label><input style={input} type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></div>
            <div><label style={fld}>Tipo / nome</label><input style={input} placeholder={labelPlaceholder} value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={fld}>Note / esito</label><input style={input} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btn} onClick={add}>Salva</button>
            <button style={ghost} onClick={() => setShow(false)}>Annulla</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !show && (
        <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0', fontSize: 14 }}>Niente ancora. Usa “{addLabel}”.</div>
      )}

      {sorted.map((it) => (
        <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', borderLeft: `3px solid ${accent}`, marginBottom: 8 }}>
          <Icon size={18} style={{ color: accent, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{it.label || 'Senza titolo'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{fmt(it.date)}{it.notes ? ` · ${it.notes}` : ''}</div>
          </div>
          <button onClick={() => setList(store.remove(it.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function PastPregnancies() {
  const [list, setList] = useState(pregPastStore.all)
  const [show, setShow] = useState(false)
  const empty = { date: '', term: 'si', delivery: 'naturale', notes: '' }
  const [draft, setDraft] = useState(empty)
  const sorted = [...list].sort((a, b) => (a.date < b.date ? 1 : -1))
  const add = () => { setList(pregPastStore.add(draft)); setDraft(empty); setShow(false) }
  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ ...lab, display: 'flex', alignItems: 'center', gap: 8 }}><History size={15} style={{ color: 'var(--gold)' }} /> Gravidanze pregresse</div>
        {!show && <button style={btn} onClick={() => setShow(true)}><Plus size={15} /> Aggiungi</button>}
      </div>

      {show && (
        <div style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={fld}>Data (anno / parto)</label><input style={input} type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></div>
            <div><label style={fld}>Portata a termine?</label>
              <select style={input} value={draft.term} onChange={e => setDraft({ ...draft, term: e.target.value })}>
                <option value="si">Sì</option>
                <option value="no">No</option>
              </select>
            </div>
            {draft.term === 'si' && (
              <div><label style={fld}>Tipo di parto</label>
                <select style={input} value={draft.delivery} onChange={e => setDraft({ ...draft, delivery: e.target.value })}>
                  {DELIVERY.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}><label style={fld}>Note</label><input style={input} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={btn} onClick={add}>Salva</button>
            <button style={ghost} onClick={() => setShow(false)}>Annulla</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !show && (
        <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0', fontSize: 14 }}>Nessuna gravidanza pregressa registrata.</div>
      )}

      {sorted.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', borderLeft: '3px solid var(--gold)', marginBottom: 8 }}>
          <Baby size={18} style={{ color: 'var(--gold)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{fmt(p.date)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>
              {p.term === 'si' ? `A termine · parto ${p.delivery || 'n/d'}` : 'Non portata a termine'}{p.notes ? ` · ${p.notes}` : ''}
            </div>
          </div>
          <button onClick={() => setList(pregPastStore.remove(p.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

export default function Gravidanza() {
  const [preg, setPreg] = useState(() => getPregnancy())
  const update = (patch) => { const next = { ...preg, ...patch }; setPreg(next); savePregnancy(next) }

  const active = preg.active === 'si'
  const lmp = preg.lmp || ''
  // epoca presunta del parto: manuale se impostata, altrimenti Naegele (UM + 280 gg)
  const edd = preg.edd || (lmp ? addDays(lmp, 280) : '')
  let weekTxt = '—', weekSub = 'imposta la data delle ultime mestruazioni'
  if (lmp) {
    const days = daysBetween(lmp, today())
    if (days >= 0 && days <= 7 * 45) {
      weekTxt = `${Math.floor(days / 7)}+${days % 7}`
      weekSub = 'settimane + giorni'
    }
  }
  const toGo = edd ? daysBetween(today(), edd) : null

  return (
    <div>
      {/* Stato gravidanza */}
      <div style={card}>
        <div style={{ ...lab, marginBottom: 12 }}>Gravidanza in corso?</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={active ? btn : ghost} onClick={() => update({ active: 'si' })}><Baby size={15} /> Sì, in corso</button>
          <button style={preg.active === 'no' ? btn : ghost} onClick={() => update({ active: 'no' })}>No</button>
        </div>
      </div>

      {active && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
            <Stat icon={Activity} label="Settimana" value={weekTxt} sub={weekSub} tint="var(--accent-wash)" />
            <Stat icon={CalendarHeart} label="Data presunta parto" value={edd ? fmt(edd) : '—'} sub={toGo != null ? (toGo >= 0 ? `tra ${toGo} giorni` : 'data superata') : 'in attesa di dati'} tint="var(--violet-wash)" />
          </div>

          <div style={card}>
            <div style={{ ...lab, marginBottom: 12 }}>Date principali</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={fld}>Ultime mestruazioni (UM)</label>
                <input style={input} type="date" value={lmp} onChange={e => update({ lmp: e.target.value })} />
              </div>
              <div>
                <label style={fld}>Data presunta del parto</label>
                <input style={input} type="date" value={edd} onChange={e => update({ edd: e.target.value })} />
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Calcolata dall’UM, modificabile.</div>
              </div>
            </div>
          </div>

          <EventList title="Ecografie e appuntamenti" icon={Stethoscope} store={pregScansStore} accent="var(--accent)" addLabel="Aggiungi ecografia" labelPlaceholder="es. eco morfologica, visita…" />
          <EventList title="Analisi del sangue" icon={FlaskConical} store={pregLabsStore} accent="var(--violet)" addLabel="Aggiungi analisi" labelPlaceholder="es. emocromo, glicemia, toxo…" />
        </>
      )}

      <PastPregnancies />

      <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        Le date sono stime (regola di Naegele: UM + 280 giorni) e non sostituiscono il parere del tuo ginecologo.
      </div>
    </div>
  )
}
