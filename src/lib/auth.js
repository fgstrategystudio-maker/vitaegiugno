const SESSION_KEY = 'vitae_session'

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
}
export function setSession(userId, userName) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, userName }))
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

async function dbCall(action, params = {}) {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  })
  if (!res.ok) throw new Error('DB error')
  const json = await res.json()
  return json.result
}

// ── Fallback locale (quando il backend non è configurato) ──────────────────────
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}
async function localRegister(email, password, name) {
  const k = `vitae_user_${email}`
  if (localStorage.getItem(k)) throw new Error('Esiste già un account con questa email')
  const salt = Math.random().toString(36).slice(2)
  const hash = await sha256(salt + ':' + password)
  localStorage.setItem(k, JSON.stringify({ name, salt, hash }))
  return { userId: email, userName: name }
}
async function localLogin(email, password) {
  const raw = localStorage.getItem(`vitae_user_${email}`)
  if (!raw) throw new Error('Nessun account con questa email')
  const u = JSON.parse(raw)
  const hash = await sha256(u.salt + ':' + password)
  if (hash !== u.hash) throw new Error('Password errata')
  return { userId: email, userName: u.name }
}

// ── API pubblica: registrazione / login email+password ─────────────────────────
export async function register(emailRaw, password, name) {
  const email = String(emailRaw).trim().toLowerCase()
  if (!email || !password) throw new Error('Email e password obbligatorie')
  try {
    const r = await dbCall('registerUser', { email, password, name })
    if (r?.error === 'exists') throw new Error('Esiste già un account con questa email')
    if (r?.ok) return { userId: email, userName: r.name }
    throw new Error('backend')
  } catch (e) {
    if (/account|obbligatorie/.test(e.message)) throw e
    return localRegister(email, password, name) // offline / nessun backend
  }
}
export async function login(emailRaw, password) {
  const email = String(emailRaw).trim().toLowerCase()
  if (!email || !password) throw new Error('Email e password obbligatorie')
  try {
    const r = await dbCall('loginUser', { email, password })
    if (r?.ok) return { userId: email, userName: r.name }
    if (r?.error === 'nouser') throw new Error('Nessun account con questa email')
    if (r?.error === 'bad') throw new Error('Password errata')
    throw new Error('backend')
  } catch (e) {
    if (/account|errata|obbligatorie/.test(e.message)) throw e
    return localLogin(email, password) // offline / nessun backend
  }
}

// ── PIN locale opzionale (card "Cambia PIN" in Impostazioni) ───────────────────
export async function getPin(userId) {
  return localStorage.getItem(`mcd_pin_${userId}`) ?? null
}
export async function setPin(userId, pin) {
  localStorage.setItem(`mcd_pin_${userId}`, pin)
}

// ── Sync dati (per utente) ─────────────────────────────────────────────────────
export async function loadUserData(userId) {
  try {
    const rows = await dbCall('loadUserData', { userId })
    if (rows && rows.length > 0) {
      rows.forEach(row => localStorage.setItem(row.key, JSON.stringify(row.data)))
    }
  } catch { }
}
export async function syncKey(key, data) {
  const session = getSession()
  if (!session) return
  try {
    await dbCall('syncKey', { userId: session.userId, key, data })
  } catch { }
}
