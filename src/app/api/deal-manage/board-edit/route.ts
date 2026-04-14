import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { dealId, ...fields } = body;
  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  // Whitelist only board-editable fields
  const allowed = ["teaser_description", "highlights", "location", "deal_type", "estimated_ev", "is_visible_board"];
  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (key in fields) update[key] = fields[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
  }

  const { error } = await supabase.from("deals").update(update).eq("id", dealId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
