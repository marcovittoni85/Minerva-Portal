import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import type { AssetClass } from "@/lib/deal-config";

export const maxDuration = 120;

const PROMPTS: Record<AssetClass, string> = {
  m_and_a: `Analizza questo documento relativo a un'operazione M&A. Estrai e restituisci SOLO un JSON valido con questi campi:
{
  "sector": "settore dell'azienda",
  "revenue": numero fatturato ultimo esercizio in EUR (solo numero, senza valuta),
  "ebitda": numero EBITDA in EUR (solo numero),
  "employees": numero dipendenti (solo numero),
  "sell_reason": "motivazione vendita/acquisto",
  "price_range": "prezzo indicativo o range",
  "operation_type": "100% | maggioranza | minoranza | aumento capitale",
  "mandate": "esclusiva | generico | nessuno",
  "timeline": "timeline attesa",
  "title": "titolo descrittivo dell'operazione",
  "blind_description": "descrizione di 2-3 righe senza dati identificativi, max 300 caratteri",
  "ev_range": "valore stimato o range EV"
}
Se un dato non è presente nel documento, metti null. Non inventare dati.`,

  real_estate: `Analizza questo documento relativo a un'operazione immobiliare. Estrai e restituisci SOLO un JSON valido con:
{
  "property_type": "residenziale | commerciale | industriale | hospitality | terreno | sviluppo",
  "location": "città e zona",
  "surface_sqm": numero metri quadri (solo numero),
  "yield": "rendimento lordo/netto se a reddito",
  "asking_price": numero prezzo richiesto in EUR (solo numero),
  "state": "libero | locato | da ristrutturare",
  "title": "titolo descrittivo dell'operazione",
  "blind_description": "descrizione di 2-3 righe senza dati identificativi, max 300 caratteri",
  "ev_range": "valore stimato o range EV"
}
Se un dato non è presente nel documento, metti null. Non inventare dati.`,

  club_deal: `Analizza questo documento relativo a un investimento finanziario. Estrai SOLO un JSON valido con:
{
  "sector": "settore",
  "min_ticket": numero ticket minimo in EUR (solo numero),
  "target_return": "rendimento target",
  "time_horizon": "orizzonte temporale",
  "vehicle_structure": "SPV | fondo | co-investimento diretto",
  "sponsor": "nome gestore/sponsor",
  "track_record": "track record se disponibile",
  "title": "titolo descrittivo dell'operazione",
  "blind_description": "descrizione di 2-3 righe senza dati identificativi, max 300 caratteri",
  "ev_range": "valore stimato o range EV"
}
Se un dato non è presente nel documento, metti null. Non inventare dati.`,

  strategy: `Analizza questo documento relativo a un mandato di consulenza. Estrai SOLO un JSON valido con:
{
  "subject": "oggetto",
  "scope": "scope del lavoro",
  "duration": "durata stimata",
  "proposed_fee": numero fee proposta in EUR (solo numero),
  "deliverables": "deliverable attesi",
  "title": "titolo descrittivo dell'operazione",
  "blind_description": "descrizione di 2-3 righe senza dati identificativi, max 300 caratteri",
  "ev_range": "valore stimato o range EV"
}
Se un dato non è presente nel documento, metti null. Non inventare dati.`,

  wealth_management: `Analizza questo documento relativo a wealth management. Estrai SOLO un JSON valido con:
{
  "client_aum": "patrimonio indicativo",
  "composition": "composizione attuale (% immobili, % finanziario, % azienda)",
  "main_goal": "diversificazione | protezione | passaggio generazionale | ottimizzazione fiscale",
  "urgency": "immediata | 1-3 mesi | 3-6 mesi | 6-12 mesi",
  "title": "titolo descrittivo dell'operazione",
  "blind_description": "descrizione di 2-3 righe senza dati identificativi, max 300 caratteri",
  "ev_range": "valore stimato o range EV"
}
Se un dato non è presente nel documento, metti null. Non inventare dati.`,
};

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type ImageMediaType = typeof SUPPORTED_IMAGE_TYPES[number];

function isImageType(mime: string): mime is ImageMediaType {
  return SUPPORTED_IMAGE_TYPES.includes(mime as ImageMediaType);
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
    if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurata" }, { status: 500 });
  }

  const body = await req.json();
  const { asset_class, file_paths } = body as {
    asset_class: AssetClass;
    file_paths: string[];
  };

  if (!asset_class || !PROMPTS[asset_class]) {
    return NextResponse.json({ error: "asset_class non valido" }, { status: 400 });
  }
  if (!file_paths || file_paths.length === 0) {
    return NextResponse.json({ error: "Nessun file da analizzare" }, { status: 400 });
  }

  // Download files from Supabase Storage and build content blocks
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  for (const filePath of file_paths) {
    const { data: fileData, error: dlError } = await supabase.storage
      .from("deal-documents")
      .download(filePath);

    if (dlError || !fileData) continue;

    const mime = fileData.type;
    const buffer = Buffer.from(await fileData.arrayBuffer());

    if (mime === "application/pdf") {
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: buffer.toString("base64"),
        },
      });
    } else if (isImageType(mime)) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mime,
          data: buffer.toString("base64"),
        },
      });
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword"
    ) {
      // Convert DOCX/DOC to text via mammoth
      const result = await mammoth.extractRawText({ buffer });
      if (result.value) {
        contentBlocks.push({
          type: "text",
          text: `[Contenuto documento Word: ${filePath}]\n${result.value}`,
        });
      }
    } else {
      // Fallback: try to read as text
      const text = buffer.toString("utf-8");
      if (text.length > 0) {
        contentBlocks.push({
          type: "text",
          text: `[File: ${filePath}]\n${text}`,
        });
      }
    }
  }

  if (contentBlocks.length === 0) {
    return NextResponse.json({ error: "Nessun file leggibile trovato" }, { status: 400 });
  }

  // Add the extraction prompt
  contentBlocks.push({ type: "text", text: PROMPTS[asset_class] });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  // Extract JSON from the response
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Nessuna risposta dall'AI" }, { status: 500 });
  }

  // Parse JSON — Claude may wrap it in ```json ... ```
  let rawJson = textBlock.text;
  const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) rawJson = jsonMatch[1];

  try {
    const extracted = JSON.parse(rawJson.trim());
    return NextResponse.json({ data: extracted });
  } catch {
    return NextResponse.json({ error: "Impossibile parsare la risposta AI", raw: rawJson }, { status: 500 });
  }
}
