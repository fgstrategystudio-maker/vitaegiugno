import React, { useState, useRef } from 'react'
import { Plus, Upload, Camera, ChevronDown, ChevronUp, X, Microscope, Sparkles, Loader2 } from 'lucide-react'
import { geminiCall } from '../lib/gemini'

const MARKERS = [
  { group: 'Emocromo', color: '#ef4444', items: [
    { id: 'rbc',  label: 'Globuli Rossi',    unit: 'M/μL',  refMin: 4.2,  refMax: 5.4  },
    { id: 'wbc',  label: 'Globuli Bianchi',  unit: 'K/μL',  refMin: 4.0,  refMax: 10.0 },
    { id: 'hgb',  label: 'Emoglobina',       unit: 'g/dL',  refMin: 12.0, refMax: 17.5 },
    { id: 'hct',  label: 'Ematocrito',       unit: '%',     refMin: 37,   refMax: 52   },
    { id: 'plt',  label: 'Piastrine',        unit: 'K/μL',  refMin: 150,  refMax: 400  },
    { id: 'mcv',  label: 'MCV',              unit: 'fL',    refMin: 80,   refMax: 100  },
  ]},
  { group: 'Metabolismo', color: '#f59e0b', items: [
    { id: 'glucose',   label: 'Glicemia',           unit: 'mg/dL', refMin: 70,  refMax: 100 },
    { id: 'chol_tot',  label: 'Colesterolo Totale', unit: 'mg/dL', refMin: 0,   refMax: 200 },
    { id: 'hdl',       label: 'HDL',                unit: 'mg/dL', refMin: 40,  refMax: 999 },
    { id: 'ldl',       label: 'LDL',                unit: 'mg/dL', refMin: 0,   refMax: 130 },
    { id: 'trig',      label: 'Trigliceridi',       unit: 'mg/dL', refMin: 0,   refMax: 150 },
    { id: 'insulin',   label: 'Insulina',           unit: 'μU/mL', refMin: 2,   refMax: 25  },
  ]},
  { group: 'Fegato', color: '#a78bfa', items: [
    { id: 'ast',   label: 'AST (GOT)',    unit: 'U/L',   refMin: 0,  refMax: 40  },
    { id: 'alt',   label: 'ALT (GPT)',    unit: 'U/L',   refMin: 0,  refMax: 40  },
    { id: 'ggt',   label: 'GGT',         unit: 'U/L',   refMin: 0,  refMax: 55  },
    { id: 'bili',  label: 'Bilirubina T',unit: 'mg/dL', refMin: 0,  refMax: 1.2 },
  ]},
  { group: 'Reni', color: '#06b6d4', items: [
    { id: 'creat',    label: 'Creatinina',  unit: 'mg/dL', refMin: 0.6, refMax: 1.2 },
    { id: 'urea',     label: 'Urea (BUN)', unit: 'mg/dL', refMin: 15,  refMax: 50  },
    { id: 'uricacid', label: 'Acido Urico',unit: 'mg/dL', refMin: 2.4, refMax: 7.0 },
    { id: 'egfr',     label: 'eGFR',       unit: 'mL/min',refMin: 60,  refMax: 999 },
  ]},
  { group: 'Ferro', color: '#f97316', items: [
    { id: 'ferritin', label: 'Ferritina',   unit: 'ng/mL', refMin: 12,  refMax: 300 },
    { id: 'iron',     label: 'Sideremia',   unit: 'μg/dL', refMin: 60,  refMax: 170 },
    { id: 'transf',   label: 'Transferrina',unit: 'mg/dL', refMin: 200, refMax: 360 },
  ]},
  { group: 'Tiroide', color: '#10b981', items: [
    { id: 'tsh', label: 'TSH',  unit: 'mIU/L', refMin: 0.4, refMax: 4.0 },
    { id: 'ft3', label: 'FT3',  unit: 'pg/mL', refMin: 2.0, refMax: 4.4 },
    { id: 'ft4', label: 'FT4',  unit: 'ng/dL', refMin: 0.8, refMax: 1.8 },
  ]},
  { group: 'Infiammazione', color: '#ec4899', items: [
    { id: 'pcr',  label: 'PCR',        unit: 'mg/L',  refMin: 0, refMax: 5  },
    { id: 'ves',  label: 'VES',        unit: 'mm/h',  refMin: 0, refMax: 20 },
    { id: 'fibr', label: 'Fibrinogeno',unit: 'mg/dL', refMin: 200, refMax: 400 },
  ]},
  { group: 'Vitamine & Minerali', color: '#8b5cf6', items: [
    { id: 'vitd', label: 'Vitamina D',  unit: 'ng/mL', refMin: 30,  refMax: 100 },
    { id: 'b12',  label: 'Vitamina B12',unit: 'pg/mL', refMin: 200, refMax: 900 },
    { id: 'folate',label: 'Folati',    unit: 'ng/mL', refMin: 4,   refMax: 20  },
    { id: 'magnes',label: 'Magnesio',  unit: 'mg/dL', refMin: 1.7, refMax: 2.2 },
  ]},
]

