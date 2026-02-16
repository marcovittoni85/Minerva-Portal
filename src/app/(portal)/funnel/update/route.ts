import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const STAGES = [
  "Origination",
  "Screening",
  "NDA",
  "DD",
  "Negotiation",
  "Signing",
  "Closed",
  "Dropped",
] as const;

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();

  const dealId = String(form.get("deal_id") ?? "");
  const stage = String(form.get("stage") ?? "");

  if (!dealId || !STAGES.includes(stage as any)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Admin?
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = (prof?.role ?? "").toLowerCase() === "admin";

  // Editor sul deal?
  const { data: du } = await supabase
    .from("deal_users")
    .select("role_on_deal")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isEditor = (du?.role_on_deal ?? "").toLowerCase() === "editor";

  if (!isAdmin && !isEditor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Upsert funnel row
  const { error: upErr } = await supabase.from("deal_funnel").upsert({
    deal_id: dealId,
    stage,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Audit (opzionale: se tabella esiste)
  await supabase.from("deal_activity").insert({
    deal_id: dealId,
    actor_id: user.id,
    action: "stage_changed",
    meta: { stage },
  });

  return NextResponse.json({ ok: true });
}
