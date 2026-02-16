import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const form = await req.formData();
  const requestId = String(form.get("request_id") ?? "");
  if (!requestId) {
    return NextResponse.json({ error: "request_id mancante" }, { status: 400 });
  }

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Admin?
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(prof?.role ?? "").toLowerCase();
  const isAdmin = role === "admin" || role === "equity_partner" || role === "minerva";
  if (!isAdmin) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  // Carica richiesta
  const { data: request, error: reqErr } = await supabase
    .from("deal_access_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqErr || !request) {
    return NextResponse.json({ error: "Richiesta non trovata" }, { status: 404 });
  }

  if (String(request.status).toLowerCase() !== "pending") {
    return NextResponse.redirect(new URL("/portal/access-requests", req.url));
  }

  // Aggiorna richiesta: rejected + decided fields
  const { error: updErr } = await supabase
    .from("deal_access_requests")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: user.id,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", request.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Audit
  const { error: activityErr } = await supabase.from("deal_activity").insert({
    deal_id: request.deal_id,
    actor_id: user.id,
    action: "access_rejected",
    meta: {
      requester_id: request.user_id,
      request_id: request.id,
    },
  });

  if (activityErr) console.error("Audit log error:", activityErr.message);

  return NextResponse.redirect(new URL("/portal/access-requests", req.url));
}
