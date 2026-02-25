import { supabaseServer } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const formData = await req.formData();
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

  const { data: request, error: fetchError } = await supabase
    .from("deal_access_requests")
    .select("id, deal_id, user_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });

  const { data: deal } = await supabase.from("deals").select("title, originator_id").eq("id", request.deal_id).single();
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", request.user_id).single();

  const vdrLink = "https://minervapartners.it/portal/deals/" + request.deal_id;

  // Update request
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { error: updateError } = await supabase
    .from("deal_access_requests")
    .update({ status: "ACCESS_APPROVED", vdr_link: vdrLink, decided_at: new Date().toISOString(), decided_by: currentUser?.id })
    .eq("id", requestId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Insert deal_access
  await supabase.from("deal_access").upsert({ deal_id: request.deal_id, user_id: request.user_id }, { onConflict: "deal_id,user_id" });

  // Log activity
  await supabase.from("deal_activity_log").insert({
    deal_id: request.deal_id,
    user_id: currentUser?.id,
    action: "access_approved",
    details: { approved_user_id: request.user_id, approved_user_name: profile?.full_name },
  });

  // Notification to requester (via centralized helper)
  await sendNotification(supabase, {
    userId: request.user_id,
    type: "access_approved",
    title: "Accesso approvato",
    body: `La tua richiesta per "${deal?.title || "Deal"}" è stata approvata. Puoi ora accedere al dossier.`,
    link: `/portal/deals/${request.deal_id}`,
    dealTitle: deal?.title,
  });

  // Webhook Make (WhatsApp + Email)
  try {
    await fetch("https://hook.eu1.make.com/tuo_id_webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "access_approved",
        partnerName: profile?.full_name || "Partner",
        partnerPhone: profile?.phone,
        dealTitle: deal?.title,
        vdrLink,
      }),
    });
  } catch (e) {
    console.error("Make webhook error:", e);
  }

  return NextResponse.redirect(new URL("/portal/access-requests", req.url), { status: 303 });
}
