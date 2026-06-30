export function detectCorrelations(zoneEvents) {
  const results = []
  const entries = Object.entries(zoneEvents)

  const CHAINS = [
    ['caviglia_dx', 'polpaccio_dx', 'Catena caviglia → polpaccio (infortuni a cascata)'],
    ['polpaccio_dx', 'coscia_dx', 'Catena polpaccio → coscia (compensazione muscolare)'],
    ['coscia_dx', 'inguine', 'Catena coscia → inguine (sovraccarico)'],
    ['coscia_sx', 'inguine', 'Catena coscia sx → inguine'],
    ['collo_schiena', 'testa', 'Collo → testa (cefalea tensiva)'],
    ['torace', 'collo_schiena', 'Torace → collo (postura)'],
  ]

  for (const [z1, z2, reason] of CHAINS) {
    if (zoneEvents[z1]?.length && zoneEvents[z2]?.length) {
      results.push({ zones: [z1, z2], reason, strength: 'alta' })
    }
  }

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [z1, evs1] = entries[i]
      const [z2, evs2] = entries[j]
      if (results.some(r => r.zones.includes(z1) && r.zones.includes(z2))) continue
      const dates1 = evs1.map(e => e.date).filter(Boolean)
      const dates2 = evs2.map(e => e.date).filter(Boolean)
      let found = false
      for (const d1 of dates1) {
        for (const d2 of dates2) {
          const diff = Math.abs(new Date(d1) - new Date(d2)) / 86400000
          if (diff <= 60) {
            results.push({ zones: [z1, z2], reason: `Episodi ravvicinati (${Math.round(diff)}gg)`, strength: 'media' })
            found = true
            break
          }
        }
        if (found) break
      }
    }
  }

  return results
}
