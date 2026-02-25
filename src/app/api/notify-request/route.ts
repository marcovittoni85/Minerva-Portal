import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
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
  const { data: admins } = await supabase.from("profiles").select("id").in("role", ["admin"]);
  const adminIds = (admins ?? []).map(a => a.id);

  // Include originator if not already an admin
  if (deal.originator_id && !adminIds.includes(deal.originator_id)) {
    adminIds.push(deal.originator_id);
  }

  if (adminIds.length > 0) {
    await sendNotificationBulk(supabase, {
      userIds: adminIds,
      type: "access_request",
      title: "Nuova richiesta accesso",
      body: `${profile?.full_name || "Un utente"} ha richiesto accesso a "${deal.title}"`,
      link: "/portal/access-requests",
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true });
}
