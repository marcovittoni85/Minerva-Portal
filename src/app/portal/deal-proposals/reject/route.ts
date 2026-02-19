import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const dealId = String(form.get("dealId") ?? "");

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  const { error } = await supabase
    .from("deals")
    .update({ status: "rejected", active: false })
    .eq("id", dealId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.redirect(new URL("/portal/deal-proposals", req.url), { status: 303 });
}