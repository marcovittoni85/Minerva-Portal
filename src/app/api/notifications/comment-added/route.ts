import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId, dealTitle, userId } = await req.json();

  if (!dealId || !userId) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  // Get workgroup members for this deal, excluding the commenter
  const { data: wgRows } = await supabase
    .from("deal_workgroup")
    .select("user_id")
    .eq("deal_id", dealId)
    .neq("user_id", userId);

  const userIds = (wgRows ?? []).map((r) => r.user_id);

  // Also notify the originator if not already in workgroup
  const { data: deal } = await supabase
    .from("deals")
    .select("originator_id")
    .eq("id", dealId)
    .single();

  if (deal?.originator_id && deal.originator_id !== userId && !userIds.includes(deal.originator_id)) {
    userIds.push(deal.originator_id);
  }

  if (userIds.length > 0) {
    // Get commenter name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    const commenterName = profile?.full_name || "Un membro";

    await sendNotificationBulk(supabase, {
      userIds,
      type: "comment_added",
      title: "Nuovo Commento",
      body: `${commenterName} ha commentato su "${dealTitle || "un deal"}"`,
      link: `/portal/deals/${dealId}`,
      dealTitle: dealTitle || undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
