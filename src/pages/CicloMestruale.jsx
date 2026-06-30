import React, { useState } from 'react'
import { Plus, Trash2, Droplet, CalendarHeart, Activity } from 'lucide-react'
import { cycleStore } from '../store'

const card = { background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: 'var(--card-pad)', boxShadow: 'var(--sh-sm)', marginBottom: 'var(--gap)' }
const lab = { fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }
const btn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }
const ghost = { ...btn, background: 'var(--panel-2)', color: 'var(--ink)', border: '1px solid var(--hair)' }
const input = { width: '100%', padding: '9px 11px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)', background: 'var(--panel-2)', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }
const fld = { fontSize: 12, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }

const FLOW = ['leggero', 'medio', 'abbondante']
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)
const fmt = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }

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

export default function CicloMestruale() {
  const [list, setList] = useState(cycleStore.all)
  const [show, setShow] = useState(false)
  const [draft, setDraft] = useState({ start: '', end: '', flow: 'medio', symptoms: '', notes: '' })

  const sorted = [...list].sort((a, b) => (a.start < b.start ? 1 : -1))
  const starts = sorted.map(c => c.start).filter(Boolean)
  let avgLen = null
  if (starts.length >= 2) {
    const diffs = []
    for (let i = 0; i < starts.length - 1; i++) diffs.push(daysBetween(starts[i + 1], starts[i]))
    avgLen = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length)
  }
  const lastStart = starts[0]
  const nextPred = lastStart && avgLen ? addDays(lastStart, avgLen) : null
  const curDay = lastStart ? daysBetween(lastStart, new Date().toISOString().slice(0, 10)) + 1 : null

  const add = () => {
    if (!draft.start) return
    setList(cycleStore.add(draft))
    setDraft({ start: '', end: '', flow: 'medio', symptoms: '', notes: '' })
    setShow(false)
  }
  const del = (id) => setList(cycleStore.remove(id))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <Stat icon={CalendarHeart} label="Prossimo ciclo" value={nextPred ? fmt(nextPred) : '—'} sub={nextPred ? `tra ${daysBetween(new Date().toISOString().slice(0,10), nextPred)} giorni` : 'servono 2+ cicli'} tint="var(--violet-wash)" />
        <Stat icon={Activity} label="Durata media ciclo" value={avgLen ? `${avgLen} gg` : '—'} sub={avgLen ? 'tra un inizio e l\'altro' : 'in attesa di dati'} />
        <Stat icon={Droplet} label="Giorno attuale" value={curDay ? `${curDay}°` : '—'} sub={lastStart ? `dall'inizio del ${fmt(lastStart)}` : 'nessun ciclo registrato'} tint="var(--accent-wash)" />
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={lab}>Storico cicli</div>
          {!show && <button style={btn} onClick={() => setShow(true)}><Plus size={15} /> Registra ciclo</button>}
        </div>

        {show && (
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={fld}>Inizio *</label><input style={input} type="date" value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} /></div>
              <div><label style={fld}>Fine</label><input style={input} type="date" value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} /></div>
              <div><label style={fld}>Flusso</label><select style={input} value={draft.flow} onChange={e => setDraft({ ...draft, flow: e.target.value })}>{FLOW.map(f => <option key={f}>{f}</option>)}</select></div>
              <div><label style={fld}>Sintomi</label><input style={input} placeholder="crampi, mal di testa…" value={draft.symptoms} onChange={e => setDraft({ ...draft, symptoms: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={fld}>Note</label><input style={input} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button style={btn} onClick={add}>Salva</button>
              <button style={ghost} onClick={() => setShow(false)}>Annulla</button>
            </div>
          </div>
        )}

        {sorted.length === 0 && !show && (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '32px 0', fontSize: 14 }}>
            Nessun ciclo registrato. Aggiungi le date per ottenere previsioni e media.
          </div>
        )}

        {sorted.map((c, i) => {
          const len = i < sorted.length - 1 ? daysBetween(sorted[i + 1].start, c.start) : null
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', borderLeft: '3px solid var(--violet)', marginBottom: 8 }}>
              <Droplet size={18} style={{ color: 'var(--violet)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{fmt(c.start)}{c.end ? ` – ${fmt(c.end)}` : ''}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>
                  Flusso {c.flow}{len ? ` · ciclo di ${len} gg` : ''}{c.symptoms ? ` · ${c.symptoms}` : ''}
                </div>
              </div>
              <button onClick={() => del(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Trash2 size={16} /></button>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        Le previsioni sono stime statistiche basate sui tuoi cicli precedenti e non sostituiscono un parere medico.
      </div>
    </div>
  )
}
