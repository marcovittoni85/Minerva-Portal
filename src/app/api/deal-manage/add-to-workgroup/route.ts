import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

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

  // Log activity
  const { data: addedProfile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();
  await supabase.from("deal_activity_log").insert({
    deal_id: dealId,
    user_id: user.id,
    action: "workgroup_added",
    details: { added_user_id: userId, added_user_name: addedProfile?.full_name || "—", deal_title: dealTitle },
  });

  // Send notification via centralized helper
  const title = dealTitle || "il deal";
  await sendNotification(supabase, {
    userId,
    type: "workgroup_added",
    title: "Gruppo di lavoro",
    body: `Sei stato aggiunto al gruppo di lavoro per ${title}. Completa la dichiarazione obbligatoria.`,
    link: `/portal/declaration/${dealId}`,
    dealTitle: title,
  });

  return NextResponse.json({ ok: true });
}
