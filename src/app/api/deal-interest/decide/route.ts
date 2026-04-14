import { NextResponse } from "next/server";
import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/**
 * POST — Originator decides on L1 or L2 request
 * Body: { requestId, level: "l1" | "l2", decision: "approved" | "declined", declineReason? }
 */
export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { requestId, level, decision, declineReason } = body;

  if (!requestId || !level || !decision) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  if (decision === "declined" && (!declineReason || declineReason.trim().length < 20)) {
    return NextResponse.json({ error: "Motivazione obbligatoria (min 20 caratteri)" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Fetch the request
  const { data: interest } = await admin
    .from("deal_interest_requests")
    .select("*, deals!inner(id, title, originator_id)")
    .eq("id", requestId)
    .single();

  if (!interest) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });

  const deal = interest.deals as any;

  // Check authorization: originator or admin
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";
  const isOriginator = deal.originator_id === user.id;

  if (!isAdmin && !isOriginator) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const now = new Date().toISOString();

  if (level === "l1") {
    // L1 decision
    if (interest.l1_status !== "pending") {
      return NextResponse.json({ error: "Richiesta L1 già valutata" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      l1_status: decision,
      l1_decided_at: now,
      l1_decided_by: user.id,
    };

    if (decision === "declined") {
      updateData.l1_decline_reason = declineReason.trim();
    }

    if (decision === "approved") {
      // Set L1 expiry: 10 business days from now (approx 14 calendar days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      updateData.l1_expires_at = expiryDate.toISOString();
    }

    const { error } = await admin
      .from("deal_interest_requests")
      .update(updateData)
      .eq("id", requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Audit log
    await admin.from("deal_activity_log").insert({
      deal_id: deal.id,
      user_id: user.id,
      action: decision === "approved" ? "l1_approved" : "l1_declined",
      details: {
        request_id: requestId,
        anonymous_code: interest.anonymous_code,
        decline_reason: decision === "declined" ? declineReason : undefined,
      },
    });

    // Notify requester
    if (decision === "approved") {
      await sendNotification(supabase, {
        userId: interest.requester_id,
        type: "l1_approved",
        title: "Autorizzazione L1 Concessa",
        body: `La tua richiesta per "${deal.title}" è stata approvata. Puoi ora visualizzare i dati completi.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });

      // Log that requester can now see real data
      await admin.from("deal_activity_log").insert({
        deal_id: deal.id,
        user_id: interest.requester_id,
        action: "l1_data_access_granted",
        details: { request_id: requestId, anonymous_code: interest.anonymous_code },
      });
    } else {
      await sendNotification(supabase, {
        userId: interest.requester_id,
        type: "l1_declined",
        title: "Autorizzazione L1 Negata",
        body: `La tua richiesta per "${deal.title}" non è stata accolta.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });
    }
  } else if (level === "l2") {
    // L2 decision by originator (after admin verification)
    if (interest.l2_status !== "pending_originator") {
      return NextResponse.json({ error: "Richiesta L2 non in attesa di decisione originator" }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      l2_status: decision,
      l2_decided_at: now,
      l2_decided_by: user.id,
    };

    if (decision === "declined") {
      updateData.l2_decline_reason = declineReason.trim();
    }

    const { error } = await admin
      .from("deal_interest_requests")
      .update(updateData)
      .eq("id", requestId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Audit log
    await admin.from("deal_activity_log").insert({
      deal_id: deal.id,
      user_id: user.id,
      action: decision === "approved" ? "l2_approved" : "l2_declined",
      details: {
        request_id: requestId,
        anonymous_code: interest.anonymous_code,
        client_name: interest.l2_client_name,
        client_company: interest.l2_client_company,
        decline_reason: decision === "declined" ? declineReason : undefined,
      },
    });

    if (decision === "approved") {
      // Update deal board_status to in_negotiation, start 5-day timer
      const negotiationExpiry = new Date();
      negotiationExpiry.setDate(negotiationExpiry.getDate() + 5);

      await admin.from("deals").update({
        board_status: "in_negotiation",
        negotiation_started_at: now,
        negotiation_expires_at: negotiationExpiry.toISOString(),
      }).eq("id", deal.id);

      await sendNotification(supabase, {
        userId: interest.requester_id,
        type: "l2_approved",
        title: "Autorizzazione L2 Concessa",
        body: `La tua richiesta L2 per "${deal.title}" è stata approvata. Verrai contattato per schedulare una call.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });

      // Notify deal is now in negotiation
      await sendNotification(supabase, {
        userId: deal.originator_id,
        type: "deal_in_negotiation",
        title: "Deal In Trattativa",
        body: `"${deal.title}" è ora in trattativa. Hai 5 giorni per schedulare la call.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });
    } else {
      await sendNotification(supabase, {
        userId: interest.requester_id,
        type: "l2_declined",
        title: "Autorizzazione L2 Negata",
        body: `La tua richiesta L2 per "${deal.title}" non è stata accolta.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
