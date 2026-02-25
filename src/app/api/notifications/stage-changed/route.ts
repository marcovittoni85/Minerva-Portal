import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

const stageLabels: Record<string, string> = {
  board: "Board",
  in_review: "In Review",
  workgroup: "Workgroup",
  in_progress: "In Progress",
  closing: "Closing",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  closed: "Closed",
};

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId, fromStage, toStage } = await req.json();

  if (!dealId || !fromStage || !toStage) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("title")
    .eq("id", dealId)
    .single();

  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Get all users with access to this deal
  const { data: accessUsers } = await supabase
    .from("deal_access")
    .select("user_id")
    .eq("deal_id", dealId);

  const userIds = (accessUsers ?? []).map((a) => a.user_id);

  if (userIds.length > 0) {
    const fromLabel = stageLabels[fromStage] || fromStage;
    const toLabel = stageLabels[toStage] || toStage;

    await sendNotificationBulk(supabase, {
      userIds,
      type: "stage_changed",
      title: "Aggiornamento Deal",
      body: `Lo stage di "${deal.title}" è cambiato da ${fromLabel} a ${toLabel}`,
      link: `/portal/deals/${dealId}`,
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true });
}
