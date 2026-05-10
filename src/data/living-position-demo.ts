export const FAMIGLIA_BIANCHI_DEMO = {
  client_id: 'demo-bianchi',
  family_name: 'Famiglia Bianchi',
  primary_member: 'Giuseppe Bianchi',
  status: 'mandato_attivo',
  patto_signed_at: '2026-02-15T10:00:00Z',

  sfere: [
    {
      id: 'azienda',
      name: 'Azienda',
      icon: 'Building2',
      coverage_pct: 90,
      summary: 'Bianchi Meccanica SpA · €38M ricavi · CEO Giuseppe + figlio Luca',
      details: [
        'Founder 67 anni, designato successore il figlio Luca (32)',
        'Seconda generazione attiva dal 2018',
        'Mandato M&A in fase MBO con Luca + 2 manager senior',
      ],
    },
    {
      id: 'famiglia',
      name: 'Famiglia',
      icon: 'Users',
      coverage_pct: 70,
      summary: '3 generazioni · 8 membri · Patto familiare in stesura',
      details: [
        'Generation 1: Giuseppe + Maria',
        'Generation 2: Luca (CEO incoming), Sofia (medico, esterna al business)',
        'Generation 3: 5 nipoti (3-12 anni)',
        'Patto familiare in fase di redazione con notaio Rossi',
      ],
    },
    {
      id: 'persona',
      name: 'Persona',
      icon: 'Heart',
      coverage_pct: 50,
      summary: 'Profilo Giuseppe · ambizioni · paure · eredità',
      details: [
        'Ambizione: lasciare azienda solida ai figli',
        'Paura: conflitti familiari post-passaggio',
        'Hobby: vela, vino, motori d\'epoca',
      ],
    },
    {
      id: 'passioni',
      name: 'Passioni',
      icon: 'Sparkles',
      coverage_pct: 40,
      summary: 'Vela · vino · auto d\'epoca · arte contemporanea',
      details: [
        'Barca a vela 16m · regate Genova',
        'Cantina personale 800 bottiglie · Barolo, Brunello',
        'Collezione: 3 Ferrari storiche · 1 Maserati',
      ],
    },
    {
      id: 'real_estate',
      name: 'Real Estate',
      icon: 'Home',
      coverage_pct: 80,
      summary: '4 immobili · valore stimato €12M · Milano + Liguria + Toscana',
      details: [
        'Casa principale Milano · €4.5M',
        'Villa Portofino · €5M (in valutazione vendita)',
        'Casa Toscana 50 ettari · €2M',
        'Ufficio Milano (PropCo) · €500k',
      ],
    },
    {
      id: 'tax',
      name: 'Tax',
      icon: 'Receipt',
      coverage_pct: 65,
      summary: 'Pianificazione successoria in stesura · Trust opzione',
      details: [
        'Studio Picotti tax advisor',
        'Valutazione Trust Lussemburghese vs Olanda',
        'Stima imposta successione attuale: €2.5M',
        'Target ottimizzazione: -60%',
      ],
    },
  ],

  alert_attivi: [
    {
      id: 'alert-1',
      level: 'high',
      title: 'Norma AE su Trust opachi rilevante',
      description: 'Modifica circolare AE 23/E del 04/2026 impatta direttamente la pianificazione Trust di Famiglia Bianchi',
      source: 'Agenzia Entrate · 28/04/2026',
      action: 'Discutere con Picotti entro 7 giorni',
    },
    {
      id: 'alert-2',
      level: 'medium',
      title: 'Multipli M&A meccanica salgono',
      description: 'Settore meccanica precision parts: multipli EV/EBITDA passati da 6-7x a 7-8x in Q1 2026',
      source: 'Mergermarket benchmark',
      action: 'Aggiornare valuation MBO',
    },
    {
      id: 'alert-3',
      level: 'low',
      title: 'Mercato vela usato in flessione -15%',
      description: 'Eventuale dismissione barca: timing meno favorevole nel 2026',
      source: 'Yachting Industry Report',
    },
  ],

  decisioni_pendenti: [
    {
      id: 'dec-1',
      priority: 'high',
      title: 'Vendita Villa Portofino',
      description: 'Bozza decisione da finalizzare. 2 offerte ricevute, range €4.8-5.2M',
      due_date: '2026-05-30',
    },
    {
      id: 'dec-2',
      priority: 'high',
      title: 'Approvazione struttura Trust',
      description: 'Scelta Lussemburgo vs Olanda. Picotti ha presentato analisi comparativa',
      due_date: '2026-06-15',
    },
    {
      id: 'dec-3',
      priority: 'medium',
      title: 'Allocazione successiva 40% azienda',
      description: 'Quota residua post-MBO: trasmissione a Luca diretta o tramite holding',
      due_date: '2026-09-30',
    },
  ],

  timeline_tocchi: [
    { date: '2026-05-08', type: 'meeting', actor: 'Marco Vittoni', summary: 'Update mensile MBO + valutazione' },
    { date: '2026-04-28', type: 'email', actor: 'Picotti (Tax)', summary: 'Documento analisi Trust LUX vs NL' },
    { date: '2026-04-22', type: 'call', actor: 'Enrico Viganò', summary: 'Aggiornamento bilancio Q1 2026' },
    { date: '2026-04-15', type: 'meeting', actor: 'Marco + Luca Bianchi', summary: 'Definizione team MBO' },
    { date: '2026-04-08', type: 'event', actor: 'Minerva Event', summary: 'Cena UHNW · Villa d\'Este' },
  ],

  knowledge_casi_simili: [
    {
      id: 'case-1',
      title: 'Famiglia Rossi (Tessile, 2024)',
      summary: 'Stesso pattern F1 Family BO + transizione G1→G2. Strutturato MBO con earnout 3 anni.',
      similarity_pct: 85,
    },
    {
      id: 'case-2',
      title: 'Famiglia Verdi (Alimentare, 2023)',
      summary: 'F9 Generational Transition + C6_5 Family Constitution. Trust LUX implementato.',
      similarity_pct: 72,
    },
    {
      id: 'case-3',
      title: 'Famiglia Costa (Real Estate, 2025)',
      summary: 'F3 PropCo OpCo Split per separare immobili da operativa. Risultato: -€800k tasse.',
      similarity_pct: 68,
    },
  ],
}
