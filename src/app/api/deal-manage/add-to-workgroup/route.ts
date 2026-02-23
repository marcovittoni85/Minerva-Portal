import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { dealId, userId } = await req.json();
  if (!dealId || !userId) return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });

  // Insert into workgroup
  const { error: wgError } = await supabase.from("deal_workgroup").insert({
    deal_id: dealId,
    user_id: userId,
    role_in_deal: "member",
    added_by: user.id,
  });

  if (wgError) return NextResponse.json({ error: wgError.message }, { status: 500 });

  // Send notification
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "workgroup_added",
    title: "Gruppo di lavoro",
    message: "Sei stato selezionato per il gruppo di lavoro. Completa la dichiarazione obbligatoria per procedere.",
    deal_id: dealId,
    is_read: false,
  });

  return NextResponse.json({ ok: true });
}
