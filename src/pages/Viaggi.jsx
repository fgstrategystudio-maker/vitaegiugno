import React, { useState } from 'react'
import { Plane, Plus, Trash2, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Globe } from 'lucide-react'

const lsGet = (k, fb = []) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(fb)) } catch { return fb } }
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// Dati statici basati su OMS/CDC/Ministero della Salute (aggiornati 2024)
// Per epidemie in corso: controllare sempre WHO Disease Outbreak News + CDC Traveler Notices
const DESTINATION_DB = {
  // Africa
  'africa_subsahariana': {
    label: 'Africa Sub-Sahariana (generale)',
    vaccines_required: ['Febbre Gialla (obbligatoria per molti paesi)'],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Rabbia (pre-esposizione se in zone remote)', 'Meningococco ACWY (fascia meningite)', 'Influenza'],
    malaria: true,
    risks: ['Malaria (profilassi obbligatoria, consultare il medico)', 'Malattia del sonno (Tripanosomiasi)', 'Schistosomiasi (evitare acque dolci stagnanti)'],
    source: 'WHO International Travel and Health 2024; CDC Yellow Book 2024',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'africa_nord': {
    label: 'Africa del Nord (Marocco, Tunisia, Egitto…)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Tifo', 'Epatite B'],
    malaria: false,
    risks: ['Diarrea del viaggiatore', 'Leishmaniosi (zone rurali)', 'Schistosomiasi (Nilo)'],
    source: 'CDC Yellow Book 2024',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'asia_sud': {
    label: 'Asia meridionale (India, Bangladesh, Nepal, Pakistan)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Influenza', 'Rabbia (pre-esposizione)', 'Encefalite Giapponese (soggiorni > 4 settimane in aree rurali)'],
    malaria: true,
    risks: ['Malaria (in zone rurali)', 'Dengue (urbana)', 'Diarrea del viaggiatore', 'Encefalite Giapponese', 'Febbre Tifoide (alta prevalenza: ~540 casi/100.000 ab/anno in alcune aree – Lancet 2017)'],
    source: 'CDC Yellow Book 2024; Lancet Infect Dis 2017;17(2):e160-e170',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/traveler/none/india',
  },
  'asia_sud_est': {
    label: 'Asia sud-orientale (Thailandia, Vietnam, Indonesia, Cambogia…)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Rabbia (pre-esposizione)', 'Encefalite Giapponese', 'Influenza'],
    malaria: true,
    risks: ['Malaria (zone di confine e rurali)', 'Dengue (principale rischio urbano)', 'Zika (donne in gravidanza: evitare)', 'Chikungunya'],
    source: 'CDC Yellow Book 2024; WHO Dengue surveillance',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'asia_est': {
    label: 'Asia orientale (Giappone, Corea, Cina)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Influenza'],
    malaria: false,
    risks: ['Influenza aviaria H5N1 (contatto con pollame)', 'Encefalite Giapponese (zone rurali Cina)'],
    source: 'CDC Yellow Book 2024',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'america_latina': {
    label: 'America Latina tropicale (Brasile, Colombia, Perù, Bolivia…)',
    vaccines_required: ['Febbre Gialla (obbligatoria in alcune zone Amazzonia)'],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Rabbia (pre-esposizione in zone remote)', 'Influenza'],
    malaria: true,
    risks: ['Malaria (bacino amazzonico)', 'Dengue (principale rischio urbano)', 'Zika', 'Chikungunya', 'Leishmaniosi', 'Chagas (zone rurali)'],
    source: 'CDC Yellow Book 2024; PAHO Epidemiological Alerts',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'america_centrale': {
    label: 'America Centrale e Caraibi',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Influenza'],
    malaria: true,
    risks: ['Dengue (alta prevalenza)', 'Zika', 'Chikungunya', 'Malaria (zone rurali)'],
    source: 'CDC Yellow Book 2024',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
  'medio_oriente': {
    label: 'Medio Oriente (Arabia Saudita, Emirati, Giordania…)',
    vaccines_required: ['Meningococco ACWY (obbligatorio per Hajj/Umra)'],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Influenza'],
    malaria: false,
    risks: ['MERS-CoV (cammelli; contatto diretto)', 'Calore estremo (estate)'],
    source: 'WHO MERS-CoV; Saudi Ministry of Health Hajj requirements',
    sourceUrl: 'https://www.who.int/emergencies/mers-cov/en/',
  },
  'europa': {
    label: 'Europa (EU/EEA)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A (Europa est)', 'Encefalite da Zecche TBE (Austria, Germania, Scandinavia, Est Europa)'],
    malaria: false,
    risks: ['Encefalite da Zecche TBE (attività outdoor in foreste)', 'Malattia di Lyme (punture di zecca)'],
    source: 'ECDC Epidemiological Situation Reports; CDC Yellow Book 2024',
    sourceUrl: 'https://www.ecdc.europa.eu/en/tick-borne-encephalitis',
  },
  'oceania': {
    label: 'Oceania (Papua Nuova Guinea, Isole del Pacifico)',
    vaccines_required: [],
    vaccines_recommended: ['Epatite A', 'Epatite B', 'Tifo', 'Febbre Gialla (se proveniente da zona endemica)'],
    malaria: true,
    risks: ['Malaria (Papua NG e alcune isole)', 'Dengue', 'Zika', 'Chikungunya'],
    source: 'CDC Yellow Book 2024; Australian Government Smart Traveller',
    sourceUrl: 'https://wwwnc.cdc.gov/travel/destinations/list',
  },
}

const REALTIME_SOURCES = [
  { name: 'WHO Disease Outbreak News', url: 'https://www.who.int/emergencies/disease-outbreak-news', desc: 'Epidemie in corso nel mondo, aggiornato settimanalmente' },
  { name: 'CDC Traveler Health Notices', url: 'https://wwwnc.cdc.gov/travel/notices', desc: 'Avvisi per i viaggiatori (Level 1-4), aggiornato in tempo reale' },
  { name: 'ECDC Communicable Disease Threats', url: 'https://www.ecdc.europa.eu/en/threats-and-outbreaks', desc: 'Sorveglianza epidemiologica europea' },
  { name: 'HealthMap', url: 'https://healthmap.org/en/', desc: 'Mappa interattiva di focolai globali (aggregatore automatico)' },
  { name: 'Viaggiare Sicuri (MAECI)', url: 'https://www.viaggiaresicuri.it', desc: 'Ministero Esteri italiano: schede paese con situazione sanitaria' },
]

const BLANK = { id: '', destination_key: '', destination_custom: '', country: '', date_from: '', date_to: '', notes: '' }

export default function Viaggi() {
  const [trips, setTrips] = useState(() => lsGet('mcd_viaggi', []))
  const [form, setForm] = useState(null) // null = closed, {} = new, {id} = edit
  const [expandedId, setExpandedId] = useState(null)

  const saveAll = (arr) => { setTrips(arr); lsSet('mcd_viaggi', arr) }

  const openNew = () => setForm({ ...BLANK, id: Date.now().toString() })
  const openEdit = (t) => setForm({ ...t })
  const closeForm = () => setForm(null)

  const submitForm = () => {
    if (!form.destination_key && !form.destination_custom) return
    const isNew = !trips.find(t => t.id === form.id)
    if (isNew) saveAll([...trips, form])
    else saveAll(trips.map(t => t.id === form.id ? form : t))
    setForm(null)
  }

  const deleteTrip = (id) => saveAll(trips.filter(t => t.id !== id))

  const getDestInfo = (t) => DESTINATION_DB[t.destination_key] || null

  const isPast = (t) => t.date_to && t.date_to < new Date().toISOString().slice(0, 10)

  const upcomingTrips = trips.filter(t => !isPast(t)).sort((a, b) => (a.date_from || '').localeCompare(b.date_from || ''))
  const pastTrips = trips.filter(isPast).sort((a, b) => (b.date_from || '').localeCompare(a.date_from || ''))

  const card = { background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: 'var(--sh-sm)', marginBottom: 10 }
  const inputStyle = { padding: '8px 11px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'var(--font-sans)', width: '100%' }
  const labelStyle = { fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, display: 'block', marginBottom: 4 }

  const TripCard = ({ t }) => {
    const info = getDestInfo(t)
    const past = isPast(t)
    const expanded = expandedId === t.id
    const destLabel = info?.label || t.destination_custom || t.destination_key

    return (
      <div style={{ ...card, opacity: past ? 0.8 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }} onClick={() => setExpandedId(expanded ? null : t.id)}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: past ? 'var(--panel-2)' : 'var(--accent-wash)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Plane size={16} style={{ color: past ? 'var(--ink-3)' : 'var(--accent)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14.5 }}>{destLabel}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              {t.date_from && t.date_to ? `${t.date_from} → ${t.date_to}` : t.date_from || t.date_to || 'Date non specificate'}
              {past && <span style={{ marginLeft: 8, color: 'var(--ink-3)', fontStyle: 'italic' }}>· Passato</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); openEdit(t) }} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Modifica</button>
            <button onClick={e => { e.stopPropagation(); deleteTrip(t.id) }} style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid color-mix(in oklab, var(--danger) 25%, var(--hair))', background: 'var(--danger-wash)', color: 'var(--danger-ink)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Trash2 size={14} />
            </button>
            {expanded ? <ChevronUp size={16} style={{ color: 'var(--ink-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--ink-3)' }} />}
          </div>
        </div>

        {expanded && info && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hair-soft)' }}>
            {info.vaccines_required.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--danger)', marginBottom: 6 }}>Obbligatori / Richiesti per ingresso</div>
                {info.vaccines_required.map(r => (
                  <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink)', padding: '4px 0' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} /> {r}
                  </div>
                ))}
              </div>
            )}

            {info.vaccines_recommended.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--warn-ink)', marginBottom: 6 }}>Raccomandati</div>
                {info.vaccines_recommended.map(r => (
                  <div key={r} style={{ fontSize: 13.5, color: 'var(--ink)', padding: '3px 0', paddingLeft: 4 }}>· {r}</div>
                ))}
              </div>
            )}

            {info.malaria && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-wash)', borderRadius: 8, marginBottom: 12, fontSize: 13, color: 'var(--danger-ink)', fontWeight: 500 }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6 }} />
                Rischio malaria presente. Consultare il medico per la profilassi antimalarica (tipo e durata dipendono dalla zona specifica e dal periodo).
              </div>
            )}

            {info.risks.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-3)', marginBottom: 6 }}>Altri rischi sanitari</div>
                {info.risks.map(r => <div key={r} style={{ fontSize: 13, color: 'var(--ink-2)', padding: '2px 0', paddingLeft: 4 }}>· {r}</div>)}
              </div>
            )}

            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              Fonte: {info.source} ·
              <a href={info.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <ExternalLink size={11} /> Dettagli CDC
              </a>
            </div>

            {t.notes && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic' }}>Note: {t.notes}</div>}
          </div>
        )}

        {expanded && !info && t.destination_custom && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hair-soft)', fontSize: 13, color: 'var(--ink-2)' }}>
            Nessuna scheda automatica per questa destinazione. Controlla le fonti in tempo reale qui sotto o su{' '}
            <a href="https://wwwnc.cdc.gov/travel/destinations/list" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>CDC Travelers' Health</a>.
            {t.notes && <div style={{ marginTop: 8, fontStyle: 'italic' }}>Note: {t.notes}</div>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Realtime warning */}
      <div style={{ background: 'var(--warn-wash)', border: '1px solid color-mix(in oklab, var(--warn) 30%, var(--hair))', borderRadius: 'var(--r)', padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12 }}>
        <AlertTriangle size={18} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--warn-ink)', marginBottom: 4 }}>Controlla sempre le informazioni in tempo reale</div>
          <div style={{ fontSize: 12.5, color: 'var(--warn-ink)', lineHeight: 1.5 }}>
            Le schede qui sotto sono basate su dati storici statici (OMS/CDC). Per epidemie recenti (ultimi 6 mesi), focolai attivi, o requisiti di ingresso aggiornati, consulta le fonti live in fondo alla pagina prima di partire.
          </div>
        </div>
      </div>

      {/* Add button */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 'var(--r)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          <Plus size={16} /> Aggiungi viaggio
        </button>
      </div>

      {/* Form */}
      {form && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: '22px', boxShadow: 'var(--sh)', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 18 }}>
            {trips.find(t => t.id === form.id) ? 'Modifica viaggio' : 'Nuovo viaggio'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Area / Destinazione</label>
              <select value={form.destination_key} onChange={e => setForm({ ...form, destination_key: e.target.value, destination_custom: '' })} style={inputStyle}>
                <option value="">— Seleziona area geografica —</option>
                {Object.entries(DESTINATION_DB).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                <option value="">— O inserisci manualmente sotto —</option>
              </select>
            </div>
            {!form.destination_key && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Destinazione personalizzata</label>
                <input type="text" value={form.destination_custom} onChange={e => setForm({ ...form, destination_custom: e.target.value })} placeholder="es. Giordania, Madagascar, Papua Nuova Guinea" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Data partenza</label>
              <input type="date" value={form.date_from} onChange={e => setForm({ ...form, date_from: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Data ritorno</label>
              <input type="date" value={form.date_to} onChange={e => setForm({ ...form, date_to: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Note (tipo di attività, zone specifiche, ecc.)</label>
              <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="es. trekking in zone rurali, safari, visita urbana" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={submitForm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Salva</button>
            <button onClick={closeForm} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--panel-2)', color: 'var(--ink-2)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Annulla</button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingTrips.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>Prossimi viaggi</div>
          {upcomingTrips.map(t => <TripCard key={t.id} t={t} />)}
        </>
      )}

      {/* Past */}
      {pastTrips.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '20px 0 10px' }}>Viaggi passati</div>
          {pastTrips.map(t => <TripCard key={t.id} t={t} />)}
        </>
      )}

      {trips.length === 0 && !form && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 14 }}>
          <Globe size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
          Nessun viaggio registrato. Aggiungi una destinazione per vedere le raccomandazioni sanitarie.
        </div>
      )}

      {/* Realtime sources */}
      <div style={{ marginTop: 32, borderTop: '1px solid var(--hair)', paddingTop: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }}>Fonti in tempo reale — controlla prima di partire</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {REALTIME_SOURCES.map(s => (
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 12, padding: '14px 16px', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--hair)'}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <ExternalLink size={12} /> {s.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{s.desc}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
