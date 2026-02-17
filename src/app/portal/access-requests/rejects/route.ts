import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const requestId = String(form.get("requestId") ?? "");

  if (!requestId) {
    return NextResponse.json({ error: "requestId mancante" }, { status: 400 });
  }

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = String(prof?.role ?? "").toLowerCase();
  if (role !== "admin" && role !== "equity_partner") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { error: updErr } = await supabase
    .from("deal_access_requests")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq("id", requestId);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.redirect(new URL("/portal/access-requests", req.url), { status: 303 });
}