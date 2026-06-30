import React, { useState } from 'react'
import { Plus, Trash2, ShieldCheck, FileText, Link2, Euro, Paperclip } from 'lucide-react'
import { policiesStore, claimsStore, episodes } from '../store'

const card = { background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: 'var(--card-pad)', boxShadow: 'var(--sh-sm)', marginBottom: 'var(--gap)' }
const lab = { fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }
const btn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }
const ghost = { ...btn, background: 'var(--panel-2)', color: 'var(--ink)', border: '1px solid var(--hair)' }
const input = { width: '100%', padding: '9px 11px', borderRadius: 'var(--r-sm)', border: '1px solid var(--hair)', background: 'var(--panel-2)', fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }
const fld = { fontSize: 12, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }

const STATUS = { aperta: ['Aperta', 'var(--ink-3)'], inviata: ['Inviata', 'var(--warn)'], rimborsata: ['Rimborsata', 'var(--pos)'], respinta: ['Respinta', 'var(--danger)'] }
const fmt = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const eur = (n) => (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

function Badge({ status }) {
  const [t, c] = STATUS[status] || STATUS.aperta
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: c, background: 'color-mix(in oklab,' + c + ' 14%, var(--panel))', padding: '3px 9px', borderRadius: 99 }}>{t}</span>
}

