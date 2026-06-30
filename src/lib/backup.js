export function exportData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith('mcd_')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)) }
      catch { data[k] = localStorage.getItem(k) }
    }
  }
  const blob = new Blob(
    [JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data }, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cartella-clinica-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  localStorage.setItem('mcd_last_backup', new Date().toISOString())
}

export function daysSinceLastBackup() {
  const last = localStorage.getItem('mcd_last_backup')
  if (!last) return Infinity
  return (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
}
