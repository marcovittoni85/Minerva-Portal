import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  TabStopPosition,
  TabStopType,
  BorderStyle,
} from "docx";

const MINERVA = {
  name: "Minerva Partners Srl",
  address: "Via Santa Maria Segreta 6, 20123 Milano (MI), Italia",
  vat: "IT12345678901",
  legalRep: "Managing Partner",
};

function buildNDADocument(
  lang: "it" | "en",
  deal: { code: string; title: string },
  counterparty: {
    name: string;
    company: string;
    vat: string;
    address: string;
    legalRep: string;
    email: string;
  }
): Document {
  const isIT = lang === "it";
  const today = new Date().toLocaleDateString(isIT ? "it-IT" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const title = isIT
    ? "ACCORDO DI RISERVATEZZA E NON CIRCUMVENZIONE"
    : "NON-DISCLOSURE AGREEMENT";

  const subtitle = isIT
    ? `Relativo all'operazione: ${deal.code} — ${deal.title}`
    : `Relating to the transaction: ${deal.code} — ${deal.title}`;

  const preamble = isIT
    ? [
        `Il presente Accordo di Riservatezza e Non Circumvenzione ("Accordo") è stipulato in data ${today} tra:`,
        `${MINERVA.name}, con sede legale in ${MINERVA.address}, P.IVA ${MINERVA.vat}, in persona del legale rappresentante pro tempore (di seguito "Parte Divulgante" o "Minerva");`,
        `${counterparty.company}, con sede legale in ${counterparty.address}, P.IVA/C.F. ${counterparty.vat}, in persona di ${counterparty.legalRep} (di seguito "Parte Ricevente");`,
        `(congiuntamente le "Parti" e singolarmente la "Parte").`,
      ]
    : [
        `This Non-Disclosure Agreement ("Agreement") is entered into on ${today} between:`,
        `${MINERVA.name}, having its registered office at ${MINERVA.address}, VAT No. ${MINERVA.vat}, represented by its legal representative (hereinafter the "Disclosing Party" or "Minerva");`,
        `${counterparty.company}, having its registered office at ${counterparty.address}, Registration No. ${counterparty.vat}, represented by ${counterparty.legalRep} (hereinafter the "Receiving Party");`,
        `(collectively the "Parties" and individually a "Party").`,
      ];

  const articles = isIT
    ? [
        {
          title: "Articolo 1 — Premesse e Scopo",
          body: `Le Parti intendono scambiarsi informazioni riservate relative all'operazione identificata come "${deal.code} — ${deal.title}" (l'"Operazione") al fine di valutare un possibile interesse reciproco. Il presente Accordo disciplina gli obblighi di riservatezza e non circumvenzione delle Parti in relazione a tali informazioni.`,
        },
        {
          title: "Articolo 2 — Definizione di Informazioni Riservate",
          body: `Per "Informazioni Riservate" si intendono tutte le informazioni, dati, documenti, analisi, studi, report, piani industriali, dati finanziari, informazioni commerciali, know-how, segreti commerciali e qualsiasi altra informazione di natura riservata, trasmessa in qualsiasi forma (scritta, orale, elettronica o altro), relativa all'Operazione, alle Parti o alle società da esse controllate, collegate o rappresentate.`,
        },
        {
          title: "Articolo 3 — Obblighi di Riservatezza",
          body: `La Parte Ricevente si impegna a: (a) mantenere strettamente riservate le Informazioni Riservate; (b) non divulgare le Informazioni Riservate a terzi senza il previo consenso scritto della Parte Divulgante; (c) utilizzare le Informazioni Riservate esclusivamente ai fini della valutazione dell'Operazione; (d) limitare l'accesso alle Informazioni Riservate ai propri dipendenti, consulenti e collaboratori che abbiano necessità di conoscerle, vincolandoli a obblighi di riservatezza non meno restrittivi di quelli previsti dal presente Accordo.`,
        },
        {
          title: "Articolo 4 — Non Circumvenzione",
          body: `La Parte Ricevente si impegna a non contattare direttamente o indirettamente, né a intraprendere trattative o concludere accordi con i soggetti presentati dalla Parte Divulgante in relazione all'Operazione, senza il preventivo consenso scritto della Parte Divulgante. Tale obbligo si estende a qualsiasi società controllata, collegata o affiliata alla Parte Ricevente.`,
        },
        {
          title: "Articolo 5 — Esclusioni",
          body: `Gli obblighi di riservatezza di cui al presente Accordo non si applicano alle informazioni che: (a) siano o divengano di pubblico dominio senza violazione del presente Accordo; (b) fossero già in possesso della Parte Ricevente prima della divulgazione; (c) siano ricevute legittimamente da terzi non vincolati da obblighi di riservatezza; (d) siano sviluppate indipendentemente dalla Parte Ricevente; (e) debbano essere divulgate per obbligo di legge o su ordine dell'autorità.`,
        },
        {
          title: "Articolo 6 — Durata",
          body: `Il presente Accordo ha efficacia dalla data della sua sottoscrizione e gli obblighi di riservatezza e non circumvenzione rimarranno in vigore per un periodo di ventiquattro (24) mesi dalla data di sottoscrizione, indipendentemente dall'esito dell'Operazione.`,
        },
        {
          title: "Articolo 7 — Restituzione dei Documenti",
          body: `Al termine delle trattative o su richiesta della Parte Divulgante, la Parte Ricevente si impegna a restituire o distruggere tempestivamente tutte le Informazioni Riservate ricevute, incluse eventuali copie, e a certificare per iscritto l'avvenuta restituzione o distruzione.`,
        },
        {
          title: "Articolo 8 — Rimedi",
          body: `Le Parti riconoscono che qualsiasi violazione del presente Accordo potrebbe causare un danno irreparabile alla Parte Divulgante. Pertanto, la Parte Divulgante avrà diritto a richiedere provvedimenti cautelari e/o ingiuntivi, oltre al risarcimento di tutti i danni subiti.`,
        },
        {
          title: "Articolo 9 — Legge Applicabile e Foro Competente",
          body: `Il presente Accordo è regolato dalla legge italiana. Per qualsiasi controversia derivante da o connessa al presente Accordo, sarà competente in via esclusiva il Foro di Milano.`,
        },
        {
          title: "Articolo 10 — Disposizioni Finali",
          body: `Il presente Accordo costituisce l'intero accordo tra le Parti in merito al suo oggetto e sostituisce qualsiasi precedente intesa, negoziazione o accordo, scritto o orale. Eventuali modifiche al presente Accordo dovranno essere concordate per iscritto e sottoscritte da entrambe le Parti.`,
        },
      ]
    : [
        {
          title: "Article 1 — Premises and Purpose",
          body: `The Parties intend to exchange confidential information relating to the transaction identified as "${deal.code} — ${deal.title}" (the "Transaction") in order to evaluate their mutual interest. This Agreement governs the Parties' confidentiality and non-circumvention obligations in relation to such information.`,
        },
        {
          title: "Article 2 — Definition of Confidential Information",
          body: `"Confidential Information" means all information, data, documents, analyses, studies, reports, business plans, financial data, commercial information, know-how, trade secrets and any other information of a confidential nature, transmitted in any form (written, oral, electronic or otherwise), relating to the Transaction, the Parties or their controlled, affiliated or represented companies.`,
        },
        {
          title: "Article 3 — Confidentiality Obligations",
          body: `The Receiving Party undertakes to: (a) keep the Confidential Information strictly confidential; (b) not disclose the Confidential Information to third parties without the prior written consent of the Disclosing Party; (c) use the Confidential Information solely for the purpose of evaluating the Transaction; (d) limit access to the Confidential Information to its employees, advisors and collaborators who need to know, binding them to confidentiality obligations no less restrictive than those set out in this Agreement.`,
        },
        {
          title: "Article 4 — Non-Circumvention",
          body: `The Receiving Party undertakes not to contact, directly or indirectly, nor to enter into negotiations or conclude agreements with the parties introduced by the Disclosing Party in relation to the Transaction, without the prior written consent of the Disclosing Party. This obligation extends to any company controlled by, affiliated with or related to the Receiving Party.`,
        },
        {
          title: "Article 5 — Exclusions",
          body: `The confidentiality obligations under this Agreement shall not apply to information that: (a) is or becomes publicly available without breach of this Agreement; (b) was already in the possession of the Receiving Party prior to disclosure; (c) is lawfully received from third parties not bound by confidentiality obligations; (d) is independently developed by the Receiving Party; (e) must be disclosed by law or by order of a competent authority.`,
        },
        {
          title: "Article 6 — Duration",
          body: `This Agreement shall be effective from the date of its execution and the confidentiality and non-circumvention obligations shall remain in force for a period of twenty-four (24) months from the date of execution, regardless of the outcome of the Transaction.`,
        },
        {
          title: "Article 7 — Return of Documents",
          body: `Upon termination of negotiations or at the request of the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information received, including any copies, and shall certify in writing that such return or destruction has been completed.`,
        },
        {
          title: "Article 8 — Remedies",
          body: `The Parties acknowledge that any breach of this Agreement may cause irreparable harm to the Disclosing Party. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief and/or interim measures, in addition to compensation for all damages suffered.`,
        },
        {
          title: "Article 9 — Governing Law and Jurisdiction",
          body: `This Agreement shall be governed by Italian law. For any dispute arising out of or in connection with this Agreement, the Courts of Milan shall have exclusive jurisdiction.`,
        },
        {
          title: "Article 10 — Final Provisions",
          body: `This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes any prior understanding, negotiation or agreement, whether written or oral. Any amendments to this Agreement must be agreed in writing and signed by both Parties.`,
        },
      ];

  const signatureBlock = isIT
    ? [
        "Letto, approvato e sottoscritto.",
        "",
        `Per ${MINERVA.name}`,
        "Nome: ___________________________",
        "Titolo: ___________________________",
        "Firma: ___________________________",
        "Data: ___________________________",
        "",
        `Per ${counterparty.company}`,
        `Nome: ${counterparty.legalRep}`,
        "Titolo: ___________________________",
        "Firma: ___________________________",
        "Data: ___________________________",
      ]
    : [
        "Read, approved and signed.",
        "",
        `For ${MINERVA.name}`,
        "Name: ___________________________",
        "Title: ___________________________",
        "Signature: ___________________________",
        "Date: ___________________________",
        "",
        `For ${counterparty.company}`,
        `Name: ${counterparty.legalRep}`,
        "Title: ___________________________",
        "Signature: ___________________________",
        "Date: ___________________________",
      ];

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: title, bold: true, size: 32, font: "Calibri" }),
      ],
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({ text: subtitle, italics: true, size: 22, font: "Calibri", color: "666666" }),
      ],
    })
  );

  // Preamble
  for (const line of preamble) {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: line, size: 22, font: "Calibri" })],
      })
    );
  }

  // Separator
  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }));

  // Articles
  for (const article of articles) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({ text: article.title, bold: true, size: 24, font: "Calibri" }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: article.body, size: 22, font: "Calibri" })],
      })
    );
  }

  // Separator before signatures
  children.push(new Paragraph({ spacing: { after: 400 }, children: [] }));

  // Signature block
  for (const line of signatureBlock) {
    children.push(
      new Paragraph({
        spacing: { after: line === "" ? 200 : 80 },
        children: [
          new TextRun({
            text: line,
            size: 22,
            font: "Calibri",
            bold: line.startsWith("Per ") || line.startsWith("For "),
          }),
        ],
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { dealId, language, counterparty_vat, counterparty_address, counterparty_legal_rep, counterparty_email } =
    await req.json();

  if (!dealId || !language || !counterparty_vat || !counterparty_address || !counterparty_legal_rep || !counterparty_email) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  if (!["it", "en"].includes(language)) {
    return NextResponse.json({ error: "Lingua non valida" }, { status: 400 });
  }

  // Verify user has approved presentation request
  const { data: request } = await supabase
    .from("deal_activity_log")
    .select("id, details")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .eq("action", "presentation_requested")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!request || (request.details as any)?.status !== "approved") {
    return NextResponse.json({ error: "Nessuna richiesta di presentazione approvata" }, { status: 403 });
  }

  const details = request.details as any;

  // Get deal info
  const { data: deal } = await supabase.from("deals").select("code, title").eq("id", dealId).single();
  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Build NDA document
  const doc = buildNDADocument(language as "it" | "en", deal, {
    name: details.counterparty_name,
    company: details.counterparty_company,
    vat: counterparty_vat,
    address: counterparty_address,
    legalRep: counterparty_legal_rep,
    email: counterparty_email,
  });

  const buffer = await Packer.toBuffer(doc);

  const filename = `NDA_${deal.code}_${details.counterparty_company.replace(/[^a-zA-Z0-9]/g, "_")}_${language.toUpperCase()}.docx`;

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
