// ============================================================
// lib/generate-mandate-docx.ts — Generatore DOCX Mandato
// Minerva Partners — Contratto di Consulenza
// ============================================================
//
// Uso: chiamato dalla API route /api/mandates/generate
// Dipendenze: npm install docx (già nel progetto)
//
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopType,
  LevelFormat,
  BorderStyle,
  PageBreak,
} from 'docx';
import type { MandateData, ScopeSection } from '@/types/mandate';

// ── Costanti di design ──────────────────────────────────────
const FONT = 'Times New Roman';   // Standard per contratti italiani
const FONT_SIZE_BODY = 22;        // 11pt in half-points
const FONT_SIZE_TITLE = 28;       // 14pt
const FONT_SIZE_HEADING = 24;     // 12pt
const LINE_SPACING = 276;         // 1.15 line spacing (240 = single)
const NAVY = '001220';

// ── Minerva dati fissi ──────────────────────────────────────
const MINERVA = {
  name: 'Minerva Partners Srl',
  address: 'Via Roggia Vignola n. 9',
  city: '24047 Treviglio (BG)',
  cf_piva: '04708860160',
  registry: 'Registro delle Imprese di Bergamo',
  legal_rep: 'Marco Vittoni',
  pec: 'minervapartners@lamiapec.it',
};

// ── Helper functions ────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount).replace('€', 'Euro');
}

function numberToWords(n: number): string {
  // Semplificato — i casi più comuni per importi retainer
  const units = ['', 'mille', 'duemila', 'tremila', 'quattromila', 'cinquemila',
    'seimila', 'settemila', 'ottomila', 'novemila', 'diecimila',
    'quindicimila', 'ventimila', 'venticinquemila', 'trentamila',
    'cinquantamila', 'centomila'];
  const found = units.find((_, i) => {
    const vals = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000, 25000, 30000, 50000, 100000];
    return vals[i] === n;
  });
  return found || n.toLocaleString('it-IT');
}

function text(content: string, options: Record<string, unknown> = {}): TextRun {
  return new TextRun({
    text: content,
    font: FONT,
    size: FONT_SIZE_BODY,
    ...options,
  } as ConstructorParameters<typeof TextRun>[0]);
}

function boldText(content: string, options: Record<string, unknown> = {}): TextRun {
  return text(content, { bold: true, ...options });
}

function paragraph(children: TextRun[], options: Record<string, unknown> = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: LINE_SPACING },
    children,
    ...options,
  } as ConstructorParameters<typeof Paragraph>[0]);
}

function emptyLine(): Paragraph {
  return new Paragraph({ spacing: { after: 120 }, children: [] });
}

function articleHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120, line: LINE_SPACING },
    alignment: AlignmentType.LEFT,
    children: [boldText(title, { size: FONT_SIZE_HEADING })],
  });
}

function letterItem(letter: string, content: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100, line: LINE_SPACING },
    indent: { left: 360 },
    children: [text(`${letter}. ${content}`)],
  });
}

function numberedItem(number: string, content: TextRun[]): Paragraph {
  return new Paragraph({
    spacing: { after: 100, line: LINE_SPACING },
    children: [text(`${number}. `), ...content],
  });
}

// ── Main generator ──────────────────────────────────────────

