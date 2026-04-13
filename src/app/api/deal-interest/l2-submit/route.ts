import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/**
 * POST — Requester submits L2 data (client info, fees, mandate)
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const {
    requestId,
    clientName,
    clientSurname,
    clientCompany,
    clientEmail,
    feeFromClient,
    feeFromMinerva,
    mandateType,
    mandateFileUrl,
    ndaFileUrl,
  } = body;

  if (!requestId) return NextResponse.json({ error: "requestId mancante" }, { status: 400 });
  if (!clientName || !clientSurname) return NextResponse.json({ error: "Nome e cognome cliente obbligatori" }, { status: 400 });

  const admin = supabaseAdmin();

  // Verify ownership
  const { data: interest } = await admin
    .from("deal_interest_requests")
    .select("*, deals!inner(id, title, originator_id)")
    .eq("id", requestId)
    .eq("requester_id", user.id)
    .single();

  if (!interest) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  if (interest.l1_status !== "approved") {
    return NextResponse.json({ error: "L1 non approvata" }, { status: 400 });
  }

  const deal = interest.deals as any;

  // Determine L2 status based on document completeness
  let l2Status = "pending_docs";
  const hasMandateOrNda = mandateType === "none"
    ? (mandateFileUrl && ndaFileUrl) // both required if no existing mandate
    : !!mandateFileUrl; // mandate file required for exclusive/generic

  if (hasMandateOrNda) {
    l2Status = "pending_admin"; // docs complete → admin verification
  }

  const { error } = await admin
    .from("deal_interest_requests")
    .update({
      l2_status: l2Status,
      l2_requested_at: new Date().toISOString(),
      l2_client_name: clientName.trim(),
      l2_client_surname: clientSurname.trim(),
      l2_client_company: clientCompany?.trim() || null,
      l2_client_email: clientEmail?.trim() || null,
      l2_fee_from_client: feeFromClient?.trim() || null,
      l2_fee_from_minerva: feeFromMinerva?.trim() || null,
      l2_mandate_type: mandateType || "none",
      l2_mandate_file_url: mandateFileUrl || null,
      l2_nda_file_url: ndaFileUrl || null,
    })
    .eq("id", requestId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await admin.from("deal_activity_log").insert({
    deal_id: deal.id,
    user_id: user.id,
    action: "l2_submitted",
    details: {
      request_id: requestId,
      client_name: clientName,
      client_company: clientCompany,
      mandate_type: mandateType,
      l2_status: l2Status,
    },
  });

  // Duplicate detection (Mod 10): check same deal for matching client
  const { data: otherRequests } = await admin
    .from("deal_interest_requests")
    .select("id, l2_client_surname, l2_client_company, l2_client_email, anonymous_code, requester_id")
    .eq("deal_id", deal.id)
    .neq("id", requestId)
    .neq("l2_status", "not_requested");

  const duplicates = (otherRequests ?? []).filter(r => {
    const sameSurname = r.l2_client_surname?.toLowerCase() === clientSurname.trim().toLowerCase();
    const sameCompany = r.l2_client_company?.toLowerCase() === (clientCompany || "").trim().toLowerCase();
    const sameEmail = r.l2_client_email?.toLowerCase() === (clientEmail || "").trim().toLowerCase();
    return (sameSurname && sameCompany) || (clientEmail && sameEmail);
  });

  if (duplicates.length > 0) {
    // Alert admins about possible duplicate
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
    for (const a of admins ?? []) {
      await sendNotification(supabase, {
        userId: a.id,
        type: "duplicate_alert",
        title: "Possibile Duplicato Cliente",
        body: `Il cliente "${clientName} ${clientSurname}" (${clientCompany || "N/A"}) è già stato dichiarato per "${deal.title}" da ${duplicates.map(d => d.anonymous_code).join(", ")}.`,
        link: `/portal/deals/${deal.id}/l2-review`,
        dealTitle: deal.title,
      });
    }
  }

  // If docs complete, notify admins for verification
  if (l2Status === "pending_admin") {
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
    for (const a of admins ?? []) {
      await sendNotification(supabase, {
        userId: a.id,
        type: "l2_request_received",
        title: "Nuova Richiesta L2 da Verificare",
        body: `Mandato caricato per "${deal.title}" — verifica documenti richiesta.`,
        link: `/portal/deals/${deal.id}/l2-review`,
        dealTitle: deal.title,
      });
    }
  }

  return NextResponse.json({ ok: true, l2Status });
}
