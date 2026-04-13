import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Solo admin" }, { status: 403 });

  const body = await req.json();
  const {
    dealId, parties, serviceType, minervaFeePct, minervaFeeAmount,
    fondoStrategicoPct, fondoStrategicoAmount, netPool, feeLorda, notes, icRequired,
  } = body;

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  // Upsert: delete old, insert new
  await admin.from("deal_fee_agreements").delete().eq("deal_id", dealId);

  const { error } = await admin.from("deal_fee_agreements").insert({
    deal_id: dealId,
    parties,
    service_type: serviceType,
    minerva_fee_pct: minervaFeePct,
    minerva_fee_amount: minervaFeeAmount,
    fondo_strategico_pct: fondoStrategicoPct,
    fondo_strategico_amount: fondoStrategicoAmount,
    net_pool: netPool,
    fee_lorda: feeLorda,
    notes: notes || null,
    ic_required: icRequired,
    created_by: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  await admin.from("deal_activity_log").insert({
    deal_id: dealId,
    user_id: user.id,
    action: "fee_agreement_created",
    details: { fee_lorda: feeLorda, service_type: serviceType, ic_required: icRequired },
  });

  // IC alert if needed
  if (icRequired) {
    const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
    const { data: deal } = await admin.from("deals").select("title").eq("id", dealId).single();
    for (const a of admins ?? []) {
      await sendNotification(supabase, {
        userId: a.id,
        type: "ic_alert",
        title: "Delibera IC Obbligatoria",
        body: `Fee Agreement per "${deal?.title}" supera €500.000. Richiesta delibera Investment Committee.`,
        link: `/portal/deals/${dealId}/fee-agreement`,
        dealTitle: deal?.title,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