const ALL_MARKERS = MARKERS.flatMap(g => g.items)
const LS_KEY = 'mcd_blood_analyses'

const SEED_ANALYSIS = {
  id: 'seed_maggio2026',
  date: '2026-05-21',
  lab: 'Ospedale Sandro Pertini — ASL Roma 2',
  note: 'Emocromo completo + sierologia + immunoematologia',
  image: null,
  values: {
    alt: '29', ast: '28', glucose: '80', chol_tot: '194',
    hdl: '62', ldl: '103', trig: '144', creat: '1', urea: '26',
    iron: '99', transf: '313',
    wbc: '4.29', rbc: '5.66', hgb: '16.2', hct: '49.8',
    mcv: '87.9', plt: '154',
  }
}

function lsLoad() {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY))
    if (Array.isArray(data) && data.length > 0) return data
    // First run: seed with maggio 2026 referto
    const seeded = [SEED_ANALYSIS]
    localStorage.setItem(LS_KEY, JSON.stringify(seeded))
    return seeded
  } catch { return [] }
}
function lsSave(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)) }

const GEMINI_PROMPT = `Analizza questa immagine di un referto di analisi del sangue.
Estrai TUTTI i valori presenti e restituisci SOLO un oggetto JSON valido (nessun testo extra) con questa struttura:
{
  "values": {
    "rbc": "valore o null",
    "wbc": "valore o null",
    "hgb": "valore o null",
    "hct": "valore o null",
    "plt": "valore o null",
    "mcv": "valore o null",
    "glucose": "valore o null",
    "chol_tot": "valore o null",
    "hdl": "valore o null",
    "ldl": "valore o null",
    "trig": "valore o null",
    "insulin": "valore o null",
    "ast": "valore o null",
    "alt": "valore o null",
    "ggt": "valore o null",
    "bili": "valore o null",
    "creat": "valore o null",
    "urea": "valore o null",
    "uricacid": "valore o null",
    "egfr": "valore o null",
    "ferritin": "valore o null",
    "iron": "valore o null",
    "transf": "valore o null",
    "tsh": "valore o null",
    "ft3": "valore o null",
    "ft4": "valore o null",
    "pcr": "valore o null",
    "ves": "valore o null",
    "fibr": "valore o null",
    "vitd": "valore o null",
    "b12": "valore o null",
    "folate": "valore o null",
    "magnes": "valore o null"
  },
  "lab": "nome del laboratorio se visibile o null",
  "date": "data del referto in formato YYYY-MM-DD se visibile o null"
}
Usa solo numeri come valori (senza unità di misura). Se un valore non è presente nel referto metti null.`

async function extractWithGemini(base64Image, mimeType = 'image/jpeg') {
  const base64Data = base64Image.split(',')[1] || base64Image

  const body = {
    contents: [{
      parts: [
        { text: GEMINI_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Data } }
      ]
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 1024 }
  }

  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-pro']
  let data = null
  let lastErr = 'Nessun modello disponibile'
  for (const model of MODELS) {
    try {
      const res = await geminiCall(`v1beta/models/${model}:generateContent`, body)
      if (!res.ok) { const e = await res.json(); lastErr = e?.error?.message || `HTTP ${res.status}`; continue }
      data = await res.json()
      break
    } catch(e) { lastErr = e.message }
  }
  if (!data) throw new Error(lastErr)

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Risposta AI non valida')

  const parsed = JSON.parse(jsonMatch[0])
  const cleanValues = {}
  for (const [k, v] of Object.entries(parsed.values || {})) {
    if (v !== null && v !== '' && v !== 'null') cleanValues[k] = String(v)
  }
  return { values: cleanValues, lab: parsed.lab || null, date: parsed.date || null }
}

