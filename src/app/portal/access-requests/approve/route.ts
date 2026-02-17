import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const formData = await req.formData();
  const requestId = formData.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "ID richiesta mancante" }, { status: 400 });
  }

  // 1. Recupero la richiesta
  const { data: request, error: fetchError } = await supabase
    .from("deal_access_requests")
    .select("id, deal_id, user_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  }

  // 2. Recupero profilo e deal separatamente
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", request.user_id).single();
  const { data: deal } = await supabase.from("deals").select("title").eq("id", request.deal_id).single();

  // 3. Aggiorno lo stato
  const vdrLink = "https://minervapartners.it/portal/deals/" + request.deal_id;

  const { error: updateError } = await supabase
    .from("deal_access_requests")
    .update({ status: "ACCESS_APPROVED", vdr_link: vdrLink })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: "Errore durante l'aggiornamento" }, { status: 500 });
  }

  // 4. Webhook Make (opzionale)
  const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/tuo_id_webhook";
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        partnerName: profile?.full_name || "Partner",
        partnerPhone: profile?.phone,
        dealTitle: deal?.title,
        vdrLink: vdrLink,
      }),
    });
  } catch (e) {
    console.error("Errore invio a Make:", e);
  }

  return NextResponse.redirect(new URL("/portal/access-requests", req.url), { status: 303 });
}