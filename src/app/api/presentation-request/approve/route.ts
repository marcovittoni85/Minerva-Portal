import { supabaseServer } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Verify admin role
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { requestId, action } = await req.json();
  if (!requestId || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Parametri mancanti o non validi" }, { status: 400 });
  }

  // Fetch the presentation request
  const { data: entry, error: fetchError } = await supabase
    .from("presentation_requests")
    .select("id, deal_id, user_id, counterparty_name, counterparty_company, counterparty_role, notes, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  }

  if (entry.status !== "pending") {
    return NextResponse.json({ error: "Richiesta già processata" }, { status: 409 });
  }

  // Update the presentation request status
  const { error: updateError } = await supabase
    .from("presentation_requests")
    .update({ status: action })
    .eq("id", requestId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Get deal info
  const { data: deal } = await supabase.from("deals").select("title").eq("id", entry.deal_id).single();
  const dealTitle = deal?.title || "il deal";

  // Log the approval/rejection activity
  await supabase.from("deal_activity_log").insert({
    deal_id: entry.deal_id,
    user_id: user.id,
    action: action === "approved" ? "presentation_approved" : "presentation_rejected",
    details: {
      requesting_user_id: entry.user_id,
      counterparty_name: entry.counterparty_name,
      counterparty_company: entry.counterparty_company,
      deal_title: dealTitle,
    },
  });

  // Notify the requesting user
  if (action === "approved") {
    await sendNotification(supabase, {
      userId: entry.user_id,
      type: "presentation_approved",
      title: "Presentazione Autorizzata",
      body: `La tua richiesta di presentare il deal "${dealTitle}" a ${entry.counterparty_name} è stata approvata. Puoi ora generare l'NDA.`,
      link: `/portal/nda-generator/${entry.deal_id}`,
      dealTitle,
    });
  } else {
    await sendNotification(supabase, {
      userId: entry.user_id,
      type: "presentation_rejected",
      title: "Presentazione Rifiutata",
      body: `La tua richiesta di presentare il deal "${dealTitle}" a ${entry.counterparty_name} è stata rifiutata.`,
      link: `/portal/deals/${entry.deal_id}`,
      dealTitle,
    });
  }

  return NextResponse.json({ ok: true });
}