function getStatus(val, refMin, refMax) {
  if (val === '' || val == null) return 'empty'
  const v = parseFloat(val)
  if (isNaN(v)) return 'empty'
  if (v < refMin) return 'low'
  if (v > refMax) return 'high'
  return 'normal'
}

const ST = {
  normal: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', label: 'Normale' },
  low:    { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', label: 'Basso'   },
  high:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', label: 'Alto'    },
  empty:  { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8', label: ''        },
}

function StatusBadge({ val, refMin, refMax }) {
  const st = getStatus(val, refMin, refMax)
  if (st === 'empty') return null
  const s = ST[st]
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

export default function AnalisiSangue() {
  const [analyses, setAnalyses] = useState(lsLoad)
  const [showForm, setShowForm]   = useState(false)
  const [compareIds, setCompareIds] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [openGroups, setOpenGroups] = useState(['Emocromo', 'Metabolismo'])
  const [formDate, setFormDate]   = useState(new Date().toISOString().slice(0, 10))
  const [formLab,  setFormLab]    = useState('')
  const [formNote, setFormNote]   = useState('')
  const [formVals, setFormVals]   = useState({})
  const [formImg,    setFormImg]    = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState('')
  const fileRef   = useRef()
  const cameraRef = useRef()

  const hasGeminiKey = true // chiave Gemini condivisa lato server

  const handleImg = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      setFormImg(base64)
      if (hasGeminiKey) {
        setExtracting(true)
        setExtractMsg('')
        try {
          const result = await extractWithGemini(base64, file.type)
          if (result) {
            setFormVals(prev => ({ ...prev, ...result.values }))
            if (result.lab && !formLab) setFormLab(result.lab)
            if (result.date) setFormDate(result.date)
            const count = Object.keys(result.values).length
            setExtractMsg(`✓ Estratti ${count} valori automaticamente`)
          }
        } catch (err) {
          setExtractMsg(`Errore estrazione: ${err.message}`)
        }
        setExtracting(false)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const toggleGroup = (g) =>
    setOpenGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const handleSave = () => {
    const a = { id: Date.now().toString(), date: formDate, lab: formLab, note: formNote, image: formImg, values: formVals }
    const updated = [a, ...analyses]
    lsSave(updated)
    setAnalyses(updated)
    setShowForm(false)
    setFormVals({}); setFormDate(new Date().toISOString().slice(0, 10))
    setFormLab(''); setFormNote(''); setFormImg(null)
  }

  const handleDelete = (id) => {
    if (!window.confirm('Eliminare questa analisi?')) return
    const updated = analyses.filter(a => a.id !== id)
    lsSave(updated); setAnalyses(updated)
    setCompareIds(prev => prev.filter(i => i !== id))
  }

  const toggleCompare = (id) =>
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id)
        : prev.length >= 2 ? [prev[1], id]
        : [...prev, id]
    )

  const cmpA = analyses.find(a => a.id === compareIds[0])
  const cmpB = analyses.find(a => a.id === compareIds[1])

  const countFilled = (vals) => Object.values(vals || {}).filter(v => v !== '').length
  const countAbnormal = (vals) =>
    ALL_MARKERS.filter(m => {
      const st = getStatus(vals?.[m.id], m.refMin, m.refMax)
      return st === 'low' || st === 'high'
    }).length

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-xl shadow-sm">🩸</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Analisi del Sangue</h1>
              <p className="text-xs text-gray-400 mt-0.5">Carica referti e confronta i valori nel tempo</p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm">
          <Plus size={16} /> Nuova analisi
        </button>
      </div>

      {/* AI banner */}
      <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 flex gap-3 items-start">
        <Sparkles size={18} className="text-violet-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-violet-800">Estrazione automatica AI (opzionale)</div>
          <div className="text-xs text-violet-600 mt-0.5">
            Carica la foto del referto. Con una <strong>Google Gemini API key gratuita</strong> i valori vengono estratti automaticamente.
            Senza chiave puoi inserire i valori manualmente — i dati rimangono sempre sul tuo dispositivo.
          </div>
        </div>
      </div>

      {/* Comparison panel */}
      {compareIds.length === 2 && cmpA && cmpB && (
        <div className="mb-6 bg-white rounded-xl border border-violet-200 overflow-hidden shadow-sm">
          <div className="bg-violet-50 px-5 py-3 flex flex-wrap items-center gap-2 border-b border-violet-100">
            <span className="font-semibold text-violet-800 text-sm">Confronto</span>
            <span className="text-violet-500 text-xs">
              {new Date(cmpA.date).toLocaleDateString('it-IT')} → {new Date(cmpB.date).toLocaleDateString('it-IT')}
            </span>
            <button onClick={() => setCompareIds([])} className="ml-auto text-violet-400 hover:text-violet-600">
              <X size={15} />
            </button>
          </div>
          {MARKERS.map(group => {
            const relevantItems = group.items.filter(m => {
              const vA = cmpA.values?.[m.id]; const vB = cmpB.values?.[m.id]
              return (vA !== undefined && vA !== '') || (vB !== undefined && vB !== '')
            })
            if (!relevantItems.length) return null
            return (
              <div key={group.group}>
                <div className="px-5 py-2 bg-gray-50 text-xs font-bold uppercase tracking-wide"
                  style={{ color: group.color }}>{group.group}</div>
                {relevantItems.map(m => {
                  const vA = cmpA.values?.[m.id] ?? ''
                  const vB = cmpB.values?.[m.id] ?? ''
                  const numA = parseFloat(vA); const numB = parseFloat(vB)
                  const diff = !isNaN(numA) && !isNaN(numB) ? numB - numA : null
                  const stA = getStatus(vA, m.refMin, m.refMax)
                  const stB = getStatus(vB, m.refMin, m.refMax)
                  return (
                    <div key={m.id} className="flex items-center gap-2 px-5 py-2.5 border-t border-gray-50 text-sm">
                      <span className="flex-1 text-gray-600 text-xs truncate">{m.label}</span>
                      <span className="font-medium text-xs w-20 text-right" style={{ color: vA !== '' ? ST[stA].text : '#94a3b8' }}>
                        {vA !== '' ? `${vA} ${m.unit}` : '—'}
                      </span>
                      <span className="text-gray-300 text-xs">→</span>
                      <span className="font-medium text-xs w-20 text-right" style={{ color: vB !== '' ? ST[stB].text : '#94a3b8' }}>
                        {vB !== '' ? `${vB} ${m.unit}` : '—'}
                      </span>
                      {diff !== null && (
                        <span className={`text-xs w-14 text-right font-semibold ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {diff > 0 ? '▲' : diff < 0 ? '▼' : '='} {Math.abs(diff).toFixed(1)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* List */}
      {analyses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Microscope size={40} className="mx-auto mb-3 opacity-30" />
          <div className="font-medium text-gray-500">Nessuna analisi salvata</div>
          <div className="text-sm mt-1">Aggiungi la tua prima analisi del sangue</div>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map(a => {
            const filled = countFilled(a.values)
            const abnormal = countAbnormal(a.values)
            const isCompared = compareIds.includes(a.id)
            return (
              <div key={a.id} className={`bg-white rounded-xl border p-4 transition-all ${isCompared ? 'border-violet-300 shadow-md' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  {a.image && (
                    <img src={a.image} alt="referto"
                      className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {new Date(a.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        {a.lab && <div className="text-xs text-gray-500">{a.lab}</div>}
                        {a.note && <div className="text-xs text-gray-400 mt-0.5 italic">{a.note}</div>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {filled > 0 && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{filled} valori</span>
                        )}
                        {abnormal > 0 && (
                          <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                            {abnormal} fuori range
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Abnormal values quick view */}
                    {abnormal > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ALL_MARKERS.filter(m => {
                          const st = getStatus(a.values?.[m.id], m.refMin, m.refMax)
                          return st === 'high' || st === 'low'
                        }).map(m => {
                          const st = getStatus(a.values[m.id], m.refMin, m.refMax)
                          const s = ST[st]
                          return (
                            <span key={m.id} className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                              style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                              {m.label}: {a.values[m.id]} {m.unit}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1">
                    {expandedId === a.id ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                    {expandedId === a.id ? 'Chiudi' : 'Vedi tutti i valori'}
                  </button>
                  <button onClick={() => toggleCompare(a.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      isCompared
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'text-violet-600 border-violet-200 hover:bg-violet-50'
                    }`}>
                    {isCompared ? '✓ Selezionata' : 'Confronta'}
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                    Elimina
                  </button>
                </div>

                {/* Expanded all-values view — shows ALL values in the report */}
                {expandedId === a.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                    {a.image && (
                      <img src={a.image} alt="referto" className="w-full max-h-64 object-contain rounded-lg border border-gray-200 bg-gray-50 mb-3" />
                    )}
                    {Object.entries(a.values || {})
                      .filter(([, v]) => v !== '' && v != null)
                      .map(([key, val]) => {
                        const marker = ALL_MARKERS.find(m => m.id === key)
                        const label = marker?.label || key
                        const unit = marker?.unit || ''
                        const st = marker ? getStatus(val, marker.refMin, marker.refMax) : 'empty'
                        const s = ST[st] || ST.empty
                        return (
                          <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                            <span className="text-gray-700 text-xs flex-1">{label}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {marker && <span className="text-[10px] text-gray-400">ref: {marker.refMin}–{marker.refMax} {unit}</span>}
                              <span className="font-semibold text-xs px-2 py-0.5 rounded min-w-[60px] text-right"
                                style={st !== 'empty' ? {background: s.bg, color: s.text} : {}}>
                                {val}{unit ? ` ${unit}` : ''}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-800">Nuova analisi del sangue</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Date + Lab */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data analisi</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Laboratorio</label>
                  <input type="text" placeholder="es. Synlab, Policlinico..." value={formLab}
                    onChange={e => setFormLab(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                <input type="text" placeholder="es. A digiuno, post antibiotico..." value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Foto / Scansione referto</label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Upload size={14} /> Carica file
                  </button>
                  <button onClick={() => cameraRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Camera size={14} /> Scatta foto
                  </button>
                  {formImg && (
                    <div className="relative">
                      <img src={formImg} alt="referto" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                      <button onClick={() => setFormImg(null)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={8} />
                      </button>
                    </div>
                  )}
                </div>
                {extracting && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-3 py-2 rounded-lg">
                    <Loader2 size={13} className="animate-spin" />
                    Gemini sta leggendo il referto…
                  </div>
                )}
                {extractMsg && !extracting && (
                  <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${extractMsg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {extractMsg}
                  </div>
                )}
                {!hasGeminiKey && !extracting && !extractMsg && (
                  <div className="mt-1.5 text-[10px] text-violet-600 bg-violet-50 px-2 py-1 rounded-md inline-block">
                    🤖 Configura la chiave Gemini in Impostazioni per l'estrazione automatica
                  </div>
                )}
                {hasGeminiKey && !extracting && !extractMsg && (
                  <div className="mt-1.5 text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded-md inline-block">
                    ✓ Gemini attivo — carica la foto per estrarre i valori automaticamente
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImg} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImg} />
              </div>

              {/* Marker groups */}
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Inserisci i valori</div>
              {MARKERS.map(group => (
                <div key={group.group} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold" style={{ color: group.color }}>{group.group}</span>
                    {openGroups.includes(group.group) ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  </button>
                  {openGroups.includes(group.group) && (
                    <div className="border-t border-gray-100">
                      {group.items.map(marker => {
                        const val = formVals[marker.id] ?? ''
                        const st  = getStatus(val, marker.refMin, marker.refMax)
                        const s   = ST[st]
                        return (
                          <div key={marker.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                            <span className="flex-1 text-sm text-gray-700">{marker.label}</span>
                            <span className="text-[10px] text-gray-400 w-12 text-right flex-shrink-0">{marker.unit}</span>
                            <input
                              type="number" step="any" value={val}
                              onChange={e => setFormVals(prev => ({ ...prev, [marker.id]: e.target.value }))}
                              className="w-20 border rounded-lg px-2 py-1.5 text-sm text-right transition-colors"
                              style={val !== '' ? { borderColor: s.border, background: s.bg, color: s.text } : {}}
                              placeholder="—"
                            />
                            <span className="w-14 flex-shrink-0">
                              <StatusBadge val={val} refMin={marker.refMin} refMax={marker.refMax} />
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={handleSave}
                className="flex-1 bg-rose-600 text-white rounded-2xl py-2.5 text-sm font-semibold hover:bg-rose-700 transition-colors">
                Salva analisi
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
