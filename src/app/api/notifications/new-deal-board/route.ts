import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId } = await req.json();

  if (!dealId) {
    return NextResponse.json({ error: "dealId mancante" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("title")
    .eq("id", dealId)
    .single();

  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Notify all partners and friends
  const { data: partners } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["partner", "friend"]);

  const userIds = (partners ?? []).map((p) => p.id);

  if (userIds.length > 0) {
    await sendNotificationBulk(supabase, {
      userIds,
      type: "new_deal_board",
      title: "Nuova Opportunità",
      body: `Una nuova opportunità è disponibile in bacheca: "${deal.title}"`,
      link: "/portal/board",
      dealTitle: deal.title,
    });
  }

  return NextResponse.json({ ok: true });
}
