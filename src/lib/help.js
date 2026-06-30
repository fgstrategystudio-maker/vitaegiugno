// src/lib/help.js
// ============================================================
// Base di conoscenza condivisa: onboarding al primo accesso,
// tutorial per ogni scheda (mostrato la prima volta che la apri)
// e assistente virtuale (risponde a domande sulla sezione).
// Unica fonte di verità per le tre funzioni.
// ============================================================

export const APP_NAME = 'Vitae'

// ── persistenza (volutamente per-dispositivo: i tutorial sono locali) ──
const SEEN_PREFIX = 'vitae_tour_seen_'
const ONBOARD_KEY = 'vitae_onboarded'

export const hasOnboarded = () => localStorage.getItem(ONBOARD_KEY) === '1'
export const setOnboarded = () => localStorage.setItem(ONBOARD_KEY, '1')

export const hasSeenTour = (path) => localStorage.getItem(SEEN_PREFIX + path) === '1'
export const markTourSeen = (path) => localStorage.setItem(SEEN_PREFIX + path, '1')

export const resetAllTutorials = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(SEEN_PREFIX) || k === ONBOARD_KEY)
    .forEach((k) => localStorage.removeItem(k))
}

// ── onboarding globale (primo avvio in assoluto) ──
export const ONBOARDING = [
  {
    icon: 'heart',
    title: `Benvenuto in ${APP_NAME} 👋`,
    body: 'La tua cartella clinica personale. Qui raccogli infortuni, esami, misurazioni, documenti e tutta la tua storia di salute, in un posto solo e sempre con te. 💙',
  },
  {
    icon: 'menu',
    title: 'Tutto a portata di menu',
    body: 'Usa il menu a sinistra per spostarti tra le sezioni: Panoramica, Diario clinico, Prevenzione, Assicurazione e Archivio. 📱 Su telefono si apre con il pulsante in alto a sinistra.',
  },
  {
    icon: 'compass',
    title: 'Tutorial quando ti serve',
    body: 'La prima volta che apri una sezione ti spiego cosa puoi farci. 🧭 Puoi rivedere la guida in qualsiasi momento con il pulsante “Rivedi tutorial” in alto.',
  },
  {
    icon: 'sparkles',
    title: 'Un assistente sempre con te',
    body: 'In basso a destra trovi l’assistente: chiedigli a parole tue cosa puoi fare in ogni sezione e ti rispondo subito. 💬',
  },
  {
    icon: 'shield',
    title: 'I tuoi dati sono al sicuro',
    body: 'I dati restano tuoi. 🔒 Ricordati di fare ogni tanto un Backup (in alto) per non perdere nulla e poterli ripristinare su un altro dispositivo.',
  },
]

