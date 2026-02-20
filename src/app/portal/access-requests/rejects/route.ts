import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const formData = await req.formData();
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

  const { data: request, error: fetchError } = await supabase
    .from("deal_access_requests")
    .select("id, deal_id, user_id")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });

  const { data: deal } = await supabase.from("deals").select("title").eq("id", request.deal_id).single();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { error: updateError } = await supabase
    .from("deal_access_requests")
    .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: currentUser?.id })
    .eq("id", requestId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Notification to requester
  await supabase.from("notifications").insert({
    user_id: request.user_id,
    type: "access_rejected",
    title: "Richiesta rifiutata",
    message: "La tua richiesta per \"" + (deal?.title || "Deal") + "\" non e stata approvata.",
    deal_id: request.deal_id,
  });

  return NextResponse.redirect(new URL("/portal/access-requests", req.url), { status: 303 });
}