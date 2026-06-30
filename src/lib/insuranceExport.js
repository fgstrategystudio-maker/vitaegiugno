export function buildInsuranceReport({ profile, selectedEpisodes, allergies, medications, conditions }) {
  const date = new Date().toLocaleDateString('it-IT')
  return `
    <div class="insurance-report" style="font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1e293b;">
      <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 1rem; margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: bold; margin: 0 0 0.5rem;">Report Medico — ${profile.name || 'Paziente'}</h1>
        <p style="font-size: 0.875rem; color: #475569; margin: 0;">
          Data: ${date}${profile.tax_code ? ` | CF: ${profile.tax_code}` : ''}${profile.birth_date ? ` | Nato: ${profile.birth_date}` : ''}${profile.blood_type ? ` | Gruppo: ${profile.blood_type}` : ''}
        </p>
      </div>

      ${allergies.length ? `
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1rem; font-weight: bold; color: #dc2626; margin-bottom: 0.5rem; border-bottom: 1px solid #fee2e2; padding-bottom: 0.25rem;">Allergie e intolleranze</h2>
        ${allergies.map(a => `<p style="margin: 0.25rem 0; font-size: 0.875rem;">• <strong>${a.name}</strong>${a.type ? ` (${a.type})` : ''} — gravità: ${a.severity || '—'}${a.notes ? ` — ${a.notes}` : ''}</p>`).join('')}
      </div>` : ''}

      ${medications.filter(m => m.active !== false).length ? `
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1rem; font-weight: bold; color: #7c3aed; margin-bottom: 0.5rem; border-bottom: 1px solid #ede9fe; padding-bottom: 0.25rem;">Farmaci attivi</h2>
        ${medications.filter(m => m.active !== false).map(m => `<p style="margin: 0.25rem 0; font-size: 0.875rem;">• <strong>${m.name}</strong>${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` — ${m.frequency}` : ''}${m.reason ? ` — ${m.reason}` : ''}</p>`).join('')}
      </div>` : ''}

      ${conditions.length ? `
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1rem; font-weight: bold; color: #0369a1; margin-bottom: 0.5rem; border-bottom: 1px solid #e0f2fe; padding-bottom: 0.25rem;">Condizioni / Patologie</h2>
        ${conditions.map(c => `<p style="margin: 0.25rem 0; font-size: 0.875rem;">• <strong>${c.name}</strong>${c.chronic ? ' (cronica)' : ''} — ${c.status || '—'}${c.diagnosed_date ? ` (dal ${c.diagnosed_date})` : ''}${c.notes ? ` — ${c.notes}` : ''}</p>`).join('')}
      </div>` : ''}

      ${selectedEpisodes.length ? `
      <div style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1rem; font-weight: bold; color: #0f172a; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">Episodi medici selezionati</h2>
        ${selectedEpisodes.map(ep => `
          <div style="margin-bottom: 1rem; padding: 0.75rem; border-left: 3px solid #6366f1; background: #f8fafc; border-radius: 0 8px 8px 0;">
            <div style="font-weight: bold; font-size: 0.9rem;">${ep.diagnosis || ep.body_area || ep.type}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin: 0.25rem 0;">
              ${ep.start_date || ''}${ep.end_date ? ` → ${ep.end_date}` : ''}${ep.body_area ? ` | Zona: ${ep.body_area}` : ''}${ep.type ? ` | Tipo: ${ep.type}` : ''}
            </div>
            ${ep.symptoms ? `<div style="font-size: 0.8rem; margin: 0.2rem 0;">Sintomi: ${ep.symptoms}</div>` : ''}
            ${ep.therapy ? `<div style="font-size: 0.8rem; margin: 0.2rem 0;">Terapia: ${ep.therapy}</div>` : ''}
            ${ep.notes ? `<div style="font-size: 0.8rem; margin: 0.2rem 0; color: #475569;">${ep.notes}</div>` : ''}
            ${(ep.documents || []).length ? `<div style="font-size: 0.75rem; margin-top: 0.35rem; color: #6366f1;">Allegati: ${(ep.documents || []).map(d => `📎 ${d.name}`).join(' · ')}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}

      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8;">
        Documento generato il ${date} tramite Medical Dashboard — riservato uso personale/assicurativo.
      </div>
    </div>
  `
}
