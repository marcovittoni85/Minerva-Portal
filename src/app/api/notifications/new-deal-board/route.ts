import { supabaseServer } from "@/lib/supabase-server";
import { notifyMatchingUsers } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId } = await req.json();

  if (!dealId) {
    return NextResponse.json({ error: "dealId mancante" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, sector, side, geography")
    .eq("id", dealId)
    .single();

  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  await notifyMatchingUsers(supabase, deal);

  return NextResponse.json({ ok: true });
}