// ── aiuto per ogni rotta ──
// step  = tutorial guidato (mostrato la prima volta che apri la scheda)
// faqs  = domande/risposte usate dall'assistente
const HELP = {
  '/': {
    title: 'Dashboard',
    tagline: 'Il colpo d’occhio sulla tua salute.',
    steps: [
      { title: 'La tua panoramica', body: 'La Home riassume lo stato generale: ultimi eventi, scadenze in arrivo e numeri chiave. È il punto di partenza ogni volta che apri Vitae.' },
      { title: 'Scorri le sezioni dal menu', body: 'Da qui raggiungi tutto: usa il menu a sinistra per aprire Infortuni, Misurazioni, Analisi del sangue e il resto.' },
      { title: 'Backup e Ripristino', body: 'In alto a destra puoi scaricare un backup dei tuoi dati o ripristinarli da un file salvato in precedenza.' },
    ],
    faqs: [
      { q: 'cosa posso fare nella home dashboard panoramica', a: 'La Home è il riepilogo della tua salute: ultimi eventi, scadenze e numeri principali. Da qui apri tutte le altre sezioni dal menu a sinistra.' },
      { q: 'come faccio il backup salvare dati', a: '💾 Clicca “Backup” in alto a destra: scarichi un file con tutti i tuoi dati. Per rimetterli usa “Ripristina” e scegli quel file.' },
    ],
  },
  '/timeline': {
    title: 'Timeline',
    tagline: 'La tua storia clinica in ordine di tempo.',
    steps: [
      { title: 'Tutto in cronologia', body: 'La Timeline mette in fila tutti gli eventi della tua salute: infortuni, esami, visite e misurazioni, dal più recente al più vecchio.' },
      { title: 'Capire l’andamento', body: 'Serve a vedere a colpo d’occhio cosa è successo e quando, per raccontarlo bene al medico.' },
    ],
    faqs: [
      { q: 'cosa serve la timeline cronologia eventi storia', a: 'La Timeline mostra tutti i tuoi eventi clinici in ordine di data: infortuni, esami, visite e misurazioni. Utile per ricostruire la tua storia e raccontarla al medico.' },
    ],
  },
  '/sintesi': {
    title: 'Sintesi Clinica',
    tagline: 'Un riassunto pronto da mostrare al medico.',
    steps: [
      { title: 'Il riepilogo completo', body: 'La Sintesi raccoglie in un’unica pagina le informazioni più importanti: condizioni, terapie, allergie e dati recenti.' },
      { title: 'Pronta da stampare', body: 'È pensata per essere stampata o mostrata a una visita: tutto l’essenziale, già ordinato.' },
    ],
    faqs: [
      { q: 'cosa è la sintesi clinica riassunto', a: 'La Sintesi è un riepilogo della tua situazione clinica (condizioni, terapie, allergie, dati recenti) pronto da stampare o mostrare al medico.' },
    ],
  },
  '/emergenza': {
    title: 'Emergenza',
    tagline: 'Le informazioni che salvano tempo (e vita).',
    steps: [
      { title: 'Dati salvavita', body: 'Qui inserisci gruppo sanguigno, allergie, terapie in corso e contatti da chiamare in caso di emergenza.' },
      { title: 'Sempre accessibile', body: 'Tienila aggiornata: in un’urgenza chi ti soccorre trova subito ciò che serve.' },
    ],
    faqs: [
      { q: 'cosa metto in emergenza allergie gruppo sanguigno contatti', a: '🚑 Nella sezione Emergenza inserisci gruppo sanguigno, allergie, terapie in corso e i contatti da avvisare. Sono i dati che servono subito a chi ti soccorre.' },
    ],
  },
  '/infortuni': {
    title: 'Infortuni',
    tagline: 'Registra ogni infortunio, anche il più piccolo.',
    steps: [
      { title: 'Annota cosa è successo', body: 'Aggiungi un infortunio indicando data, parte del corpo, cosa è successo e come è andata. Con il tempo costruisci uno storico utile.' },
      { title: 'Mappa del corpo', body: 'Puoi indicare la zona interessata sulla mappa del corpo, così ritrovi tutto a colpo d’occhio.' },
      { title: 'Allega referti', body: 'Collega documenti o foto (radiografie, referti) per avere tutto insieme.' },
    ],
    faqs: [
      { q: 'come aggiungo registro un infortunio trauma', a: '🩹 Apri Infortuni e usa il pulsante per aggiungerne uno: indica data, zona del corpo, cosa è successo e l’esito. Puoi anche segnare la parte sulla mappa del corpo e allegare referti.' },
      { q: 'cosa è la mappa del corpo body map', a: 'È una figura su cui indichi la zona interessata dall’infortunio, così ritrovi velocemente tutto per parte del corpo.' },
    ],
  },
  '/watchlist': {
    title: 'Diario ed Appunti',
    tagline: 'Note libere sulla tua salute.',
    steps: [
      { title: 'Scrivi liberamente', body: 'Usa questa sezione come un diario: sintomi, sensazioni, domande da fare al medico, qualsiasi cosa tu voglia ricordare.' },
      { title: 'Tieni d’occhio', body: 'È utile per annotare cose “da tenere sotto controllo” e rileggerle nel tempo.' },
    ],
    faqs: [
      { q: 'cosa scrivo nel diario appunti note watchlist', a: 'Nel Diario ed Appunti scrivi liberamente: sintomi, sensazioni, cose da chiedere al medico o da tenere sotto controllo. È il tuo blocco note clinico.' },
    ],
  },
  '/misurazioni': {
    title: 'Misurazioni',
    tagline: 'I tuoi valori nel tempo, con i grafici.',
    steps: [
      { title: 'Registra i valori', body: 'Inserisci misurazioni come peso, pressione, frequenza cardiaca o glicemia, con la data.' },
      { title: 'Guarda l’andamento', body: 'I grafici ti mostrano come cambiano i valori nel tempo: capisci subito se stai migliorando.' },
    ],
    faqs: [
      { q: 'come aggiungo una misurazione peso pressione', a: '📈 In Misurazioni aggiungi un valore (peso, pressione, battito, glicemia…) con la data. I grafici mostrano l’andamento nel tempo.' },
      { q: 'dove vedo i grafici andamento', a: 'In Misurazioni: dopo aver inserito qualche valore, i grafici mostrano come cambia nel tempo.' },
    ],
  },
  '/sangue': {
    title: 'Analisi del Sangue',
    tagline: 'Tutti gli esami, valore per valore.',
    steps: [
      { title: 'Inserisci i risultati', body: 'Aggiungi i valori dei tuoi esami del sangue (colesterolo, glicemia, emoglobina…) con la data dell’esame.' },
      { title: 'Confronta nel tempo', body: 'Vitae ti mostra l’andamento di ogni valore e segnala quelli fuori dai limiti di riferimento.' },
    ],
    faqs: [
      { q: 'come inserisco le analisi del sangue esami valori', a: '🩸 In Analisi del Sangue aggiungi i singoli valori (es. colesterolo, glicemia, emoglobina) con la data. Puoi confrontarli nel tempo e vedere quelli fuori soglia.' },
      { q: 'valori fuori range riferimento alti bassi', a: 'Quando un valore è fuori dai limiti di riferimento, viene evidenziato così te ne accorgi subito.' },
    ],
  },
  '/ciclo': {
    title: 'Ciclo mestruale',
    tagline: 'Traccia e prevedi il tuo ciclo.',
    steps: [
      { title: 'Segna i giorni', body: 'Registra l’inizio e la durata del ciclo, insieme a sintomi e note.' },
      { title: 'Previsioni e regolarità', body: 'Con qualche mese di dati, Vitae ti aiuta a vedere la regolarità e a prevedere il prossimo ciclo.' },
    ],
    faqs: [
      { q: 'come traccio il ciclo mestruale', a: 'In Ciclo mestruale segni inizio e durata del ciclo, con sintomi e note. Con qualche mese di dati vedi la regolarità e una previsione del prossimo.' },
    ],
  },
  '/screening': {
    title: 'Screening',
    tagline: 'Gli esami di prevenzione, mai più dimenticati.',
    steps: [
      { title: 'Esami periodici', body: 'Tieni traccia degli screening di prevenzione (es. controlli periodici) e di quando vanno ripetuti.' },
      { title: 'Scadenze in vista', body: 'Vitae ti aiuta a non perdere le scadenze dei controlli importanti.' },
    ],
    faqs: [
      { q: 'cosa è lo screening prevenzione controlli', a: 'In Screening registri gli esami di prevenzione e quando vanno ripetuti, così non dimentichi i controlli periodici importanti.' },
    ],
  },
  '/vaccini': {
    title: 'Vaccini',
    tagline: 'Il tuo libretto vaccinale digitale.',
    steps: [
      { title: 'Registra i vaccini', body: 'Annota i vaccini fatti, con data e tipo, e gli eventuali richiami.' },
      { title: 'Richiami in tempo', body: 'Tieni sott’occhio le date dei richiami per restare sempre coperto.' },
    ],
    faqs: [
      { q: 'come segno i vaccini richiami libretto vaccinale', a: '💉 In Vaccini registri ogni vaccino con data e tipo e tieni traccia dei richiami, come un libretto vaccinale digitale.' },
    ],
  },
  '/pattern': {
    title: 'Pattern',
    tagline: 'Scopri i collegamenti nei tuoi dati.',
    steps: [
      { title: 'Correlazioni', body: 'Questa sezione cerca collegamenti e ricorrenze tra i tuoi dati (sintomi, misurazioni, eventi) per farti notare degli andamenti.' },
      { title: 'Più dati, più chiarezza', body: 'Più informazioni inserisci nelle altre sezioni, più i pattern diventano utili.' },
    ],
    faqs: [
      { q: 'cosa sono i pattern correlazioni andamenti', a: 'In Pattern, Vitae cerca ricorrenze e collegamenti tra i tuoi dati (sintomi, misurazioni, eventi) per mostrarti andamenti che da soli non noteresti.' },
    ],
  },
  '/polizze': {
    title: 'Polizze & Rimborsi',
    tagline: 'Assicurazioni e rimborsi sotto controllo.',
    steps: [
      { title: 'Le tue polizze', body: 'Registra le polizze sanitarie con coperture e scadenze.' },
      { title: 'Rimborsi', body: 'Tieni traccia delle richieste di rimborso e del loro stato, con i documenti collegati.' },
    ],
    faqs: [
      { q: 'come gestisco polizze rimborsi assicurazione', a: 'In Polizze & Rimborsi salvi le tue polizze (coperture e scadenze) e tieni traccia delle richieste di rimborso e del loro stato.' },
    ],
  },
  '/documenti': {
    title: 'Documenti',
    tagline: 'L’archivio di referti e documenti.',
    steps: [
      { title: 'Carica i tuoi documenti', body: 'Salva referti, ricette, immagini e PDF in un unico archivio ordinato.' },
      { title: 'Ritrova in fretta', body: 'Cataloga i documenti per ritrovarli quando ti servono, anche fuori casa.' },
    ],
    faqs: [
      { q: 'come carico salvo documenti referti pdf', a: '📄 In Documenti carichi referti, ricette, immagini e PDF in un archivio ordinato, così li ritrovi sempre quando ti servono.' },
    ],
  },
  '/medici': {
    title: 'Medici',
    tagline: 'La rubrica dei tuoi specialisti.',
    steps: [
      { title: 'Salva i contatti', body: 'Aggiungi i tuoi medici e specialisti con recapiti e specializzazione.' },
      { title: 'Collega le visite', body: 'Ritrovi facilmente chi ti segue per cosa, con tutti i contatti a portata.' },
    ],
    faqs: [
      { q: 'come aggiungo un medico specialista contatti rubrica', a: 'In Medici crei la rubrica dei tuoi specialisti: nome, specializzazione e recapiti, così li hai sempre a portata.' },
    ],
  },
  '/famiglia': {
    title: 'Famiglia',
    tagline: 'La storia clinica familiare.',
    steps: [
      { title: 'Familiarità', body: 'Annota le condizioni di salute dei familiari: è un’informazione preziosa per la prevenzione.' },
      { title: 'Utile al medico', body: 'La storia familiare aiuta i medici a valutare meglio i tuoi rischi.' },
    ],
    faqs: [
      { q: 'cosa metto in famiglia storia familiare familiarità', a: 'In Famiglia registri le condizioni di salute dei tuoi familiari (familiarità): un dato prezioso per la prevenzione e per i medici.' },
    ],
  },
  '/viaggi': {
    title: 'Viaggi',
    tagline: 'La salute anche quando sei in viaggio.',
    steps: [
      { title: 'Prepara il viaggio', body: 'Salva vaccinazioni richieste, farmaci da portare e informazioni sanitarie utili per le tue mete.' },
      { title: 'Tutto con te', body: 'Hai le info importanti a portata anche lontano da casa.' },
    ],
    faqs: [
      { q: 'cosa serve la sezione viaggi salute estero', a: 'In Viaggi prepari la parte sanitaria dei tuoi spostamenti: vaccinazioni richieste, farmaci da portare e informazioni utili per la meta.' },
    ],
  },
  '/analisi': {
    title: 'Analisi AI',
    tagline: 'Un aiuto intelligente a leggere i tuoi dati.',
    steps: [
      { title: 'Analisi assistita', body: 'Questa sezione usa l’intelligenza artificiale per aiutarti a leggere referti e dati e proporti spunti.' },
      { title: 'Non sostituisce il medico', body: 'È un supporto informativo: per diagnosi e terapie affidati sempre al tuo medico.' },
    ],
    faqs: [
      { q: 'cosa fa analisi ai intelligenza artificiale referti', a: '🤖 In Analisi AI l’intelligenza artificiale ti aiuta a leggere referti e dati e a tirarne fuori spunti. Resta un supporto informativo, non sostituisce il medico.' },
    ],
  },
  '/impostazioni': {
    title: 'Impostazioni',
    tagline: 'Gestisci il tuo account e i dati.',
    steps: [
      { title: 'Account e dati', body: 'Qui gestisci il profilo, il backup dei dati e le preferenze dell’app.' },
      { title: 'Rivedi i tutorial', body: 'Puoi riattivare i tutorial introduttivi per rivederli da capo.' },
    ],
    faqs: [
      { q: 'come cambio impostazioni account backup tutorial', a: 'In Impostazioni gestisci profilo, backup e preferenze. Da qui puoi anche riattivare i tutorial introduttivi.' },
    ],
  },
}

