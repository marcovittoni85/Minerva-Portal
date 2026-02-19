import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const dealId = String(form.get("dealId") ?? "");

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  const code = "MNR-2026-" + String(Math.floor(Math.random() * 900) + 100);

  const { error } = await supabase
    .from("deals")
    .update({ status: "confirmed", active: true, code })
    .eq("id", dealId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/portal/deal-proposals", req.url), { status: 303 });
}