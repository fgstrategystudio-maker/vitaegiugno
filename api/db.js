import crypto from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

async function sb(method, path, body) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers.Prefer = 'resolution=merge-duplicates,return=minimal'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(await res.text())
  if (method === 'POST') return null
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { action, ...p } = req.body

  try {
    let result
    switch (action) {
      case 'getPin': {
        const rows = await sb('GET', `medical_kv?user_id=eq.${encodeURIComponent(p.userId)}&key=eq.pin`)
        result = rows?.[0]?.value ?? null
        break
      }
      case 'setPin': {
        await sb('POST', 'medical_kv', { user_id: p.userId, key: 'pin', value: p.pin, updated_at: new Date().toISOString() })
        result = true
        break
      }
      case 'loadUserData': {
        const rows = await sb('GET', `medical_kv?user_id=eq.${encodeURIComponent(p.userId)}`)
        result = (rows || [])
          .filter(r => r.key !== 'pin' && r.key !== '__auth__')
          .map(r => ({ key: r.key, data: r.value }))
        break
      }
      case 'registerUser': {
        const email = String(p.email || '').trim().toLowerCase()
        if (!email || !p.password) { result = { error: 'invalid' }; break }
        const rows = await sb('GET', `medical_kv?user_id=eq.${encodeURIComponent(email)}&key=eq.__auth__`)
        if (rows && rows.length) { result = { error: 'exists' }; break }
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.scryptSync(String(p.password), salt, 64).toString('hex')
        await sb('POST', 'medical_kv', { user_id: email, key: '__auth__', value: { name: p.name || email, salt, hash }, updated_at: new Date().toISOString() })
        result = { ok: true, name: p.name || email }
        break
      }
      case 'loginUser': {
        const email = String(p.email || '').trim().toLowerCase()
        const rows = await sb('GET', `medical_kv?user_id=eq.${encodeURIComponent(email)}&key=eq.__auth__`)
        const cred = rows && rows[0] && rows[0].value
        if (!cred) { result = { error: 'nouser' }; break }
        const hash = crypto.scryptSync(String(p.password), cred.salt, 64).toString('hex')
        const ok = hash.length === cred.hash.length &&
          crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(cred.hash, 'hex'))
        result = ok ? { ok: true, name: cred.name } : { error: 'bad' }
        break
      }
      case 'syncKey': {
        await sb('POST', 'medical_kv', { user_id: p.userId, key: p.key, value: p.data, updated_at: new Date().toISOString() })
        result = true
        break
      }
      case 'ping': {
        result = 'ok'
        break
      }
      default:
        return res.status(400).json({ error: 'Unknown action' })
    }
    res.json({ result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
