import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X, Users } from 'lucide-react'
import { family } from '../store'

const input = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'
const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

const MEMBERS = [
  'Madre', 'Padre', 'Fratello', 'Sorella',
  'Nonno paterno', 'Nonna paterna', 'Nonno materno', 'Nonna materna',
  'Zio/Zia paterno', 'Zio/Zia materno', 'Cugino/a', 'Figlio/a', 'Altro',
]

const EMPTY = { member: 'Madre', condition: '', age_of_onset: '', notes: '' }

function FamilyForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="grid grid-cols-2 gap-2 bg-teal-50/60 rounded-lg p-3 mt-1">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Familiare</label>
        <select className={input} value={form.member} onChange={e => f('member', e.target.value)}>
          {MEMBERS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Patologia / Condizione *</label>
        <input className={input} value={form.condition} onChange={e => f('condition', e.target.value)} placeholder="es. Diabete tipo 2" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Età esordio</label>
        <input className={input} type="number" min="0" max="120" value={form.age_of_onset} onChange={e => f('age_of_onset', e.target.value)} placeholder="es. 55" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Note</label>
        <input className={input} value={form.notes} onChange={e => f('notes', e.target.value)} placeholder="note aggiuntive" />
      </div>
      <div className="col-span-2 flex gap-2">
        <button onClick={() => { if (form.condition.trim()) onSave(form) }} className={`${btn} bg-teal-600 text-white hover:bg-teal-700`}>
          <Check size={13} className="inline mr-1" />Salva
        </button>
        <button onClick={onCancel} className={`${btn} bg-gray-200 text-gray-600 hover:bg-gray-300`}>
          <X size={13} className="inline mr-1" />Annulla
        </button>
      </div>
    </div>
  )
}

function FamilyRow({ item, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="rounded-lg border-l-4 border-l-teal-400 border border-gray-100 bg-white hover:shadow-md transition-shadow px-4 py-3 mb-2">
      {editing ? (
        <FamilyForm
          initial={item}
          onSave={(draft) => { onUpdate(item.id, draft); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-teal-700 bg-teal-50 rounded-full px-2 py-0.5 flex-shrink-0">{item.member}</span>
            <span className="font-medium text-gray-800 text-sm truncate">{item.condition}</span>
            {item.age_of_onset && (
              <span className="text-xs text-gray-400 flex-shrink-0">esordio: {item.age_of_onset} anni</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {item.notes && <span className="text-xs text-gray-400 hidden sm:block">{item.notes}</span>}
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Family() {
  const [list, setList] = useState(family.all)
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (form) => {
    setList(family.add(form))
    setShowForm(false)
  }

  const grouped = list.reduce((acc, item) => {
    const m = item.member || 'Altro'
    if (!acc[m]) acc[m] = []
    acc[m].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center shadow-sm">
            <Users size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Anamnesi familiare</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-normal">Patologie e condizioni presenti in famiglia</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className={`${btn} bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1.5`}
        >
          <Plus size={15} /> Aggiungi
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <FamilyForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {list.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <div className="font-medium text-gray-500 mb-1">Nessuna anamnesi familiare registrata</div>
          <div className="text-xs text-gray-400">Aggiungi patologie presenti nei tuoi familiari</div>
        </div>
      ) : (
        Object.entries(grouped).map(([member, items]) => (
          <div key={member} className="mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{member}</h2>
            {items.map(item => (
              <FamilyRow
                key={item.id}
                item={item}
                onDelete={() => setList(family.remove(item.id))}
                onUpdate={(id, data) => setList(family.update(id, data))}
              />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
