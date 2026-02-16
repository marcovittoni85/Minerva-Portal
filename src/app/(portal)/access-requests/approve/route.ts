import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const formData = await req.formData();
  const requestId = formData.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: "ID richiesta mancante" }, { status: 400 });
  }

  // 1. Recupero i dettagli della richiesta, dell'utente e del deal
  const { data: request, error: fetchError } = await supabase
    .from("deal_access_requests")
    .select(`
      id,
      deal_id,
      user_id,
      deals ( title ),
      profiles:user_id ( full_name, phone )
    `)
    .eq("id", requestId)
    .single();

  if (fetchError || !request) {
    return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  }

  // 2. Aggiorno lo stato su Supabase
  // Link alla pagina del deal nel portale
  const vdrLink = `https://minervapartners.it/portal/deals/${request.deal_id}`;

  const { error: updateError } = await supabase
    .from("deal_access_requests")
    .update({ 
      status: "ACCESS_APPROVED",
      vdr_link: vdrLink 
    })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json({ error: "Errore durante l'aggiornamento" }, { status: 500 });
  }

  // 3. Invio i dati a MAKE.COM (Webhook per WhatsApp)
  // Sostituisci questo URL con quello di Make
  const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/tuo_id_webhook";
  
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        partnerName: (request.profiles as any)?.full_name?.split(' ')[0] || "Partner", // Prendo solo il nome per essere più informale
        partnerPhone: (request.profiles as any)?.phone,
        dealTitle: (request.deals as any)?.title,
        vdrLink: vdrLink
      }),
    });
  } catch (e) {
    console.error("Errore invio a Make:", e);
  }

  // 4. Redirect alla lista richieste
  return NextResponse.redirect(new URL("/portal/access-requests", req.url), {
    status: 303,
  });
}