import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurata" }, { status: 500 });
  }

  const body = await req.json();
  const { checklist_data, asset_class } = body;

  if (!checklist_data) return NextResponse.json({ error: "checklist_data mancante" }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Sei un advisor M&A di Minerva Partners. Genera un titolo blind e una descrizione blind per un deal basandoti sui dati della checklist.

REGOLE:
- Il titolo deve essere generico, senza nomi di aziende o persone (max 80 caratteri)
- La descrizione deve essere di 2-3 righe, senza dati identificativi, max 300 caratteri
- Usa un tono professionale da investment banking
- Non inventare dati non presenti nella checklist

Asset class: ${asset_class || "N/A"}
Dati checklist: ${JSON.stringify(checklist_data)}

Rispondi SOLO con un JSON valido:
{"blind_title": "...", "blind_description": "..."}`,
    }],
  });

  const textBlock = message.content.find(b => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "Nessuna risposta dall'AI" }, { status: 500 });
  }

  let rawJson = textBlock.text;
  const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) rawJson = jsonMatch[1];

  try {
    const result = JSON.parse(rawJson.trim());
    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Impossibile parsare la risposta AI" }, { status: 500 });
  }
}
