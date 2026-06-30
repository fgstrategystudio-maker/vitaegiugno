import React, { useState } from 'react'
import { Syringe, CheckCircle2, Clock, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import * as store from '../store'

const lsGet = (k, fb = []) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)) } catch { return fb } }
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// Piano Nazionale di Prevenzione Vaccinale 2023-2025 (Ministero della Salute)
// Fonte: https://www.salute.gov.it/imgs/C_17_pubblicazioni_3335_allegato.pdf
const VACCINE_SCHEDULE = [
  {
    id: 'dtpa',
    name: 'Difterite · Tetano · Pertosse (dTpa)',
    description: 'Richiamo ogni 10 anni in età adulta per mantenere la protezione.',
    interval: '10 anni',
    minAge: 0,
    maxAge: 99,
    source: 'PNPV 2023-2025, Ministero della Salute',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4829&area=vaccinazioni&menu=vuoto',
    category: 'base',
    periodic: true,
  },
  {
    id: 'mpr',
    name: 'Morbillo · Parotite · Rosolia (MPR)',
    description: '2 dosi totali nel corso della vita. Fondamentale per chi non ha documentazione di vaccinazione infantile.',
    minAge: 0,
    maxAge: 50,
    source: 'PNPV 2023-2025',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4837',
    category: 'base',
    doses: 2,
  },
  {
    id: 'varicella',
    name: 'Varicella',
    description: '2 dosi se non si ha storia di malattia naturale e non si è stati vaccinati. Protezione importante in età adulta (complicanze più severe).',
    minAge: 0,
    maxAge: 50,
    source: 'PNPV 2023-2025',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4848',
    category: 'base',
    doses: 2,
  },
  {
    id: 'hpv',
    name: 'Papillomavirus (HPV)',
    description: 'Raccomandato fino a 26 anni per entrambi i sessi (PNPV). L\'OMS e le linee guida europee estendono la raccomandazione fino a 45 anni per soggetti non precedentemente vaccinati. Protegge da carcinoma cervicale, anale, orofaringeo.',
    minAge: 12,
    maxAge: 45,
    source: 'PNPV 2023-2025 (gratuito fino a 26 aa); OMS Weekly Epidemiological Record 2022 (raccomandato fino a 45 aa)',
    sourceUrl: 'https://www.who.int/publications/i/item/who-wer9750',
    category: 'base',
    doses: 2,
  },
  {
    id: 'hbv',
    name: 'Epatite B (HBV)',
    description: '3 dosi (0, 1, 6 mesi) se non vaccinati da bambini. Obbligatorio per nati dal 1991 in poi in Italia — verificare documentazione.',
    minAge: 0,
    maxAge: 99,
    source: 'PNPV 2023-2025; L. 165/1991 (obbligo per nati dal 1991)',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4831',
    category: 'base',
    doses: 3,
  },
  {
    id: 'hav',
    name: 'Epatite A (HAV)',
    description: 'Raccomandato per viaggiatori in aree endemiche (Africa, Asia, America Latina), operatori alimentari, epatopatici. 2 dosi (0 e 6-12 mesi).',
    minAge: 0,
    maxAge: 99,
    source: 'PNPV 2023-2025; CDC Travelers\' Health Yellow Book',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/yellowbook/2024/vaccines-and-medicines/hepatitis-a',
    category: 'viaggi',
    doses: 2,
  },
  {
    id: 'mening_acwy',
    name: 'Meningococco ACWY',
    description: 'Raccomandato per: viaggiatori in fascia della meningite (Africa sub-sahariana), Hajj/Mecca, studenti in college/università, asplenici, immunodepressi. Richiamo ogni 3-5 anni se il rischio persiste.',
    minAge: 0,
    maxAge: 99,
    source: 'PNPV 2023-2025; CDC Yellow Book 2024',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4836',
    category: 'rischio',
    doses: 1,
  },
  {
    id: 'mening_b',
    name: 'Meningococco B',
    description: 'Raccomandato per asplenici, immunodepressi, conviventi con casi. Valutare anche in adulti giovani in contesti ad alto rischio (college, caserme).',
    minAge: 0,
    maxAge: 25,
    source: 'PNPV 2023-2025',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=4836',
    category: 'rischio',
    doses: 2,
  },
  {
    id: 'influenza',
    name: 'Influenza (annuale)',
    description: 'Raccomandato annualmente: >65 anni, patologie croniche (diabete, BPCO, cardiopatia, immunodepressione), operatori sanitari, donne in gravidanza. Consigliato a tutti gli adulti.',
    minAge: 0,
    maxAge: 99,
    source: 'PNPV 2023-2025; WHO Global Influenza Programme',
    sourceUrl: 'https://www.who.int/teams/global-influenza-programme/policies/recommended-composition',
    category: 'annuale',
    periodic: true,
    interval: 'annuale',
  },
  {
    id: 'pneumococco',
    name: 'Pneumococco (PCV15/PCV20)',
    description: 'Raccomandato: ≥65 anni, patologie croniche (BPCO, cardiopatia, diabete, asplenia, immunodepressione). Protegge da polmonite batterica, sepsi, meningite pneumococcica.',
    minAge: 60,
    maxAge: 99,
    source: 'PNPV 2023-2025; CDC ACIP Recommendations 2023',
    sourceUrl: 'https://www.cdc.gov/vaccines/vpd/pneumo/hcp/recommendations.html',
    category: 'eta',
    doses: 1,
  },
  {
    id: 'herpes_zoster',
    name: 'Herpes Zoster (Shingrix)',
    description: 'Vaccino ricombinante adiuvato (RZV): 2 dosi a distanza di 2-6 mesi. Raccomandato ≥50 anni (OMS, ECDC); nel PNPV italiano ≥65 anni. Efficacia >90% nella prevenzione del fuoco di Sant\'Antonio e della nevralgia post-erpetica.',
    minAge: 50,
    maxAge: 99,
    source: 'PNPV 2023-2025 (≥65 aa); ECDC Technical Report 2022; Lancet 2022, doi:10.1016/S0140-6736(22)00441-7 (efficacia 91.3%)',
    sourceUrl: 'https://www.ecdc.europa.eu/en/publications-data/technical-report-herpes-zoster-vaccination',
    category: 'eta',
    doses: 2,
  },
  {
    id: 'covid19',
    name: 'COVID-19 (booster aggiornato)',
    description: 'Booster annuale con formulazione aggiornata alla variante circolante, in particolare per: >60 anni, immunodepressi, patologie croniche, operatori sanitari. Raccomandato a tutta la popolazione ogni stagione autunnale.',
    minAge: 0,
    maxAge: 99,
    source: 'Circolare Ministero della Salute 2024; WHO TAG-CO-VAC Recommendations',
    sourceUrl: 'https://www.salute.gov.it/portale/vaccinazioni/dettaglioContenutiVaccinazioni.jsp?lingua=italiano&id=6101',
    category: 'annuale',
    periodic: true,
    interval: 'annuale',
  },
  {
    id: 'tifo',
    name: 'Tifo (febbre tifoidea)',
    description: 'Per viaggiatori verso aree a rischio (Asia meridionale, Africa, America Latina). Vaccino orale (Ty21a, 3 dosi) o iniettabile (Vi-PS, 1 dose). Richiamo ogni 3-7 anni.',
    minAge: 0,
    maxAge: 99,
    source: 'CDC Yellow Book 2024; WHO position paper 2018',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/yellowbook/2024/vaccines-and-medicines/typhoid-and-paratyphoid-fever',
    category: 'viaggi',
    doses: 1,
  },
  {
    id: 'febbre_gialla',
    name: 'Febbre Gialla',
    description: 'Obbligatoria per ingresso in alcuni paesi (Africa subsahariana, America tropicale). Dose unica, valida a vita secondo IHR 2005. Solo centri vaccinali autorizzati.',
    minAge: 9,
    maxAge: 99,
    source: 'International Health Regulations 2005 (IHR); WHO position paper 2013',
    sourceUrl: 'https://www.who.int/publications/i/item/who-wer8827',
    category: 'viaggi',
    doses: 1,
  },
  {
    id: 'rabbia',
    name: 'Rabbia (pre-esposizione)',
    description: 'Per viaggiatori in aree endemiche con accesso limitato alle cure, speleologo, veterinari. 3 dosi (0, 7, 21-28 giorni). Non elimina la necessità di PEP post-morso, ma semplifica il protocollo.',
    minAge: 0,
    maxAge: 99,
    source: 'WHO position paper on Rabies vaccines 2018; CDC Yellow Book 2024',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/yellowbook/2024/vaccines-and-medicines/rabies',
    category: 'viaggi',
    doses: 3,
  },
]

