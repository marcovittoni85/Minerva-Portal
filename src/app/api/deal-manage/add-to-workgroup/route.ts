import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Get token from Authorization header
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Create client — service role key bypasses RLS, anon key as fallback
  const supabase = createClient(url, serviceKey || anonKey);

  // Verify the user's token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Sessione non valida" }, { status: 401 });

  // Verify admin role
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { dealId, userId } = await req.json();
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

  // Send notification
  const { error: notifError } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "step_changed",
    title: "Gruppo di lavoro",
    body: "Sei stato selezionato per il gruppo di lavoro. Completa la dichiarazione obbligatoria per procedere.",
    data: { deal_id: dealId },
    is_read: false,
  });

  if (notifError) {
    console.error("Notification insert error:", notifError.message);
  }

  return NextResponse.json({ ok: true });
}
