import React, { useState } from 'react'
import { Phone, MapPin, Navigation, AlertTriangle, Loader2, Hospital, Droplet } from 'lucide-react'
import { getProfile, allergies, conditions, medications } from '../store'

const card = { background: 'var(--panel)', border: '1px solid var(--hair)', borderRadius: 'var(--r)', padding: 'var(--card-pad)', boxShadow: 'var(--sh-sm)', marginBottom: 'var(--gap)' }
const lab = { fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 14 }

const haversine = (la1, lo1, la2, lo2) => {
  const R = 6371, d = x => x * Math.PI / 180
  const a = Math.sin(d(la2 - la1) / 2) ** 2 + Math.cos(d(la1)) * Math.cos(d(la2)) * Math.sin(d(lo2 - lo1) / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SOS = [
  { num: '112', label: 'Emergenza unica europea', desc: 'Ambulanza · Polizia · Vigili del fuoco' },
  { num: '118', label: 'Emergenza sanitaria', desc: 'Soccorso medico (Italia)' },
]

export default function Emergenza() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hospitals, setHospitals] = useState(null)

  const profile = getProfile()
  const alg = allergies.all()
  const cond = conditions.all().filter(c => c.status === 'active')
  const meds = medications.all()

  const find = () => {
    setError(''); setLoading(true); setHospitals(null)
    if (!navigator.geolocation) { setError('Geolocalizzazione non disponibile su questo dispositivo'); setLoading(false); return }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords
      const q = `[out:json][timeout:25];(node["amenity"="hospital"](around:12000,${lat},${lon});way["amenity"="hospital"](around:12000,${lat},${lon}););out center tags;`
      const MIRRORS = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      ]
      try {
        let data = null
        for (const url of MIRRORS) {
          try {
            const ctrl = new AbortController()
            const to = setTimeout(() => ctrl.abort(), 20000)
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q), signal: ctrl.signal })
            clearTimeout(to)
            if (!res.ok) continue
            data = await res.json()
            break
          } catch { /* prova il prossimo mirror */ }
        }
        if (!data) { setError('Servizio mappe momentaneamente occupato. Riprova tra qualche secondo.'); setLoading(false); return }
        const items = (data.elements || []).map(el => {
          const t = el.tags || {}
          const plat = el.lat ?? el.center?.lat, plon = el.lon ?? el.center?.lon
          if (!plat) return null
          return {
            id: el.id,
            name: t.name || 'Ospedale',
            emergency: t.emergency === 'yes' || /pronto soccorso|emergenz/i.test(t.name || ''),
            phone: t['contact:phone'] || t.phone || t['emergency:phone'] || '',
            dist: haversine(lat, lon, plat, plon),
            lat: plat, lon: plon,
          }
        }).filter(Boolean)
        items.sort((a, b) => (b.emergency - a.emergency) || (a.dist - b.dist))
        setHospitals(items.slice(0, 8))
        if (!items.length) setError('Nessun ospedale trovato nel raggio di 12 km')
      } catch {
        setError('Impossibile contattare il servizio mappe. Riprova.')
      }
      setLoading(false)
    }, () => { setError('Permesso di geolocalizzazione negato'); setLoading(false) }, { enableHighAccuracy: true, timeout: 15000 })
  }

  return (
    <div>
      {/* SOS numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {SOS.map(s => (
          <a key={s.num} href={`tel:${s.num}`} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', background: s.num === '112' ? 'var(--danger)' : 'var(--panel)', color: s.num === '112' ? '#fff' : 'var(--ink)', border: '1px solid ' + (s.num === '112' ? 'var(--danger)' : 'var(--hair)'), borderRadius: 'var(--r)', padding: '18px 20px', boxShadow: 'var(--sh-sm)' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, display: 'grid', placeItems: 'center', background: s.num === '112' ? 'rgba(255,255,255,.18)' : 'var(--danger-wash)', color: s.num === '112' ? '#fff' : 'var(--danger)', flexShrink: 0 }}><Phone size={22} /></div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, fontFamily: 'var(--font-serif)' }}>{s.num}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, opacity: .8, marginTop: 1 }}>{s.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {/* Dati critici per i soccorritori */}
      <div style={card}>
        <div style={lab}>Dati critici (mostra ai soccorritori)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}><Droplet size={13} /> Gruppo sanguigno</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger)', marginTop: 4, fontFamily: 'var(--font-serif)' }}>{profile.blood_type || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Allergie</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 6, lineHeight: 1.5 }}>{alg.length ? alg.map(a => a.name).join(', ') : 'nessuna nota'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Patologie attive</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 6, lineHeight: 1.5 }}>{cond.length ? cond.map(c => c.name).join(', ') : 'nessuna'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Farmaci</div>
            <div style={{ fontSize: 14, color: 'var(--ink)', marginTop: 6, lineHeight: 1.5 }}>{meds.length ? meds.map(m => m.name).join(', ') : 'nessuno'}</div>
          </div>
        </div>
      </div>

      {/* Pronto soccorso vicini */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
          <div style={lab}>Pronto soccorso vicini</div>
          <button onClick={find} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 15px', borderRadius: 'var(--r-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {loading ? <Loader2 size={15} className="vspin" /> : <MapPin size={15} />} {loading ? 'Ricerca…' : 'Trova vicino a me'}
          </button>
        </div>

        {error && <div style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 12 }}>{error}</div>}
        {hospitals === null && !loading && !error && <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: '24px 0', fontSize: 14 }}>Premi “Trova vicino a me” per gli ospedali con pronto soccorso più vicini.</div>}

        {hospitals?.map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 'var(--r-sm)', background: 'var(--panel-2)', border: '1px solid var(--hair)', borderLeft: '3px solid ' + (h.emergency ? 'var(--danger)' : 'var(--accent)'), marginBottom: 8 }}>
            <Hospital size={18} style={{ color: h.emergency ? 'var(--danger)' : 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{h.name}{h.emergency && <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700, marginLeft: 8 }}>PRONTO SOCCORSO</span>}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>a {h.dist.toFixed(1)} km</div>
            </div>
            {h.phone && <a href={`tel:${h.phone.replace(/\s/g, '')}`} style={{ color: 'var(--pos)', display: 'grid', placeItems: 'center' }} title={h.phone}><Phone size={17} /></a>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', display: 'grid', placeItems: 'center' }} title="Indicazioni"><Navigation size={17} /></a>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>I dati provengono da OpenStreetMap. I <b>tempi di attesa in tempo reale</b> non sono disponibili a livello nazionale: alcune Regioni li pubblicano sui propri portali. In caso di emergenza grave chiama sempre il <b>112</b>.</span>
        </div>
      </div>

      <style>{`@keyframes vspin{to{transform:rotate(360deg)}}.vspin{animation:vspin 1s linear infinite}`}</style>
    </div>
  )
}
