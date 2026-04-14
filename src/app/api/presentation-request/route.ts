import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { dealId, counterparty_name, counterparty_company, counterparty_role, notes } = await req.json();
  if (!dealId || !counterparty_name || !counterparty_role) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  // Verify user has deal_access
  const { data: access } = await supabase
    .from("deal_access")
    .select("id")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!access) {
    return NextResponse.json({ error: "Accesso al deal non autorizzato" }, { status: 403 });
  }

  // Check for existing pending/approved request
  const { data: existing } = await supabase
    .from("presentation_requests")
    .select("id, status")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (existing) {
    if (existing.status === "pending") {
      return NextResponse.json({ error: "Richiesta già in attesa di approvazione" }, { status: 409 });
    }
    if (existing.status === "approved") {
      return NextResponse.json({ error: "Presentazione già autorizzata" }, { status: 409 });
    }
  }

  // Get deal info
  const { data: deal } = await supabase.from("deals").select("title, originator_id").eq("id", dealId).single();
  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Get requester name
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  // Insert into presentation_requests table
  const { error: insertError } = await supabase.from("presentation_requests").insert({
    deal_id: dealId,
    user_id: user.id,
    counterparty_name,
    counterparty_company: counterparty_company || null,
    counterparty_role,
    notes: notes || null,
    status: "pending",
  });

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Notify admins + originator
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  const adminIds = (admins ?? []).map((a) => a.id);
  const notifyIds = [...new Set([...adminIds, ...(deal.originator_id ? [deal.originator_id] : [])])].filter(
    (id) => id !== user.id
  );

  if (notifyIds.length > 0) {
    await sendNotificationBulk(supabase, {
      userIds: notifyIds,
      type: "presentation_requested",
      title: "Richiesta di Presentazione",
      body: `${profile?.full_name || "Un utente"} ha richiesto l'autorizzazione a presentare il deal "${deal.title}" a ${counterparty_name} (${counterparty_company})`,
      link: `/portal/deal-manage/${dealId}`,
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true });
}