export const getHelp = (path) => HELP[path] || HELP['/']

// ── motore di risposta dell'assistente (offline, senza API) ──
const STOPWORDS = new Set(['il','lo','la','i','gli','le','un','uno','una','di','a','da','in','con','su','per','tra','fra','e','o','che','chi','cosa','come','dove','quando','posso','puo','posto','qui','questa','questo','mi','si','ci','non','del','della','dei','degli','delle','al','allo','alla','ai','agli','alle','è','e’','fare','faccio','voglio'])

const norm = (s) => (s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')

const tokens = (s) => norm(s).split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w))

// raccoglie tutte le faq di tutte le sezioni (per domande "globali")
const ALL_FAQS = Object.entries(HELP).flatMap(([path, h]) =>
  (h.faqs || []).map((f) => ({ ...f, path, section: h.title }))
)

/**
 * Risponde a una domanda in linguaggio naturale.
 * Cerca prima nelle faq della sezione corrente, poi in tutte le altre.
 * @returns {{ text, section? }}
 */
export function askAssistant(path, question) {
  const qTokens = tokens(question)
  const here = getHelp(path)

  if (qTokens.length === 0) {
    return { text: `${here.tagline} ✨ ${here.steps?.[0]?.body || ''}` }
  }

  const score = (faq) => {
    const ft = new Set([...tokens(faq.q), ...tokens(faq.a)])
    return qTokens.reduce((s, t) => s + (ft.has(t) ? 1 : 0), 0)
  }

  // priorità alla sezione in cui ti trovi
  const local = (here.faqs || []).map((f) => ({ f, s: score(f) + 0.5 }))
  const global = ALL_FAQS.map((f) => ({ f, s: score(f) }))
  const best = [...local, ...global].sort((a, b) => b.s - a.s)[0]

  if (!best || best.s < 1) {
    const list = (here.steps || []).map((s) => `• ${s.title}: ${s.body}`).join('\n')
    return {
      text: `In “${here.title}” ${here.tagline} 👇\n\n${list}\n\nProva a chiedermi anche di un’altra sezione (es. “come aggiungo un infortunio?”). 💬`,
    }
  }

  const sec = best.f.section && best.f.path !== path ? best.f.section : null
  return { text: best.f.a, section: sec }
}

// suggerimenti rapidi mostrati nell'assistente per la sezione corrente
export function quickQuestions(path) {
  const here = getHelp(path)
  // domande costruite a mano per leggibilità
  const MAP = {
    '/': ['Cosa vedo nella Home?', 'Come faccio il backup?'],
    '/infortuni': ['Come aggiungo un infortunio?', 'Cos’è la mappa del corpo?'],
    '/misurazioni': ['Come registro un valore?', 'Dove vedo i grafici?'],
    '/sangue': ['Come inserisco le analisi?', 'Cosa sono i valori fuori range?'],
    '/emergenza': ['Cosa metto in Emergenza?'],
    '/documenti': ['Come carico un documento?'],
    '/analisi': ['Cosa fa l’Analisi AI?'],
  }
  return MAP[path] || [`Cosa posso fare in ${here.title}?`, 'Come faccio il backup?']
}
