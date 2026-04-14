import { NextResponse } from "next/server";
import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/**
 * POST — Admin verifies L2 documents
 * Body: { requestId, decision: "approved" | "rejected" | "clarification", notes? }
 */
export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Check admin
  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const body = await req.json();
  const { requestId, decision, notes } = body;

  if (!requestId || !decision) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const { data: interest } = await admin
    .from("deal_interest_requests")
    .select("*, deals!inner(id, title, originator_id)")
    .eq("id", requestId)
    .single();

  if (!interest) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  if (interest.l2_status !== "pending_admin") {
    return NextResponse.json({ error: "Richiesta non in attesa di verifica admin" }, { status: 400 });
  }

  const deal = interest.deals as any;
  const now = new Date().toISOString();

  if (decision === "approved") {
    // Move to pending_originator — originator can now see requester identity + client data
    await admin.from("deal_interest_requests").update({
      l2_status: "pending_originator",
      l2_admin_verified: true,
      l2_admin_verified_at: now,
      l2_admin_notes: notes?.trim() || null,
    }).eq("id", requestId);

    // Fetch requester name for originator reveal
    const { data: requesterProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", interest.requester_id)
      .single();

    // Notify originator with revealed identity
    await sendNotification(supabase, {
      userId: deal.originator_id,
      type: "l2_request_received",
      title: "Richiesta L2 Verificata — Da Valutare",
      body: `${requesterProfile?.full_name || "Un richiedente"} ha completato la documentazione per "${deal.title}". Cliente: ${interest.l2_client_name} ${interest.l2_client_surname} (${interest.l2_client_company || "N/A"}).`,
      link: `/portal/deals/${deal.id}/l2-review`,
      dealTitle: deal.title,
    });

    // Audit
    await admin.from("deal_activity_log").insert({
      deal_id: deal.id,
      user_id: user.id,
      action: "l2_admin_verified",
      details: { request_id: requestId, requester_revealed: requesterProfile?.full_name },
    });
  } else if (decision === "rejected") {
    await admin.from("deal_interest_requests").update({
      l2_status: "declined",
      l2_admin_verified: false,
      l2_admin_notes: notes?.trim() || null,
      l2_decided_at: now,
      l2_decided_by: user.id,
    }).eq("id", requestId);

    await sendNotification(supabase, {
      userId: interest.requester_id,
      type: "l2_declined",
      title: "Documentazione L2 Non Approvata",
      body: `La documentazione per "${deal.title}" non è stata approvata dall'admin.${notes ? " Note: " + notes : ""}`,
      link: `/portal/deals/${deal.id}`,
      dealTitle: deal.title,
    });
  } else if (decision === "clarification") {
    await admin.from("deal_interest_requests").update({
      l2_status: "pending_docs",
      l2_admin_notes: notes?.trim() || null,
    }).eq("id", requestId);

    await sendNotification(supabase, {
      userId: interest.requester_id,
      type: "l2_integration_needed",
      title: "Richiesta Chiarimenti L2",
      body: `Sono necessari chiarimenti per "${deal.title}".${notes ? " Dettaglio: " + notes : ""}`,
      link: `/portal/deals/${deal.id}/l2-request`,
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true });
}
