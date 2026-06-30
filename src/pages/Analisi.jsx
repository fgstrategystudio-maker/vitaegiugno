import React, { useState, useEffect } from 'react'
import { Brain, RefreshCw, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Info, Save, Trash2, History, Check, Download, Eye } from 'lucide-react'
import { syncKey, loadUserData, getSession } from '../lib/auth'
import { geminiCall } from '../lib/gemini'

// ── Saved analyses storage ────────────────────────────────────────────────────
function loadSaved() {
  try { return JSON.parse(localStorage.getItem('mcd_ai_analyses') || '[]') } catch { return [] }
}
function persistSaved(list) {
  localStorage.setItem('mcd_ai_analyses', JSON.stringify(list))
  syncKey('mcd_ai_analyses', list)
}

// ── PDF download (html2pdf — funziona anche su mobile) ───────────────────────
async function downloadAnalysisPdf(insights, isAI, dateStr) {
  const urgencyLabel = { alta: 'ALTA PRIORITÀ', media: 'MEDIA PRIORITÀ', bassa: 'BASSA PRIORITÀ' }
  const urgencyColor = { alta: '#dc2626', media: '#d97706', bassa: '#2563eb' }
  const date = dateStr ? new Date(dateStr).toLocaleString('it-IT') : new Date().toLocaleString('it-IT')

  const el = document.createElement('div')
  el.innerHTML = `
<div style="font-family: Georgia, serif; color: #1f2937; font-size: 12px; line-height: 1.6; padding: 8px;">
  <h1 style="font-size: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 6px; margin: 0 0 4px;">Analisi AI — Cartella Clinica</h1>
  <div style="font-size: 10px; color: #6b7280; margin-bottom: 14px;">Generata il ${date}</div>
  <div style="display: inline-block; background: #ede9fe; color: #7c3aed; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 20px; margin-bottom: 14px;">${isAI ? '✦ Analisi Gemini AI' : '⊕ Analisi locale'}</div>
  ${insights.map(ins => `
  <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid;">
    <div style="font-size: 9px; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px; color: ${urgencyColor[ins.urgency] || '#6b7280'};">${urgencyLabel[ins.urgency] || (ins.urgency || '').toUpperCase()}</div>
    <div style="font-size: 14px; font-weight: bold; color: #111827; margin-bottom: 6px;">${ins.title || ''}</div>
    <div style="font-size: 11px; line-height: 1.6; color: #374151; margin-bottom: 8px;">${ins.body || ''}</div>
    ${ins.connections?.length ? `<div style="margin-bottom: 8px;">${ins.connections.map(c => `<span style="display: inline-block; font-size: 9px; background: #f3f4f6; border: 1px solid #e5e7eb; color: #6b7280; padding: 1px 7px; border-radius: 20px; margin: 2px;">${c}</span>`).join('')}</div>` : ''}
    ${ins.actions?.length ? `<div style="font-size: 9px; font-weight: bold; letter-spacing: 1px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Cosa fare</div>${ins.actions.map(a => `<div style="font-size: 11px; color: #374151; margin-bottom: 3px;">→ ${a}</div>`).join('')}` : ''}
  </div>`).join('')}
  <div style="margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #9ca3af; text-align: right;">I suggerimenti non sostituiscono il parere medico — Medical Dashboard</div>
</div>`

  const { default: html2pdf } = await import('html2pdf.js')
  await html2pdf().set({
    margin: 10,
    filename: `analisi-ai-${new Date(dateStr || Date.now()).toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css'] },
  }).from(el).save()
}
import * as store from '../store'

// ── Collect all medical data, anonymized ─────────────────────────────────────
function collectData() {
  const episodes   = store.episodes?.all?.()        ?? []
  const watchlist  = store.watchlistStore?.all?.()  ?? []
  const diary      = store.diaryStore?.all?.()      ?? []
  const conditions = store.conditions?.all?.()  ?? []
  const medications= store.medications?.all?.() ?? []

  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch { return [] } }
  const measurements   = lsGet('mcd_measurements')
  const bloodAnalyses  = lsGet('mcd_blood_analyses')
  const screening      = lsGet('mcd_screening')

  const MARKER_NAMES = {
    rbc:'Globuli Rossi', wbc:'Globuli Bianchi', hgb:'Emoglobina', hct:'Ematocrito',
    plt:'Piastrine', mcv:'MCV', glucose:'Glicemia', chol_tot:'Colesterolo Tot.',
    hdl:'HDL', ldl:'LDL', trig:'Trigliceridi', ast:'AST', alt:'ALT', ggt:'GGT',
    bili:'Bilirubina', creat:'Creatinina', urea:'Urea', uricacid:'Ac. Urico',
    egfr:'eGFR', ferritin:'Ferritina', iron:'Sideremia', transf:'Transferrina',
    tsh:'TSH', ft3:'FT3', ft4:'FT4', pcr:'PCR', ves:'VES', fibr:'Fibrinogeno',
    vitd:'Vit. D', b12:'Vit. B12', folate:'Folati', magnes:'Magnesio',
  }

  return {
    episodi: episodes.map(e => ({
      tipo: e.type, zona: e.body_area, diagnosi: e.diagnosis,
      sintomi: e.symptoms, esito: e.outcome,
      data_inizio: e.start_date, data_fine: e.end_date,
      giorni_stop: e.stop_days, note: e.notes,
    })),
    sintomi_watchlist: watchlist.map(w => ({
      titolo: w.title || w.name, zona: w.body_area,
      contesto: w.context, trigger: w.trigger,
      stato: w.status, data: w.date_noticed, note: w.notes,
    })),
    diario: diary.slice(-30).map(d => ({
      data: d.date, umore: d.mood, energia: d.energy,
      parole_chiave: (d.content || '').toLowerCase().split(' ')
        .filter(w => ['stress','ansia','dolore','stanco','male','pesante','male','affaticato','insonnia','nervoso','teso'].includes(w)),
    })).filter(d => d.parole_chiave.length > 0 || d.umore || d.energia),
    patologie: conditions.map(c => ({ nome: c.name, tipo: c.type, cronica: c.chronic })),
    farmaci_attivi: medications.filter(m => m.active !== false).map(m => ({ nome: m.name, dose: m.dosage, frequenza: m.frequency })),
    misurazioni: measurements.slice(-50).map(m => ({ tipo: m.type, valore: m.value, valore2: m.value2, data: m.date })),
    analisi_sangue: bloodAnalyses.map(a => ({
      data: a.date, laboratorio: a.lab, note: a.note,
      valori: Object.fromEntries(
        Object.entries(a.values || {})
          .filter(([, v]) => v !== '' && v != null)
          .map(([k, v]) => [MARKER_NAMES[k] || k, v])
      )
    })),
    screening: screening.map(s => ({
      nome: s.name, categoria: s.category,
      ultima: s.last_date, prossimo: s.next_date,
    })),
  }
}

// ── Rule-based fallback ───────────────────────────────────────────────────────
function analyzeLocal(data) {
  const insights = []
  const episodes = data.episodi || []
  const watchlist = data.sintomi_watchlist || []

  const ankleEps = episodes.filter(e => e.zona?.toLowerCase().includes('caviglia') || e.zona?.toLowerCase().includes('piede'))
  const calvEps  = episodes.filter(e => e.zona?.toLowerCase().includes('polpaccio') || e.zona?.toLowerCase().includes('coscia'))
  if (ankleEps.length >= 2 && calvEps.length >= 1) {
    insights.push({
      urgency: 'alta', title: 'Schema a cascata caviglia → gamba',
      body: 'Hai avuto più episodi alla caviglia seguiti da problemi al polpaccio/coscia. Classico schema di compensazione: dopo una distorsione la caviglia rimane instabile, il corpo cambia la biomeccanica e sovraccarca i muscoli superiori.',
      actions: ['Valutare propriocezione con fisioterapista', 'Rinforzo del tibiale anteriore', 'Verificare cicatrizzazione completa prima di rientrare all\'attività'],
    })
  }

  const earSymptoms = watchlist.filter(w => w.titolo?.toLowerCase().includes('orecch') || w.titolo?.toLowerCase().includes('acufen'))
  if (earSymptoms.length >= 1) {
    const hasSauna = earSymptoms.some(w => w.contesto?.toLowerCase().includes('sauna'))
    insights.push({
      urgency: earSymptoms.length > 1 ? 'alta' : 'media',
      title: 'Sintomi auricolari — possibile correlazione pressione',
      body: `Hai annotato sintomi alle orecchie (${earSymptoms.map(w=>w.titolo).join(', ')}).${hasSauna?' Il contesto sauna è rilevante: il calore causa vasodilatazione e può aumentare la pressione nell\'orecchio interno.':''} La pulsazione auricolare è spesso il primo segnale di picchi pressori.`,
      actions: ['Misura la pressione in diversi momenti della giornata', 'Consulta il medico per escludere ipertensione', hasSauna?'Evita la sauna finché il quadro non è chiaro':'Tieni un diario degli episodi'],
    })
  }

  const zoneCounts = {}
  episodes.forEach(e => { if (e.zona) zoneCounts[e.zona] = (zoneCounts[e.zona] || 0) + 1 })
  Object.entries(zoneCounts).filter(([,n]) => n >= 3).forEach(([zona, n]) => {
    insights.push({
      urgency: 'media', title: `Zona ${zona}: ${n} episodi ricorrenti`,
      body: `La zona "${zona}" compare in ${n} episodi separati. La ricorrenza può indicare debolezza strutturale non risolta o microtraumi cumulativi.`,
      actions: ['Ecografia o RX di controllo', 'Fisioterapia preventiva focalizzata', 'Verifica se stagionale o legato a un\'attività specifica'],
    })
  })

  if (insights.length === 0) {
    insights.push({
      urgency: 'bassa', title: 'Nessun pattern critico rilevato',
      body: 'Con i dati attuali non emergono pattern preoccupanti. Aggiungi Gemini API key per un\'analisi più approfondita.',
      actions: ['Inserisci la chiave Gemini in Impostazioni per l\'analisi AI completa', 'Continua a registrare episodi e misurazioni'],
    })
  }

  return insights
}

// ── Gemini call ───────────────────────────────────────────────────────────────
async function analyzeWithGemini(data) {
  const prompt = `Sei un medico specialista in medicina interna con competenze in fisiatria, otorinolaringoiatria e medicina preventiva. Stai facendo una revisione clinica approfondita della cartella di un paziente.

Il tuo compito NON è elencare i problemi già noti al paziente — quelli li conosce già. Ragiona come un medico di medicina interna con visione sistemica dell'intero organismo, non come uno specialista che guarda solo il suo reparto.

**APPROCCIO RICHIESTO — Medicina dei sistemi:**
Ogni organo e apparato comunica con gli altri. Il tuo valore aggiunto è trovare connessioni che nessun singolo specialista vede perché ognuno guarda solo la sua area. Esempi del tipo di ragionamento che voglio:
- Sintomi cardiovascolari (pressione, acufene pulsatile, tachicardia) → potrebbero riflettere disfunzione del SNC, ipertensione endocranica, o asse ipotalamo-ipofisi-surrene
- Infiammazione cronica in zona X → può alzare PCR/VES → aumenta rischio cardiovascolare e neurodegenerativo a lungo termine
- Infortuni muscoloscheletrici ricorrenti → potrebbero indicare carenza di micronutrienti (vit D, magnesio, ferro) → correlazione con analisi sangue disponibili
- Sintomi ORL (orecchio, naso, gola) → possibile connessione con reflusso gastroesofageo, pressione intracranica, o disfunzione della tuba di Eustachio legata a infiammazione sistemica
- Problemi digestivi/perineali ricorrenti → asse intestino-cervello, disbiosi, impatto su umore e sistema immunitario
- Pattern di stanchezza + valori ematici borderline → possibile disfunzione tiroidea subclinica o anemia funzionale non ancora diagnosticata

**IL TUO COMPITO:**
1. **Cross-system analysis**: per ogni problema presente, chiediti quali altri sistemi potrebbero essere coinvolti come causa o conseguenza. Non fermarti al sintomo superficiale.
2. **Predizione rischi futuri**: basandoti sui pattern storici, cosa potrebbe insorgere nei prossimi 6-24 mesi se non gestito? Meccanismo fisiopatologico specifico.
3. **Segnali deboli combinati**: dati che da soli sembrano OK ma insieme disegnano un quadro preoccupante.
4. **Lacune diagnostiche**: cosa non è stato ancora escluso che sarebbe ragionevole controllare dati questi pattern?
5. **Effetti a cascata non trattati**: un problema non risolto completamente sta silenziosamente danneggiando qualcos'altro?

REGOLE FONDAMENTALI:
- NON ripetere diagnosi già note come insight (es. "hai la cisti aracnoidea" non è un insight, è già noto)
- OGNI insight deve contenere il meccanismo fisiologico della connessione cross-sistema
- Sii diretto come un medico che parla a un paziente intelligente — no banalità, no frasi di circostanza
- Se i dati sono insufficienti per un insight solido, non inventare — segnala cosa manca e perché sarebbe utile saperlo
- Priorità ALTA = azione entro settimane; MEDIA = entro 3-6 mesi; BASSA = monitoraggio annuale

REGOLE SULLE FONTI (OBBLIGATORIO):
- OGNI connessione clinica deve essere supportata da dati epidemiologici o linee guida pubblicate
- Nel campo "source" inserisci SEMPRE: nome dello studio/linea guida + anno + statistica chiave (es. prevalenza, OR, HR, NNT)
- Esempi accettabili: "Linee guida ESC 2023 — rischio CV aumentato del 40% in pazienti con PCR >3 mg/L"; "NEJM 2021 — associazione tra carenza VitD (<20 ng/mL) e 2.3x aumento fratture da stress"
- NON citare connessioni come "possibile correlazione" senza un dato numerico che la supporti
- Se non esiste evidenza pubblicata con statistica certa per una connessione, NON includerla nell'analisi

DATI PAZIENTE (anonimizzati, in italiano):
${JSON.stringify(data, null, 2)}

Rispondi SOLO con un array JSON valido, senza testo extra:
[
  {
    "urgency": "alta|media|bassa",
    "title": "titolo clinico preciso, non generico",
    "body": "spiegazione del meccanismo fisiologico, delle connessioni trovate e del rischio futuro. 3-5 frasi, linguaggio medico ma comprensibile. NON iniziare con 'Il paziente...'",
    "source": "Studio/linea guida specifica, anno — statistica chiave che giustifica questa connessione",
    "actions": ["azione specifica 1 (con specialista/esame preciso se applicabile)", "azione 2", "azione 3"],
    "connections": ["dato1 → dato2 → rischio3"]
  }
]

Genera 4-8 insight. Qualità > quantità. Se hai meno di 4 insight con evidenza pubblicata solida, genera solo quelli supportati da dati.`

  let availableModel = null
  for (const version of ['v1beta', 'v1']) {
    try {
      const r = await geminiCall(`${version}/models`)
      if (!r.ok) continue
      const data2 = await r.json()
      const found = (data2.models || []).find(m =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        !m.name.includes('embedding') && !m.name.includes('aqa')
      )
      if (found) { availableModel = { version, model: found.name.replace('models/', '') }; break }
    } catch { /* ignore */ }
  }

  const ATTEMPTS = availableModel ? [availableModel] : [
    { version: 'v1beta', model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
    { version: 'v1',     model: 'gemini-2.0-flash' },
    { version: 'v1beta', model: 'gemini-1.5-flash' },
    { version: 'v1',     model: 'gemini-1.5-flash' },
  ]
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  const isOverload = (msg) => /high demand|try again|overload|quota|rate.limit|529|503/i.test(msg)

  let lastErr = 'Nessun modello disponibile'
  for (const { version, model } of ATTEMPTS) {
    const MAX_RETRIES = 3
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await geminiCall(`${version}/models/${model}:generateContent`, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          }
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          const msg = e?.error?.message || `HTTP ${res.status}`
          lastErr = `${msg} (${version}/${model})`
          if (isOverload(msg) && attempt < MAX_RETRIES - 1) {
            await sleep([8000, 16000, 30000][attempt])
            continue
          }
          break
        }
        const json = await res.json()
        const candidate = json.candidates?.[0]
        const text = candidate?.content?.parts?.[0]?.text || ''
        if (!text) { lastErr = `Risposta vuota (finishReason: ${candidate?.finishReason || 'n/a'})`; break }
        const start = text.indexOf('[')
        const end = text.lastIndexOf(']')
        if (start === -1 || end <= start) { lastErr = `Nessun array JSON trovato. Risposta: "${text.slice(0, 150)}"`; break }
        try { return JSON.parse(text.slice(start, end + 1)) } catch(pe) { lastErr = `JSON non valido: ${pe.message}`; break }
      } catch(e) {
        lastErr = e.message
        if (isOverload(e.message) && attempt < MAX_RETRIES - 1) {
          await sleep([8000, 16000, 30000][attempt])
          continue
        }
        break
      }
    }
  }
  throw new Error(lastErr)
}

// ── UI components ─────────────────────────────────────────────────────────────
const URGENCY = {
  alta:  { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',    text: 'text-red-700',    label: 'ALTA'  },
  media: { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500',  text: 'text-amber-700',  label: 'MEDIA' },
  bassa: { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-400',   text: 'text-blue-700',   label: 'BASSA' },
}

function InsightCard({ insight, isAI }) {
  const [open, setOpen] = useState(false)
  const u = URGENCY[insight.urgency] || URGENCY.bassa
  return (
    <div className={`rounded-2xl border ${u.bg} ${u.border} mb-3 overflow-hidden`}>
      <button className="w-full text-left px-5 py-4" onClick={() => setOpen(v => !v)}>
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${u.dot} mt-1.5 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] font-bold uppercase tracking-widest ${u.text} mb-1 flex items-center gap-1.5`}>
              Priorità {u.label}
              {isAI && <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold normal-case tracking-normal">AI</span>}
            </div>
            <div className="font-semibold text-gray-800 text-sm leading-snug">{insight.title}</div>
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-black/5">
          <p className="text-sm text-gray-700 leading-relaxed mt-3 mb-4">{insight.body}</p>
          {insight.connections?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {insight.connections.map((c, i) => (
                <span key={i} className="text-xs bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          )}
          {insight.actions?.length > 0 && (
            <>
              <div className="font-semibold text-xs text-gray-500 uppercase tracking-wide mb-2">Cosa fare</div>
              <ul className="space-y-1.5">
                {insight.actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">→</span>{a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Saved analysis card ───────────────────────────────────────────────────────
function SavedAnalysisCard({ saved, onDelete, onRead }) {
  const [open, setOpen] = useState(false)
  const alta  = saved.insights.filter(i => i.urgency === 'alta').length
  const media = saved.insights.filter(i => i.urgency === 'media').length
  const bassa = saved.insights.filter(i => i.urgency === 'bassa').length
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3">
      <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={() => setOpen(v => !v)}>
        <History size={14} className="text-violet-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-700 truncate">
            {saved.label || new Date(saved.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {saved.isAI && <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-semibold">AI</span>}
            <span className="text-[11px] text-red-500 font-medium">{alta} alta</span>
            <span className="text-[11px] text-amber-500 font-medium">{media} media</span>
            <span className="text-[11px] text-blue-500 font-medium">{bassa} bassa</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onRead(saved) }}
            className="p-2 text-gray-300 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50"
            title="Visualizza analisi"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); downloadAnalysisPdf(saved.insights, saved.isAI, saved.date) }}
            className="p-2 text-gray-300 hover:text-violet-500 transition-colors rounded-lg hover:bg-violet-50"
            title="Scarica PDF"
          >
            <Download size={15} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Eliminare questa analisi salvata?')) onDelete(saved.id) }}
            className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>
          {open
            ? <ChevronUp size={15} className="text-gray-400 ml-0.5" />
            : <ChevronDown size={15} className="text-gray-400 ml-0.5" />
          }
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
          {saved.insights.map((ins, i) => <InsightCard key={i} insight={ins} isAI={saved.isAI} />)}
        </div>
      )}
    </div>
  )
}

// ── Fullscreen reader overlay ─────────────────────────────────────────────────
function ReaderOverlay({ insights, isAI, date, onClose }) {
  const urgencyLabel = { alta: 'ALTA PRIORITÀ', media: 'MEDIA PRIORITÀ', bassa: 'BASSA PRIORITÀ' }
  const urgencyColor = { alta: 'text-red-600', media: 'text-amber-600', bassa: 'text-blue-600' }
  const urgencyBg    = { alta: 'bg-red-50 border-red-200', media: 'bg-amber-50 border-amber-200', bassa: 'bg-blue-50 border-blue-200' }
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="px-5 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-2 border-violet-500 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analisi AI</h1>
            <p className="text-sm text-gray-500 mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-200 px-3 py-2 rounded-xl">
            Chiudi
          </button>
        </div>
        {isAI && (
          <div className="inline-block bg-violet-100 text-violet-700 text-sm font-semibold px-3 py-1 rounded-full mb-5">
            ✦ Analisi Gemini AI
          </div>
        )}
        {/* Insights */}
        {insights.map((ins, i) => (
          <div key={i} className={`rounded-2xl border ${urgencyBg[ins.urgency] || 'bg-gray-50 border-gray-200'} mb-5 p-5`}>
            <div className={`text-xs font-bold uppercase tracking-widest ${urgencyColor[ins.urgency] || 'text-gray-600'} mb-2`}>
              {urgencyLabel[ins.urgency] || ins.urgency}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{ins.title}</h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">{ins.body}</p>
            {ins.source && (
              <div className="text-xs text-gray-400 italic mb-3 border-l-2 border-gray-200 pl-3">Fonte: {ins.source}</div>
            )}
            {ins.connections?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ins.connections.map((c, j) => (
                  <span key={j} className="text-xs bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            )}
            {ins.actions?.length > 0 && (
              <>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cosa fare</div>
                <ul className="space-y-2">
                  {ins.actions.map((a, j) => (
                    <li key={j} className="flex items-start gap-2 text-base text-gray-700">
                      <span className="text-gray-400 mt-0.5 flex-shrink-0">→</span>{a}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
        <p className="text-xs text-gray-400 text-center mt-4">I suggerimenti non sostituiscono il parere medico</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analisi() {
  const [insights,  setInsights]  = useState([])
  const [loading,   setLoading]   = useState(false)
  const [isAI,      setIsAI]      = useState(false)
  const [ran,       setRan]       = useState(false)
  const [error,     setError]     = useState('')
  const [loadMsg,   setLoadMsg]   = useState('')
  const [saved,     setSaved]     = useState(loadSaved)
  const [justSaved, setJustSaved] = useState(false)
  const [reader,    setReader]    = useState(null) // { insights, isAI, date }

  // Al mount: sincronizza dati locali → Supabase, poi carica da Supabase → localStorage
  useEffect(() => {
    const session = getSession()
    if (!session?.userId) { setSaved(loadSaved()); return }

    // Se ci sono analisi in localStorage che non sono in Supabase, sincronizzale subito
    const local = loadSaved()
    if (local.length > 0) {
      syncKey('mcd_ai_analyses', local)
    }

    // Poi ricarica da Supabase per avere i dati di altri dispositivi
    loadUserData(session.userId).then(() => setSaved(loadSaved()))
  }, [])

  const hasGemini = true // chiave Gemini condivisa lato server

  const run = async () => {
    setLoading(true); setRan(false); setError(''); setInsights([]); setJustSaved(false)
    const data = collectData()
    if (hasGemini) {
      setLoadMsg('Gemini AI sta analizzando i tuoi dati…')
      const retryMsg = setTimeout(() => setLoadMsg('Server occupato, riprovo automaticamente (può richiedere fino a 1 min)…'), 9000)
      try {
        const result = await analyzeWithGemini(data)
        clearTimeout(retryMsg)
        setInsights(result); setIsAI(true)
      } catch (err) {
        clearTimeout(retryMsg)
        setError(`Errore Gemini: ${err.message}. Mostro analisi locale.`)
        setInsights(analyzeLocal(data)); setIsAI(false)
      }
    } else {
      setLoadMsg('Analisi pattern in corso…')
      await new Promise(r => setTimeout(r, 1200))
      setInsights(analyzeLocal(data)); setIsAI(false)
    }
    setLoading(false); setRan(true); setLoadMsg('')
  }

  const handleSave = () => {
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      insights,
      isAI,
      label: new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }
    const next = [entry, ...saved]
    setSaved(next); persistSaved(next); setJustSaved(true)
  }

  const handleDelete = (id) => {
    const next = saved.filter(s => s.id !== id)
    setSaved(next); persistSaved(next)
  }

  const alta  = insights.filter(i => i.urgency === 'alta').length
  const media = insights.filter(i => i.urgency === 'media').length
  const bassa = insights.filter(i => i.urgency === 'bassa').length

  return (
    <>
    {reader && <ReaderOverlay insights={reader.insights} isAI={reader.isAI} date={reader.date} onClose={() => setReader(null)} />}
    <div>
      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
          🧠
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">Analisi AI</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {hasGemini ? '🟢 Gemini attivo — prova modelli 2025' : '⚪ Configura Gemini in Impostazioni'}
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-sm disabled:opacity-60 active:scale-[0.98] text-xs flex-shrink-0"
        >
          {loading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? 'Analisi…' : ran ? 'Riesegui' : 'Analizza i miei dati'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* ── Feature card (no analysis run yet) ── */}
      {!ran && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Brain size={24} className="text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 mb-1 leading-snug">
                {hasGemini ? 'Gemini AI pronto — analisi cross-sistema' : 'Analisi pattern clinici'}
              </p>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {hasGemini
                  ? 'Collega episodi, sintomi, analisi sangue e misurazioni per trovare correlazioni tra apparati che nessun singolo specialista vede.'
                  : "Aggiungi la chiave Gemini in Impostazioni per l'analisi AI completa."}
              </p>
              <button
                onClick={run}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all shadow-sm disabled:opacity-60 active:scale-[0.98] text-sm"
              >
                <Sparkles size={14} /> Analizza ora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm mb-4">
          <RefreshCw size={24} className="animate-spin text-violet-500 mx-auto mb-2" />
          <div className="text-sm text-gray-500 font-medium mb-1">{loadMsg}</div>
          <div className="text-xs text-gray-400">I dati personali non vengono mai inviati</div>
        </div>
      )}

      {/* ── Results ── */}
      {ran && !loading && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isAI ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
              {isAI ? <><Sparkles size={11} /> Gemini AI</> : <><Brain size={11} /> Analisi locale</>}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Info size={11} />{new Date().toLocaleDateString('it-IT')}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-center">
              <div className="text-xl font-bold text-red-600">{alta}</div>
              <div className="text-[11px] text-red-500 font-medium">Alta</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
              <div className="text-xl font-bold text-amber-600">{media}</div>
              <div className="text-[11px] text-amber-500 font-medium">Media</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
              <div className="text-xl font-bold text-blue-600">{bassa}</div>
              <div className="text-[11px] text-blue-500 font-medium">Bassa</div>
            </div>
          </div>

          {insights.map((ins, i) => <InsightCard key={i} insight={ins} isAI={isAI} />)}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setReader({ insights, isAI, date: new Date().toLocaleString('it-IT') })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Eye size={14} /> Visualizza
            </button>
            <button
              onClick={() => downloadAnalysisPdf(insights, isAI, null)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> Scarica
            </button>
            {justSaved ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-green-600 bg-green-50 border border-green-200">
                <Check size={14} /> Salvata
              </div>
            ) : (
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors"
              >
                <Save size={14} /> Salva
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Storico — sempre visibile ── */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-3">
          <History size={13} className="text-violet-400" />
          <h2 className="text-sm font-bold text-gray-700">Analisi salvate</h2>
          <span className="ml-auto text-xs text-gray-400">{saved.length}</span>
        </div>
        {saved.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-5 text-center text-sm text-gray-400">
            Nessuna analisi salvata
          </div>
        ) : (
          saved.map(s => <SavedAnalysisCard key={s.id} saved={s} onDelete={handleDelete} onRead={s => setReader({ insights: s.insights, isAI: s.isAI, date: new Date(s.date).toLocaleString('it-IT') })} />)
        )}
      </div>
    </div>
    </>
  )
}