const CATEGORY_META = {
  base:    { label: 'Vaccinazioni di base', color: 'var(--accent)',  bg: 'var(--accent-wash)'  },
  eta:     { label: 'Per età',             color: 'var(--pos)',     bg: 'var(--pos-wash)'     },
  annuale: { label: 'Richiami annuali',    color: 'var(--warn)',    bg: 'var(--warn-wash)'    },
  rischio: { label: 'Categorie a rischio', color: 'var(--violet)',  bg: 'var(--violet-wash)'  },
  viaggi:  { label: 'Viaggi internazionali', color: 'var(--info)', bg: 'var(--info-wash)'    },
}

function getAge(profile) {
  if (!profile?.birth_year) return null
  return new Date().getFullYear() - parseInt(profile.birth_year)
}

function getStatus(vaccine, record, age) {
  if (!record || !record.done) return 'todo'
  if (!vaccine.periodic) return 'done'
  // For periodic vaccines, check if it's overdue
  if (!record.date_done) return 'done'
  const done = new Date(record.date_done)
  const now = new Date()
  const yearsDiff = (now - done) / (1000 * 60 * 60 * 24 * 365)
  if (vaccine.id === 'dtpa' && yearsDiff > 10) return 'overdue'
  if ((vaccine.id === 'influenza' || vaccine.id === 'covid19') && yearsDiff > 1.2) return 'due_soon'
  return 'done'
}

