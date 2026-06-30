// Instrada le chiamate Gemini al proxy server-side, che usa UNA chiave
// condivisa (env GEMINI_API_KEY) per tutti gli account.
// endpoint es: "v1beta/models" oppure "v1beta/models/gemini-2.0-flash:generateContent"
export async function geminiCall(endpoint, body) {
  return fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, body }),
  })
}
