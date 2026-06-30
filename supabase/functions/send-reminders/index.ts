import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = 'reminder@medical-dashboard.app'

serve(async (req) => {
  // This function is called by a cron job or manually
  // It expects a POST body with: { email, screenings: [{name, next_date, category}] }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { email, screenings } = await req.json()

  if (!email || !screenings?.length) {
    return new Response(JSON.stringify({ error: 'Missing email or screenings' }), { status: 400 })
  }

  const today = new Date()
  const upcoming = screenings.filter((s: any) => {
    if (!s.next_date) return false
    const next = new Date(s.next_date)
    const daysUntil = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 30
  })

  if (!upcoming.length) {
    return new Response(JSON.stringify({ message: 'No upcoming screenings' }), { status: 200 })
  }

  const html = `
    <h2>Promemoria visite mediche</h2>
    <p>Hai ${upcoming.length} visita/e in scadenza nei prossimi 30 giorni:</p>
    <ul>
      ${upcoming.map((s: any) => `<li><strong>${s.name}</strong> — ${s.next_date} (${s.category || ''})</li>`).join('')}
    </ul>
    <p style="color:#888;font-size:12px">Questo promemoria è stato inviato dalla tua Medical Dashboard.</p>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: `Promemoria: ${upcoming.length} visita/e in scadenza`,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { status: res.ok ? 200 : 500 })
})