export default function Polizze() {
  const [policies, setPolicies] = useState(policiesStore.all)
  const [claims, setClaims] = useState(claimsStore.all)
  const eps = episodes.all()

  const [showP, setShowP] = useState(false)
  const [showC, setShowC] = useState(false)
  const [p, setP] = useState({ insurer: '', number: '', type: 'Infortuni', expiry: '', fileName: '', fileData: '' })
  const [c, setC] = useState({ title: '', episodeId: '', amount: '', status: 'aperta', date: new Date().toISOString().slice(0, 10), notes: '' })

  const onFile = (e) => {
    const f = e.target.files[0]; if (!f) return
    if (f.size > 3_000_000) { alert('File troppo grande (max 3MB)'); return }
    const r = new FileReader()
    r.onload = ev => setP(prev => ({ ...prev, fileName: f.name, fileData: ev.target.result }))
    r.readAsDataURL(f)
  }
  const addP = () => { if (!p.insurer) return; setPolicies(policiesStore.add(p)); setP({ insurer: '', number: '', type: 'Infortuni', expiry: '', fileName: '', fileData: '' }); setShowP(false) }
  const addC = () => { if (!c.title) return; setClaims(claimsStore.add(c)); setC({ title: '', episodeId: '', amount: '', status: 'aperta', date: new Date().toISOString().slice(0, 10), notes: '' }); setShowC(false) }
  const epLabel = (id) => { const e = eps.find(x => x.id === id); return e ? (e.title || e.type || 'Episodio') + (e.date ? ` · ${fmt(e.date)}` : '') : null }

  const totReq = claims.reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const totRef = claims.filter(x => x.status === 'rimborsata').reduce((s, x) => s + (Number(x.amount) || 0), 0)
  const totOpen = claims.filter(x => x.status === 'aperta' || x.status === 'inviata').reduce((s, x) => s + (Number(x.amount) || 0), 0)

  return (
    <div>
      {/* Riepilogo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {[['Richiesto', eur(totReq), 'var(--panel-2)'], ['In attesa', eur(totOpen), 'var(--warn-wash)'], ['Rimborsato', eur(totRef), 'var(--pos-wash)']].map(([l, v, t]) => (
          <div key={l} style={{ background: t, border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginTop: 6, fontFamily: 'var(--font-serif)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Polizze */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={lab}>Le tue polizze</div>
          {!showP && <button style={btn} onClick={() => setShowP(true)}><Plus size={15} /> Aggiungi polizza</button>}
        </div>
        {showP && (
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={fld}>Compagnia *</label><input style={input} value={p.insurer} onChange={e => setP({ ...p, insurer: e.target.value })} /></div>
              <div><label style={fld}>N° polizza</label><input style={input} value={p.number} onChange={e => setP({ ...p, number: e.target.value })} /></div>
              <div><label style={fld}>Tipo</label><select style={input} value={p.type} onChange={e => setP({ ...p, type: e.target.value })}><option>Infortuni</option><option>Malattia</option><option>Vita</option><option>Sanitaria integrativa</option><option>Altro</option></select></div>
              <div><label style={fld}>Scadenza</label><input style={input} type="date" value={p.expiry} onChange={e => setP({ ...p, expiry: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={fld}>Documento polizza (PDF/immagine, max 3MB)</label>
                <label style={{ ...ghost, cursor: 'pointer' }}><Paperclip size={15} /> {p.fileName || 'Carica file'}<input type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={onFile} /></label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button style={btn} onClick={addP}>Salva</button><button style={ghost} onClick={() => setShowP(false)}>Annulla</button></div>
          </div>
        )}
        {policies.length === 0 && !showP && <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0', fontSize: 14 }}>Nessuna polizza caricata.</div>}
        {policies.map(pol => (
          <div key={pol.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', borderLeft: '3px solid var(--accent)', marginBottom: 8 }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{pol.insurer} <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>· {pol.type}</span></div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{pol.number ? `N° ${pol.number}` : 'senza numero'}{pol.expiry ? ` · scade ${fmt(pol.expiry)}` : ''}</div>
            </div>
            {pol.fileData && <a href={pol.fileData} download={pol.fileName} style={{ color: 'var(--accent)', display: 'grid', placeItems: 'center' }} title="Scarica documento"><FileText size={17} /></a>}
            <button onClick={() => setPolicies(policiesStore.remove(pol.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {/* Pratiche di rimborso */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={lab}>Pratiche di rimborso</div>
          {!showC && <button style={btn} onClick={() => setShowC(true)}><Plus size={15} /> Nuova pratica</button>}
        </div>
        {showC && (
          <div style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', borderRadius: 'var(--r-sm)', padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}><label style={fld}>Titolo *</label><input style={input} placeholder="es. Rimborso visita ortopedica" value={c.title} onChange={e => setC({ ...c, title: e.target.value })} /></div>
              <div><label style={fld}>Collega a infortunio/episodio</label>
                <select style={input} value={c.episodeId} onChange={e => setC({ ...c, episodeId: e.target.value })}>
                  <option value="">— nessuno —</option>
                  {eps.map(e => <option key={e.id} value={e.id}>{(e.title || e.type || 'Episodio')}{e.date ? ` · ${fmt(e.date)}` : ''}</option>)}
                </select>
              </div>
              <div><label style={fld}>Importo (€)</label><input style={input} type="number" step="0.01" value={c.amount} onChange={e => setC({ ...c, amount: e.target.value })} /></div>
              <div><label style={fld}>Stato</label><select style={input} value={c.status} onChange={e => setC({ ...c, status: e.target.value })}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></div>
              <div><label style={fld}>Data</label><input style={input} type="date" value={c.date} onChange={e => setC({ ...c, date: e.target.value })} /></div>
              <div style={{ gridColumn: '1 / -1' }}><label style={fld}>Note</label><input style={input} value={c.notes} onChange={e => setC({ ...c, notes: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button style={btn} onClick={addC}>Salva</button><button style={ghost} onClick={() => setShowC(false)}>Annulla</button></div>
          </div>
        )}
        {claims.length === 0 && !showC && <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0', fontSize: 14 }}>Nessuna pratica. Collega un infortunio per richiedere un rimborso.</div>}
        {claims.map(cl => (
          <div key={cl.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', marginBottom: 8 }}>
            <Euro size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{cl.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {cl.amount ? <span>{eur(cl.amount)}</span> : null}
                {epLabel(cl.episodeId) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-ink)' }}><Link2 size={12} /> {epLabel(cl.episodeId)}</span>}
                <span>· {fmt(cl.date)}</span>
              </div>
            </div>
            <Badge status={cl.status} />
            <button onClick={() => setClaims(claimsStore.remove(cl.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  )
}
