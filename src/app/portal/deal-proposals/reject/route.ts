import { supabaseServer } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const dealId = String(form.get("dealId") ?? "");

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  // Get deal info before update
  const { data: deal } = await supabase
    .from("deals")
    .select("title, created_by")
    .eq("id", dealId)
    .single();

  const { error } = await supabase
    .from("deals")
    .update({ status: "rejected", active: false })
    .eq("id", dealId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify proposer that deal was rejected
  if (deal?.created_by) {
    await sendNotification(supabase, {
      userId: deal.created_by,
      type: "deal_proposal_rejected",
      title: "Proposta Non Approvata",
      body: `La tua proposta "${deal.title}" non è stata approvata.`,
      link: "/portal/propose-deal",
      dealTitle: deal.title,
    });
  }

  return NextResponse.redirect(new URL("/portal/deal-proposals", req.url), { status: 303 });
}
