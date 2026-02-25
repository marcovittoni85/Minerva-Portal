import { supabaseServer } from "@/lib/supabase-server";
import { sendNotification, sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const dealId = String(form.get("dealId") ?? "");

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  // Get deal info before update
  const { data: deal } = await supabase
    .from("deals")
    .select("title, created_by")
    .eq("id", dealId)
    .single();

  const code = "MNR-2026-" + String(Math.floor(Math.random() * 900) + 100);

  const { error } = await supabase
    .from("deals")
    .update({ status: "confirmed", active: true, code })
    .eq("id", dealId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify proposer that deal was approved
  if (deal?.created_by) {
    await sendNotification(supabase, {
      userId: deal.created_by,
      type: "deal_proposal_approved",
      title: "Proposta Approvata",
      body: `La tua proposta "${deal.title}" è stata approvata ed è ora in bacheca.`,
      link: "/portal/board",
      dealTitle: deal.title,
    });
  }

  // Notify all partners/friends about new deal on board
  const { data: partners } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["partner", "friend"]);

  const partnerIds = (partners ?? []).map((p) => p.id);
  if (partnerIds.length > 0) {
    await sendNotificationBulk(supabase, {
      userIds: partnerIds,
      type: "new_deal_board",
      title: "Nuova Opportunità",
      body: `Una nuova opportunità è disponibile in bacheca: "${deal?.title}"`,
      link: "/portal/board",
      dealTitle: deal?.title,
    });
  }

  return NextResponse.redirect(new URL("/portal/deal-proposals", req.url), { status: 303 });
}
