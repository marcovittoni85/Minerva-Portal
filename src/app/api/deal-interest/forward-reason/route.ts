import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/**
 * POST — Admin forwards decline reason to requester (Mod 1)
 * Body: { requestId, level: "l1" | "l2", forwardedText? }
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const body = await req.json();
  const { requestId, level, forwardedText } = body;

  const { data: interest } = await admin
    .from("deal_interest_requests")
    .select("*, deals!inner(id, title)")
    .eq("id", requestId)
    .single();

  if (!interest) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });

  const deal = interest.deals as any;
  const col = level === "l1" ? "l1" : "l2";
  const originalReason = interest[`${col}_decline_reason`];
  const textToForward = forwardedText?.trim() || originalReason;

  await admin.from("deal_interest_requests").update({
    [`${col}_decline_forwarded`]: true,
    [`${col}_decline_forwarded_text`]: textToForward,
  }).eq("id", requestId);

  // Notify requester with the forwarded reason
  await sendNotification(supabase, {
    userId: interest.requester_id,
    type: level === "l1" ? "l1_declined" : "l2_declined",
    title: `Motivazione ${level.toUpperCase()} Rifiuto`,
    body: `Per "${deal.title}": ${textToForward}`,
    link: `/portal/deals/${deal.id}`,
    dealTitle: deal.title,
  });

  return NextResponse.json({ ok: true });
}
