import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/** POST — Create a new L1 interest request */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { dealId, interestMessage } = body;

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });
  if (!interestMessage || interestMessage.trim().length < 20) {
    return NextResponse.json({ error: "Messaggio di interesse obbligatorio (min 20 caratteri)" }, { status: 400 });
  }

  // Check deal exists and is active
  const admin = supabaseAdmin();
  const { data: deal } = await admin.from("deals").select("id, title, originator_id, board_status").eq("id", dealId).single();
  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Check for existing pending request
  const { data: existing } = await admin
    .from("deal_interest_requests")
    .select("id, l1_status")
    .eq("deal_id", dealId)
    .eq("requester_id", user.id)
    .in("l1_status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Hai già una richiesta attiva per questo deal" }, { status: 409 });
  }

  // Generate anonymous code: REQ-YYYY-NNN
  const year = new Date().getFullYear();
  const { data: seqResult } = await admin.rpc("nextval", { seq_name: "interest_request_seq" }).single();
  const seqNum = seqResult ?? Math.floor(Math.random() * 900) + 100;
  const anonymousCode = `REQ-${year}-${String(seqNum).padStart(3, "0")}`;

  const { data: request, error: insertError } = await admin
    .from("deal_interest_requests")
    .insert({
      deal_id: dealId,
      requester_id: user.id,
      anonymous_code: anonymousCode,
      interest_message: interestMessage.trim(),
      l1_status: "pending",
    })
    .select("id, anonymous_code")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Log audit
  await admin.from("deal_activity_log").insert({
    deal_id: dealId,
    user_id: user.id,
    action: "l1_interest_requested",
    details: { anonymous_code: anonymousCode, request_id: request.id },
  });

  // Notify originator (anonymous)
  if (deal.originator_id) {
    await sendNotification(supabase, {
      userId: deal.originator_id,
      type: "l1_interest_received",
      title: "Nuova Richiesta di Interesse",
      body: `Un soggetto (${anonymousCode}) ha espresso interesse per "${deal.title}".`,
      link: `/portal/deals/${dealId}/l1-review`,
      dealTitle: deal.title,
    });
  }

  // Notify admins
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  for (const a of admins ?? []) {
    await sendNotification(supabase, {
      userId: a.id,
      type: "l1_interest_received",
      title: "Nuova Richiesta L1",
      body: `${anonymousCode} ha richiesto L1 per "${deal.title}".`,
      link: `/portal/deals/${dealId}/l1-review`,
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true, requestId: request.id, anonymousCode });
}

/** GET — Fetch interest requests for a deal (originator/admin) */
export async function GET(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");
  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  const admin = supabaseAdmin();

  // Check if user is originator or admin
  const { data: deal } = await admin.from("deals").select("originator_id").eq("id", dealId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";
  const isOriginator = deal?.originator_id === user.id;

  if (!isAdmin && !isOriginator) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  let query = admin
    .from("deal_interest_requests")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  const { data: requests, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For originator: strip requester identity (keep anonymous_code)
  // For admin: include requester identity
  if (isAdmin) {
    const requesterIds = [...new Set((requests ?? []).map(r => r.requester_id))];
    const { data: profiles } = requesterIds.length > 0
      ? await admin.from("profiles").select("id, full_name, email").in("id", requesterIds)
      : { data: [] };
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, { name: p.full_name, email: p.email }]));

    return NextResponse.json({
      requests: (requests ?? []).map(r => ({
        ...r,
        requester_name: profileMap[r.requester_id]?.name || "Sconosciuto",
        requester_email: profileMap[r.requester_id]?.email || "",
      })),
    });
  }

  // Originator view: reveal requester identity only after L2 admin verification
  const verifiedRequesterIds = [...new Set(
    (requests ?? []).filter(r => r.l2_admin_verified).map(r => r.requester_id)
  )];
  const { data: verifiedProfiles } = verifiedRequesterIds.length > 0
    ? await admin.from("profiles").select("id, full_name").in("id", verifiedRequesterIds)
    : { data: [] };
  const verifiedMap = Object.fromEntries((verifiedProfiles ?? []).map(p => [p.id, p.full_name]));

  return NextResponse.json({
    requests: (requests ?? []).map(r => ({
      id: r.id,
      anonymous_code: r.anonymous_code,
      interest_message: r.interest_message,
      l1_status: r.l1_status,
      l1_decided_at: r.l1_decided_at,
      l1_decline_reason: r.l1_decline_reason,
      l1_decline_forwarded: r.l1_decline_forwarded,
      l2_status: r.l2_status,
      l2_client_name: r.l2_status !== "not_requested" ? r.l2_client_name : undefined,
      l2_client_surname: r.l2_status !== "not_requested" ? r.l2_client_surname : undefined,
      l2_client_company: r.l2_status !== "not_requested" ? r.l2_client_company : undefined,
      l2_client_email: r.l2_admin_verified ? r.l2_client_email : undefined,
      l2_fee_from_client: r.l2_status === "pending_originator" || r.l2_status === "approved" ? r.l2_fee_from_client : undefined,
      l2_fee_from_minerva: r.l2_status === "pending_originator" || r.l2_status === "approved" ? r.l2_fee_from_minerva : undefined,
      l2_mandate_type: r.l2_status !== "not_requested" ? r.l2_mandate_type : undefined,
      l2_mandate_file_url: r.l2_admin_verified ? r.l2_mandate_file_url : undefined,
      l2_nda_file_url: r.l2_admin_verified ? r.l2_nda_file_url : undefined,
      l2_admin_verified: r.l2_admin_verified,
      l2_admin_notes: r.l2_admin_notes,
      l2_decline_reason: r.l2_decline_reason,
      l2_decline_forwarded: r.l2_decline_forwarded,
      l2_requested_at: r.l2_requested_at,
      created_at: r.created_at,
      requester_name: r.l2_admin_verified ? verifiedMap[r.requester_id] || undefined : undefined,
    })),
  });
}
