import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId, dealTitle, userId, fileName } = await req.json();

  if (!dealId || !userId) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });
  }

  // Get all users with access to this deal, excluding the uploader
  const { data: accessRows } = await supabase
    .from("deal_access")
    .select("user_id")
    .eq("deal_id", dealId)
    .neq("user_id", userId);

  const userIds = (accessRows ?? []).map((r) => r.user_id);

  // Also notify the originator if not already in access list
  const { data: deal } = await supabase
    .from("deals")
    .select("originator_id")
    .eq("id", dealId)
    .single();

  if (deal?.originator_id && deal.originator_id !== userId && !userIds.includes(deal.originator_id)) {
    userIds.push(deal.originator_id);
  }

  if (userIds.length > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    const uploaderName = profile?.full_name || "Un membro";

    await sendNotificationBulk(supabase, {
      userIds,
      type: "document_uploaded",
      title: "Nuovo Documento",
      body: `${uploaderName} ha caricato "${fileName || "un documento"}" su "${dealTitle || "un deal"}"`,
      link: `/portal/deals/${dealId}`,
      dealTitle: dealTitle || undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
