import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Verify admin role
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { dealId, userId, dealTitle } = await req.json();
  if (!dealId || !userId) return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });

  // Check if already in workgroup
  const { data: existing } = await supabase.from("deal_workgroup").select("id").eq("deal_id", dealId).eq("user_id", userId).maybeSingle();
  if (existing) return NextResponse.json({ error: "Utente già nel gruppo di lavoro", alreadyExists: true }, { status: 409 });

  // Insert into workgroup
  const { error: wgError } = await supabase.from("deal_workgroup").insert({
    deal_id: dealId,
    user_id: userId,
    role_in_deal: "member",
    added_by: user.id,
  });

  if (wgError) return NextResponse.json({ error: wgError.message }, { status: 500 });

  // Send notification with link to declaration form
  const title = dealTitle || "il deal";
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "step_changed",
    title: "Gruppo di lavoro",
    body: `Sei stato aggiunto al gruppo di lavoro per ${title}. Completa la dichiarazione obbligatoria.`,
    link: `/portal/declaration/${dealId}`,
  });

  if (notifError) {
    console.error("Notification insert error:", notifError.message);
    return NextResponse.json({ ok: true, notifError: notifError.message });
  }

  return NextResponse.json({ ok: true });
}
