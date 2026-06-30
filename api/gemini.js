// Proxy Gemini: usa una sola chiave condivisa (env GEMINI_API_KEY) per tutti
// gli account, così non serve che ogni utente inserisca la propria.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } })

  const key = process.env.GEMINI_API_KEY
  if (!key) return res.status(503).json({ error: { message: 'AI non configurata: manca GEMINI_API_KEY sul server' } })

  const { endpoint, body } = req.body || {}
  if (!endpoint || !/^v1(beta)?\/models($|\/[a-zA-Z0-9.\-:]+$)/.test(endpoint)) {
    return res.status(400).json({ error: { message: 'Endpoint non valido' } })
  }

  const url = `https://generativelanguage.googleapis.com/${endpoint}?key=${key}`
  try {
    const r = await fetch(url, body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : { method: 'GET' })
    const text = await r.text()
    res.status(r.status).setHeader('Content-Type', 'application/json').send(text)
  } catch (e) {
    res.status(502).json({ error: { message: 'Errore proxy Gemini: ' + e.message } })
  }
}