export async function generateMandateDocx(data: MandateData): Promise<Buffer> {
  const clientFullName = `${data.client_company_name} ${data.client_legal_form}`;
  const clientShort = data.client_short_name || data.client_company_name;
  const expiryFormatted = new Date(data.expiry_date).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE_BODY },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0,
            format: LevelFormat.BULLET,
            text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // ── TITOLO ──────────────────────────────
          new Paragraph({
            spacing: { after: 360 },
            alignment: AlignmentType.CENTER,
            children: [boldText('CONTRATTO DI CONSULENZA', { size: FONT_SIZE_TITLE })],
          }),

          // ── PARTI ───────────────────────────────
          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
            children: [boldText('TRA')],
          }),

          paragraph([
            boldText(`${MINERVA.name}`),
            text(` con sede in Treviglio, ${MINERVA.address}, C.F., P.IVA e numero di iscrizione al ${MINERVA.registry} ${MINERVA.cf_piva}, in persona del legale rappresentante ${MINERVA.legal_rep};`),
          ]),
          paragraph([
            text('di seguito identificata anche come "'),
            boldText(MINERVA.name),
            text('" o "l\''),
            boldText('Advisor'),
            text('".'),
          ]),

          emptyLine(),

          new Paragraph({
            spacing: { after: 200 },
            alignment: AlignmentType.CENTER,
            children: [boldText('E')],
          }),

          paragraph([
            boldText(clientFullName),
            text(` con sede legale in ${data.client_registered_office}`),
            text(data.client_cf ? `, Codice Fiscale ${data.client_cf}` : ''),
            text(data.client_piva ? `, P.IVA ${data.client_piva}` : ''),
            text(`, nella persona ${data.client_legal_rep_role} di ${data.client_legal_rep_name};`),
          ]),
          paragraph([
            text('di seguito identificata anche come '),
            boldText(`"${clientShort}"`),
            text(' o il "'),
            boldText('Cliente'),
            text('" o la "'),
            boldText('Società'),
            text('".'),
          ]),

          paragraph([
            text('Congiuntamente chiamate insieme come le "'),
            boldText('Parti'),
            text('".'),
          ]),

          // ── ART 1: PREMESSE ─────────────────────
          articleHeading('Art 1: PREMESSE'),

          numberedItem('1', [
            boldText(clientShort),
            text(` ${data.client_description} Essa intende avvalersi dei servizi di ${MINERVA.name} per ${data.operation_description}`),
            text(data.operation_amount_min && data.operation_amount_max
              ? ` per un importo complessivo tra ${formatCurrency(data.operation_amount_min)} e ${formatCurrency(data.operation_amount_max)}`
              : ''),
            text(' (l\'"Operazione").'),
          ]),

          numberedItem('2', [
            boldText(MINERVA.name),
            text(` è in possesso delle competenze necessarie e specialistiche e dispone di adeguata organizzazione per ${data.minerva_scope_summary}`),
          ]),

          paragraph([
            text('Le premesse e gli allegati fanno parte integrante del presente contratto (il "Contratto").'),
          ]),

          // ── ART 2: OGGETTO ──────────────────────
          articleHeading('Art 2: OGGETTO'),

          paragraph([
            text(`Con il presente Contratto la Società conferisce a ${MINERVA.name}, che accetta, l'incarico di assisterla nell'Operazione ("Incarico"). Le principali attività oggetto dell'Incarico sono di natura finanziaria, strategica e organizzativa, meglio esplicitate nell'Allegato.`),
          ]),

          paragraph([text('Resta in ogni caso inteso che:')]),

          letterItem('a', `l'Incarico di ${MINERVA.name} ai sensi del presente Contratto è limitato esclusivamente alle attività elencate al presente articolo 2 e non comporta alcun impegno a prestare altre attività, quali, a titolo meramente esemplificativo e non esaustivo, attività di natura legale, amministrativa, fiscale, contabile, strategica, industriale, bancaria (ivi inclusa la concessione di credito) o tecnica in genere; qualora esse si dovessero presentare saranno definite tramite altro accordo/i specificatamente dedicato/i. Resta inoltre inteso che nessuna delle attività oggetto dell'Incarico rivestirà il carattere di attività riservata ai sensi della normativa vigente;`),

          letterItem('b', `le obbligazioni assunte da ${MINERVA.name} ai sensi del presente Contratto costituiscono obbligazioni di mezzi e non obbligazioni di risultato;`),

          letterItem('c', `${MINERVA.name} si impegna a dare esecuzione all'Incarico con la dovuta diligenza ed è responsabile esclusivamente in caso di dolo o colpa grave e comunque nei limiti dei compensi effettivamente percepiti;`),

          letterItem('d', `${MINERVA.name} non sarà responsabile della mancata, tardiva o inesatta esecuzione delle attività dovute ad impossibilità di operare derivante da cause ad essa non imputabili;`),

          letterItem('e', `${MINERVA.name} potrà collaborare con gli eventuali altri consulenti esterni nominati dalla Società, i cui costi saranno integralmente a carico della Società medesima;`),

          letterItem('f', `${MINERVA.name} potrà nominare propri consulenti esterni, il cui costo sarà a proprio carico, salvo diverso specifico accordo;`),

          letterItem('g', 'qualora sia richiesta la prestazione di attività non esplicitamente previste, il relativo compenso dovrà essere concordato per iscritto.'),

          // ── ART 3: IMPEGNI DELLA SOCIETA' ───────
          articleHeading("Art. 3: IMPEGNI DELLA SOCIETA'"),

          paragraph([text('1. La Società si impegna:')]),

          letterItem('a', `a fornire tempestivamente, direttamente o indirettamente, a ${MINERVA.name}, dietro sua richiesta, documenti, dati ed informazioni necessari per lo svolgimento dell'Incarico di cui al presente Contratto (i "Dati"). La Società pertanto (i) si impegna e garantisce che tali Dati siano completi, accurati e non fuorvianti e che essa ne è la legittima titolare o comunque è autorizzata a disporne e a comunicarli a terzi, (ii) prende atto che, ai fini dello svolgimento dell'Incarico, ${MINERVA.name} farà affidamento sulla completezza, accuratezza e veridicità dei Dati senza provvedere ad una verifica autonoma ed indipendente e (iii) esonera ${MINERVA.name}, ai fini dell'esecuzione delle attività oggetto del presente Contratto, dalle eventuali responsabilità derivanti dal fatto che i Dati forniti non siano completi o accurati o siano fuorvianti ovvero laddove essi non siano forniti con la dovuta tempestività ovvero laddove la Società non sia autorizzata a disporne e a comunicarli a terzi;`),

          letterItem('b', `a far sì che il proprio management cooperi con ${MINERVA.name}, in conformità con gli impegni assunti in relazione all'Incarico, in particolare nel mettere tempestivamente a disposizione e/o predisporre qualsiasi ragionevole elemento (dati finanziari, giuridici, tecnici, commerciali, etc.) necessaria o utile per lo svolgimento dell'Incarico;`),

          letterItem('c', `non compiere atti incompatibili o che siano di ostacolo con lo svolgimento dell'Incarico da parte di ${MINERVA.name};`),

          letterItem('d', `comunicare tempestivamente a ${MINERVA.name} eventuali fatti o informazioni di cui dovesse venire a conoscenza che siano tali da rendere qualsiasi Dato e/o dichiarazione e garanzia precedentemente rilasciata non veritieri, non accurati, incompleti o ingannevoli, nonché comunicare tempestivamente a ${MINERVA.name} ogni eventuale ed ulteriore informazione, circostanza, fatto, operazione che possa essere rilevante ai fini dell'esecuzione del presente Contratto (quali, a titolo esemplificativo e non esaustivo, informazioni relative a variazioni significative della struttura societaria, della situazione finanziaria e dei risultati economici della Società, allo stato di liquidazione, all'apertura di procedure concorsuali, all'eventuale richiesta di dichiarazione di fallimento, ecc.);`),

          letterItem('e', `consentire a ${MINERVA.name} di prendere contatto diretto con, ed acquisire direttamente informazioni presso il management e qualunque organo vicino ad esso (ad es. il collegio sindacale, i revisori contabili e i consulenti della Società), previo consenso della Società che non sarà irragionevolmente negato;`),

          letterItem('f', `non effettuare annunci o comunicati relativi alla Società e/o alle attività oggetto del presente Contratto che citino altresì ${MINERVA.name}, senza aver ottenuto il preventivo consenso di quest'ultima. Restano escluse le informazioni la cui comunicazione o divulgazione siano imposte da disposizioni di legge o di regolamento applicabili alle Parti, da autorità giudiziarie competenti ovvero da altre autorità pubbliche e/o di controllo, ovvero siano effettuate nell'ambito di un qualsiasi procedimento amministrativo, fiscale o giudiziario.`),

          // ── ART 4: COMPENSI ─────────────────────
          articleHeading('Art. 4: COMPENSI'),

          paragraph([
            text(`Le Parti concordano che per le attività previste dal presente Incarico, la Società corrisponderà a ${MINERVA.name}:`),
          ]),

          // Fee structure dinamica
          ...generateFeeSection(data),

          // ── ART 5: FATTURAZIONE ─────────────────
          articleHeading('Art 5: FATTURAZIONE E PAGAMENTI'),

          numberedItem('1', [
            text(`I compensi definiti nell'articolo 4 saranno effettuati attraverso bonifico bancario da ${clientFullName} a favore di ${MINERVA.name}.`),
          ]),

          numberedItem('2', [
            text(`${MINERVA.name} indicherà in fattura il conto corrente bancario sul quale effettuare il bonifico.`),
          ]),

          // ── ART 6: DURATA ──────────────────────
          articleHeading('Art 6: DURATA E DIRITTO DI RECESSO'),

          numberedItem('1', [
            text(`Il conferimento dell'Incarico ha durata dalla data di sottoscrizione in calce fino al perfezionamento dell'Operazione e comunque entro il ${expiryFormatted} (la "Data di Scadenza"), data in cui il presente Contratto cesserà improrogabilmente di avere efficacia senza necessità di ulteriori comunicazioni tra le Parti e con esclusione di tacito e/o automatico rinnovo, fermo restando che le Parti avranno facoltà di prorogarne gli effetti mediante accordo scritto concluso prima della Data di Scadenza.`),
          ]),

          numberedItem('2', [
            text(`Ciascuna Parte potrà recedere dal Contratto mediante una comunicazione per iscritta, a mezzo PEC o racc. a.r., restando inteso che il recesso avrà efficacia decorsi ${data.notice_period_days} giorni dalla data di ricevimento di tale comunicazione.`),
          ]),

          numberedItem('3', [
            text("Anche in caso di recesso ai sensi di quanto precede, i compensi restano applicabili secondo le modalità indicate nell'articolo 4"),
          ]),

          // ── ART 7: DICHIARAZIONI E GARANZIE ────
          articleHeading('Art 7: DICHIARAZIONI E GARANZIE DELLE PARTI'),

          paragraph([text("1. Ciascuna Parte dichiara all'altra, alla data di sottoscrizione del presente Contratto:")]),

          letterItem('a', 'di essere validamente costituita ed esistente e di trovarsi nel pieno e libero esercizio dei propri diritti;'),

          letterItem('b', 'di essere dotata di ogni potere ed autorità necessari per sottoscrivere il presente Contratto, e che tutte le delibere e gli altri adempimenti richiesti al fine di autorizzare la sottoscrizione e l\'esecuzione del presente Contratto, sono state regolarmente autorizzate e adottate;'),

          letterItem('c', "che la sottoscrizione e l'adempimento del presente Contratto non viola, né determina alcuna violazione di, alcuna disposizione contenuta in qualsivoglia contratto, atto, patto, statuto o delibera adottata o in qualsivoglia legge, regolamento o provvedimento giudiziario ad essa applicabile o di cui la stessa è parte."),

          paragraph([
            text(`2. La Società dichiara di non aver compiuto, e si impegna a non compiere, atti o attività che siano di ostacolo o incompatibili con il conferimento dell'Incarico a ${MINERVA.name} e/o con l'espletamento dell'Incarico da parte della stessa.`),
          ]),

          // ── ART 8: MANLEVA ─────────────────────
          articleHeading("Art. 8: MANLEVA E RESPONSABILITA' DELLA SOCIETA'"),

          paragraph([
            text(`1. La Società si impegna a tenere indenni e manlevati ${MINERVA.name}, i relativi amministratori, dirigenti, dipendenti (di seguito tutti quanti, anche disgiuntamente tra loro, i "Soggetti Manlevati"), da qualunque onere, costo, spesa, danno o conseguenza pregiudizievole (i "Danni") che i Soggetti Manlevati dovessero subire, direttamente o indirettamente, anche in conseguenza di qualsiasi contestazione, azione, domanda, procedimento, responsabilità o reclamo di terzi, in relazione (i) all'assunzione e allo svolgimento dell'Incarico di cui al presente Contratto e a qualunque attività allo stesso strumentale e/o connessa, e/o (ii) all'inadempimento della Società agli impegni assunti ai sensi del presente Contratto e/o (iii) nel caso in cui una qualunque delle dichiarazioni e garanzie e/o dei Dati rilasciati dalla Società ai sensi del presente Contratto risulti essere non veritiera, incompleta e/o non corretta, salvo che tali Danni siano conseguenti in maniera esclusiva e diretta al dolo o alla colpa grave dei Soggetti Manlevati e tale responsabilità sia accertata con decisione giudiziale/lodo anche provvisoriamente esecutiva/o.`),
          ]),

          paragraph([
            text("2. Resta espressamente inteso che la Società rimborserà ai Soggetti Manlevati ogni documentato costo, spesa od onere ragionevolmente sostenuti (ivi inclusi, a mero titolo esemplificativo ma non esaustivo, onorari e spese per consulenti) per la preparazione e/o la conduzione delle attività difensive, istruttorie e/o delle attività correlate in relazione a qualsiasi contestazione, azione, domanda, procedimento, responsabilità o reclamo di terzi oggetto degli obblighi di indennizzo e manleva riconosciuti dal presente articolo 8."),
          ]),

          paragraph([
            text(`3. ${MINERVA.name} si impegna, anche per conto degli altri eventuali Soggetti Manlevati, a comunicare tempestivamente alla Società l'avvio di qualsiasi procedimento o giudizio da parte di terzi o la ricezione di richieste o pretese scritte da parte di terzi dai quali possa derivare una responsabilità della Società ai sensi del presente articolo 8. In tal caso la Società, con costi, spese ed oneri a proprio esclusivo carico: (i) avrà diritto di esaminare le menzionate iniziative giudiziali o stragiudiziali e di nominare un legale di propria fiducia; (ii) si obbliga, anche tramite il proprio legale eventualmente nominato, a cooperare e coordinarsi con ${MINERVA.name} ed il legale di quest'ultima ai fini delle difese, nonché ad intervenire volontariamente in garanzia nel procedimento o nel giudizio.`),
          ]),

          paragraph([
            text(`4. I diritti di indennizzo e manleva riconosciuti dal presente articolo 8 non pregiudicano qualsiasi altro diritto previsto ai sensi di legge a favore di ${MINERVA.name} e/o degli altri Soggetti Manlevati.`),
          ]),

          // ── ART 9: RISOLUZIONE ─────────────────
          articleHeading('Art. 9: RISOLUZIONE DEL CONTRATTO'),

          paragraph([
            text(`1. In caso di inadempimento da parte della Società agli obblighi previsti agli articoli 3, 4, 7 e 12, ${MINERVA.name} avrà la facoltà di risolvere il Contratto, ai sensi dell'articolo 1456 del codice civile, mediante comunicazione scritta con la quale dichiara alla Società la volontà di avvalersi della presente clausola risolutiva espressa, fatto salvo in ogni caso il diritto al risarcimento del danno.`),
          ]),

          paragraph([
            text(`2. Resta inteso che in caso di risoluzione del Contratto ai sensi del punto 1 del presente articolo, a ${MINERVA.name} spetteranno le commissioni maturate ai sensi dell'articolo 4 e il rimborso delle spese eventualmente sostenute relative alle prestazioni già eseguite alla data della comunicazione di risoluzione, fatti salvi gli eventuali ulteriori danni subiti.`),
          ]),

          // ── ART 10: RISERVATEZZA ───────────────
          articleHeading('Art. 10: RISERVATEZZA'),

          paragraph([
            text(`${MINERVA.name} si impegna a non utilizzare il materiale informativo per altri scopi diversi da quelli previsti dal presente contratto. L'eventuale trattamento dei dati personali per Suo conto sarà effettuato nel rispetto della normativa applicabile (Reg. (UE) 2016/679 e D. Lgs 30 giugno 2003, n. 196).`),
          ]),

          // ── ART 11: FORO ───────────────────────
          articleHeading('Art. 11: FORO COMPETENTE'),

          paragraph([
            text(`Per ogni controversia che dovrà insorgere in relazione all'integrazione ed esecuzione del presente Contratto, le parti convengono che il Foro competente in via esclusiva è quello di ${data.jurisdiction}.`),
          ]),

          // ── ART 12: COMUNICAZIONI ──────────────
          articleHeading('Art. 12: COMUNICAZIONI'),

          paragraph([
            text("Qualsiasi comunicazione ai sensi del presente Contratto dovrà essere effettuata per iscritto, a mezzo lettera raccomandata a/r o PEC e si intenderà efficacemente e validamente eseguita a ricevimento della stessa, indirizzando come segue."),
          ]),

          emptyLine(),

          // Due colonne di indirizzi con tab stop
          new Paragraph({
            spacing: { after: 60 },
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            children: [
              text('Se a Minerva Partners Srl:', { underline: {} }),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              text('Se alla Società:', { underline: {} }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            children: [
              boldText(MINERVA.name),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              boldText(clientFullName),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            children: [
              text(MINERVA.address),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              text(data.client_comm_address || data.client_registered_office),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            children: [
              text(MINERVA.city),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              text(''),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            children: [
              text(`PEC: ${MINERVA.pec}`),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              text(`PEC: ${data.client_comm_pec || data.client_pec || '_______________'}`),
            ],
          }),

          // ── ART 13: DISPOSIZIONI FINALI ────────
          articleHeading('Art. 13: DISPOSIZIONI FINALI'),

          numberedItem('1', [
            text(`Ogni modifica o integrazione del presente Contratto dovrà essere preventivamente concordata tra la Società e ${MINERVA.name} in forma scritta.`),
          ]),

          numberedItem('2', [
            text("L'eventuale tolleranza, da parte di una delle Parti, di comportamenti dell'altra Parte posti in essere in violazione delle disposizioni contenute nel presente Contratto, non costituisce rinuncia ai diritti derivanti dalle disposizioni violate né al diritto di esigere l'esatto adempimento di tutti i termini e le condizioni qui previsti."),
          ]),

          numberedItem('3', [
            text("L'eventuale nullità, annullabilità e/o comunque inefficacia, parziale o totale, di singole clausole del presente Contratto non determinerà la nullità, annullabilità e/o inefficacia delle restanti clausole. Le clausole ritenute invalide o inefficaci saranno interpretate o sostituite in maniera tale da riflettere il più fedelmente possibile l'intento contrattuale delle Parti."),
          ]),

          numberedItem('4', [
            text("Il presente Contratto annulla e sostituisce integralmente — a far data dalla sua efficacia — ogni precedente contratto, accordo, convenzione, rapporto, pattuizione e/o intesa scritta o verbale in essere tra le Parti relativamente allo stesso oggetto e costituisce la manifestazione integrale degli accordi conclusi tra le Parti su tale oggetto."),
          ]),

          numberedItem('5', [
            text("Le Parti riconoscono e concordano che le disposizioni del presente Contratto sono state oggetto di negoziazione tra le Parti medesime, pertanto, gli articoli 1341 e 1342 del Codice civile non trovano applicazione al presente Contratto."),
          ]),

          // ── CHIUSURA ───────────────────────────
          emptyLine(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
            children: [boldText('* * * * *')],
          }),

          paragraph([
            text("Se d'accordo con quanto sopra, vogliate restituirci copia della presente da Voi sottoscritta in segno di piena accettazione,"),
          ]),

          paragraph([text('Cordiali saluti,')], { indent: { left: 720 } }),

          emptyLine(),
          emptyLine(),

          // Firme
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            spacing: { after: 60 },
            children: [
              text('_________________________'),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              text('_________________________'),
            ],
          }),
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
            spacing: { after: 200 },
            children: [
              boldText(MINERVA.name),
              new TextRun({ font: FONT, size: FONT_SIZE_BODY, children: ['\t'] }),
              boldText(clientFullName),
            ],
          }),

          // ── PAGE BREAK → ALLEGATO ──────────────
          new Paragraph({ children: [new PageBreak()] }),

          // ── ALLEGATO ───────────────────────────
          new Paragraph({
            spacing: { after: 240 },
            alignment: AlignmentType.CENTER,
            children: [boldText('Allegato', { size: FONT_SIZE_TITLE })],
          }),

          paragraph([
            text(`L'Incarico affidato a ${MINERVA.name} per conto di ${clientFullName} si articola nei seguenti obiettivi tecnici:`),
          ]),

          // SOW sections dinamiche
          ...generateScopeOfWork(data.scope_of_work),

          // Notes
          ...(data.scope_notes ? [
            emptyLine(),
            paragraph([text(data.scope_notes, { italics: true })]),
          ] : []),

          // Footer SOW
          emptyLine(),
          paragraph([
            text("La Società di Advisor potrà estendere il perimetro delle sue attività sia come global coordinator che in ambito finanziario, organizzativo e commerciale, oltre assistere, se richiesto, nelle attività di natura legale e fiscale, avvalendosi di specialisti dedicati. Tali prestazioni verranno quotate separatamente rispetto al presente incarico.", { italics: true }),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

// ── Fee section generator ───────────────────────────────────

function generateFeeSection(data: MandateData): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  if (data.fee_type === 'custom' && data.custom_fee_text) {
    paragraphs.push(paragraph([text(data.custom_fee_text)]));
    return paragraphs;
  }

  // Retainer Fee
  if (data.fee_type === 'retainer_success' && data.retainer_amount) {
    const amountStr = formatCurrency(data.retainer_amount);
    const wordsStr = numberToWords(data.retainer_amount);

    paragraphs.push(new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      spacing: { after: 120, line: LINE_SPACING },
      children: [
        boldText('Retainer Fee'),
        text(data.retainer_description
          ? ` (${data.retainer_description}): `
          : ' (Supporto Propedeutico e Valutazione): '),
        text(`Un rimborso forfettario delle spese generali e per l'attività di strutturazione pari a euro ${data.retainer_amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })} (${wordsStr}/00) oltre IVA. Tale somma è da intendersi come una-tantum e non rimborsabile.`),
        text(data.retainer_deductible
          ? " Resta inteso che dette somme saranno detratte dalla Success Fee al momento del completamento dell'operazione."
          : ''),
      ],
    }));
  }

  // Success Fee
  if ((data.fee_type === 'retainer_success' || data.fee_type === 'success_only') && data.success_fee_percentage) {
    paragraphs.push(new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      spacing: { after: 120, line: LINE_SPACING },
      children: [
        boldText('Success Fee'),
        text(`: Una commissione pari al ${data.success_fee_percentage}% oltre IVA`),
        text(data.success_fee_base ? `, calcolata sull'ammontare dell'${data.success_fee_base}` : ''),
        text('. '),
        text(data.success_fee_description || `La commissione maturerà in caso di effettivo perfezionamento dell'Operazione.`),
      ],
    }));
  }

  // Flat Fee
  if (data.fee_type === 'flat_fee' && data.retainer_amount) {
    paragraphs.push(new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      spacing: { after: 120, line: LINE_SPACING },
      children: [
        boldText('Compenso: '),
        text(`Un compenso fisso pari a ${formatCurrency(data.retainer_amount)} oltre IVA per l'intero svolgimento dell'Incarico.`),
      ],
    }));
  }

  return paragraphs;
}

// ── Scope of Work generator ─────────────────────────────────

function generateScopeOfWork(sections: ScopeSection[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  sections.forEach((section, i) => {
    // Section heading
    paragraphs.push(new Paragraph({
      spacing: { before: 200, after: 100, line: LINE_SPACING },
      children: [boldText(`${i + 1}. ${section.title}:`)],
    }));

    // Bullet items
    section.items.forEach(item => {
      if (item.trim()) {
        paragraphs.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 80, line: LINE_SPACING },
          children: [text(item)],
        }));
      }
    });
  });

  return paragraphs;
}
