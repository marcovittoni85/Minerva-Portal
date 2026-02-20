import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId } = await req.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: deal } = await supabase.from("deals").select("title, originator_id").eq("id", dealId).single();

  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Notify all admins
  const { data: admins } = await supabase.from("profiles").select("id").in("role", ["admin", "equity_partner"]);

  const notifications = (admins ?? []).map(a => ({
    user_id: a.id,
    type: "new_access_request",
    title: "Nuova richiesta accesso",
    message: (profile?.full_name || "Un utente") + " ha richiesto accesso a \"" + deal.title + "\"",
    deal_id: dealId,
  }));

  // Notify originator if different from admins
  if (deal.originator_id && !(admins ?? []).find(a => a.id === deal.originator_id)) {
    notifications.push({
      user_id: deal.originator_id,
      type: "new_access_request",
      title: "Nuova richiesta accesso",
      message: (profile?.full_name || "Un utente") + " ha richiesto accesso a \"" + deal.title + "\"",
      deal_id: dealId,
    });
  }

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  return NextResponse.json({ ok: true });
}