const BLANK_CUSTOM = { name: '', date_done: '', notes: '' }

export default function Vaccini() {
  const profile = store.getProfile?.() ?? {}
  const age = getAge(profile)
  const [records, setRecords] = useState(() => lsGet('mcd_vaccines', {}))
  const [editId, setEditId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')

  // Custom vaccines (not in schedule)
  const [custom, setCustom] = useState(() => lsGet('mcd_vaccines_custom', []))
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({ ...BLANK_CUSTOM })

  const saveCustom = (arr) => { setCustom(arr); lsSet('mcd_vaccines_custom', arr) }

  const addCustom = () => {
    if (!customForm.name.trim()) return
    saveCustom([...custom, { id: Date.now().toString(), ...customForm }])
    setCustomForm({ ...BLANK_CUSTOM })
    setShowCustomForm(false)
  }

  const deleteCustom = (id) => saveCustom(custom.filter(c => c.id !== id))

  const save = (vaccineId, done, date_done, notes) => {
    const updated = { ...records, [vaccineId]: { done, date_done, notes } }
    setRecords(updated)
    lsSet('mcd_vaccines', updated)
  }

  const quickMark = (v, e) => {
    e.stopPropagation()
    const rec = records[v.id] || {}
    if (rec.done) {
      save(v.id, false, '', '')
    } else {
      save(v.id, true, new Date().toISOString().slice(0, 10), '')
      setExpandedId(null)
    }
  }

  const startEdit = (v) => {
    const r = records[v.id] || {}
    setEditId(v.id)
    setEditDate(r.date_done || '')
    setEditNotes(r.notes || '')
  }

  const confirmEdit = (v) => {
    save(v.id, true, editDate, editNotes)
    setEditId(null)
  }

  const markNotDone = (v) => {
    save(v.id, false, '', '')
    setEditId(null)
  }

  const relevantVaccines = VACCINE_SCHEDULE.filter(v =>
    age === null || (age >= v.minAge && age <= v.maxAge + 5)
  )

  const filtered = filterCat === 'all' ? relevantVaccines : relevantVaccines.filter(v => v.category === filterCat)

  const stats = {
    done: relevantVaccines.filter(v => records[v.id]?.done).length + custom.length,
    todo: relevantVaccines.filter(v => !records[v.id]?.done).length,
    overdue: relevantVaccines.filter(v => getStatus(v, records[v.id], age) === 'overdue').length,
  }

  const statusIcon = (s) => {
    if (s === 'done')     return <CheckCircle2 size={18} style={{ color: 'var(--pos)' }} />
    if (s === 'overdue')  return <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
    if (s === 'due_soon') return <Clock size={18} style={{ color: 'var(--warn)' }} />
    return <Clock size={18} style={{ color: 'var(--ink-3)' }} />
  }

  const statusLabel = (s) => ({
    done: 'Effettuato',
    overdue: 'Scaduto',
    due_soon: 'Da rinnovare',
    todo: 'Da fare',
  }[s] || 'Da fare')

  const statusColor = (s) => ({
    done: 'var(--pos)',
    overdue: 'var(--danger)',
    due_soon: 'var(--warn)',
    todo: 'var(--ink-3)',
  }[s] || 'var(--ink-3)')

  const card = {
    background: 'var(--panel)',
    border: '1px solid var(--hair)',
    borderRadius: 'var(--r)',
    padding: '18px 20px',
    boxShadow: 'var(--sh-sm)',
    marginBottom: 10,
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Effettuati', val: stats.done, color: 'var(--pos)', bg: 'var(--pos-wash)' },
          { label: 'Da fare', val: stats.todo, color: 'var(--ink-2)', bg: 'var(--panel-2)' },
          { label: 'Scaduti', val: stats.overdue, color: 'var(--danger)', bg: 'var(--danger-wash)' },
        ].map(s => (
          <div key={s.label} style={{ ...card, marginBottom: 0, background: s.bg, border: `1px solid color-mix(in oklab, ${s.color} 20%, var(--hair))`, textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, fontFamily: 'var(--font-serif)', lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {!age && (
        <div style={{ ...card, background: 'var(--warn-wash)', borderColor: 'color-mix(in oklab, var(--warn) 30%, var(--hair))', color: 'var(--warn-ink)', fontSize: 13, marginBottom: 16 }}>
          Aggiungi l'anno di nascita nel tuo profilo (Impostazioni) per vedere i vaccini rilevanti per la tua età.
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {[['all', 'Tutti'], ...Object.entries(CATEGORY_META).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setFilterCat(k)} style={{
            padding: '5px 14px', borderRadius: 99, border: '1px solid var(--hair)',
            background: filterCat === k ? 'var(--accent)' : 'var(--panel)',
            color: filterCat === k ? '#fff' : 'var(--ink-2)',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>{l}</button>
        ))}
      </div>

      {/* Vaccine list */}
      {filtered.map(v => {
        const rec = records[v.id] || {}
        const status = getStatus(v, rec, age)
        const catMeta = CATEGORY_META[v.category]
        const isExpanded = expandedId === v.id
        const isEditing = editId === v.id

        return (
          <div key={v.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ marginTop: 14, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                {statusIcon(status)}
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14.5 }}>{v.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: catMeta.bg, color: catMeta.color }}>
                    {catMeta.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: statusColor(status), fontWeight: 600 }}>
                    {statusLabel(status)}{rec.date_done ? ` · ${rec.date_done}` : ''}
                  </span>
                  {!isExpanded && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{v.description.slice(0, 70)}{v.description.length > 70 ? '…' : ''}</span>}
                </div>
              </div>
              {/* Quick toggle button */}
              <button
                onClick={(e) => quickMark(v, e)}
                title={rec.done ? 'Segna come non fatto' : 'Segna come effettuato'}
                style={{
                  flexShrink: 0, height: 34, padding: '0 12px', borderRadius: 8,
                  border: rec.done ? '1px solid color-mix(in oklab, var(--pos) 35%, var(--hair))' : '1px solid var(--hair)',
                  background: rec.done ? 'var(--pos-wash)' : 'var(--panel-2)',
                  color: rec.done ? 'var(--pos)' : 'var(--ink-3)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all .15s',
                }}
              >
                {rec.done ? <><CheckCircle2 size={13} /> Fatto</> : <><Syringe size={13} /> Segna</>}
              </button>
              <div style={{ color: 'var(--ink-3)', flexShrink: 0, cursor: 'pointer', paddingTop: 8 }} onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hair-soft)' }}>
                <p style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6, margin: '0 0 12px' }}>{v.description}</p>
                {v.doses && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 4 }}><b>Dosi:</b> {v.doses}</div>}
                {v.interval && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 4 }}><b>Frequenza:</b> {v.interval}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span>Fonte: {v.source}</span>
                  <a href={v.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5 }}
                    onClick={e => e.stopPropagation()}>
                    <ExternalLink size={11} /> Leggi
                  </a>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>Data di somministrazione</label>
                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13, fontFamily: 'var(--font-sans)' }} />
                    <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>Note (lotto, centro, ecc.)</label>
                    <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      placeholder="es. Lotto AB123, ASL Roma 1"
                      style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13, fontFamily: 'var(--font-sans)' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => confirmEdit(v)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--pos)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Salva</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel)', color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Annulla</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {rec.done ? (
                      <>
                        {rec.notes && <div style={{ fontSize: 12, color: 'var(--ink-2)', width: '100%', marginBottom: 6 }}>Note: {rec.notes}</div>}
                        <button onClick={() => startEdit(v)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-2)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Modifica data</button>
                        <button onClick={() => markNotDone(v)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid color-mix(in oklab, var(--danger) 30%, var(--hair))', background: 'var(--danger-wash)', color: 'var(--danger-ink)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Rimuovi</button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(v)} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Syringe size={14} /> Segna come effettuato
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Vaccini personalizzati ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid var(--hair)', paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Vaccini effettuati (aggiuntivi)</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Vaccini fatti non presenti nel calendario sopra (infanzia, viaggi, ecc.)</div>
          </div>
          <button onClick={() => setShowCustomForm(v => !v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px',
            borderRadius: 'var(--r)', border: 'none', background: 'var(--accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)',
          }}>
            <Plus size={15} /> Aggiungi vaccino
          </button>
        </div>

        {showCustomForm && (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 12, boxShadow: 'var(--sh-sm)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Nome vaccino *</label>
                <input type="text" value={customForm.name} onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="es. Morbillo-Parotite-Rosolia (MPR), Polio, DTPa ciclo completo…"
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'var(--font-sans)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Data di somministrazione</label>
                <input type="date" value={customForm.date_done} onChange={e => setCustomForm(f => ({ ...f, date_done: e.target.value }))}
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'var(--font-sans)' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }}>Note (lotto, centro, dosi, ecc.)</label>
                <input type="text" value={customForm.notes} onChange={e => setCustomForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="es. Lotto AB123, 2 dosi, ASL Roma 1"
                  style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'var(--font-sans)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={addCustom} disabled={!customForm.name.trim()} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--pos)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', opacity: customForm.name.trim() ? 1 : .4 }}>Salva</button>
              <button onClick={() => { setShowCustomForm(false); setCustomForm({ ...BLANK_CUSTOM }) }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-2)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Annulla</button>
            </div>
          </div>
        )}

        {custom.length === 0 && !showCustomForm && (
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic', padding: '12px 0' }}>
            Nessun vaccino aggiuntivo inserito.
          </div>
        )}

        {custom.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 12, marginBottom: 8, boxShadow: 'var(--sh-sm)' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--pos)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                {c.date_done && <span>Effettuato il {c.date_done}</span>}
                {c.notes && <span style={{ marginLeft: c.date_done ? 8 : 0 }}>· {c.notes}</span>}
              </div>
            </div>
            <button onClick={() => deleteCustom(c.id)} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid color-mix(in oklab, var(--danger) 25%, var(--hair))', background: 'var(--danger-wash)', color: 'var(--danger-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', background: 'var(--panel-2)', borderRadius: 'var(--r)', border: '1px solid var(--hair)', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
        <b style={{ color: 'var(--ink-2)' }}>Nota bene:</b> Questa sezione è un promemoria basato sul Piano Nazionale di Prevenzione Vaccinale (PNPV 2023-2025) e sulle linee guida OMS/CDC. Non sostituisce il parere del medico di medicina generale, che conosce la tua storia clinica e può prescrivere le vaccinazioni gratuitamente nel SSN.
      </div>
    </div>
  )
}
