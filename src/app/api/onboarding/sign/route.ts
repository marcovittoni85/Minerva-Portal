import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { ip, userAgent } = body as { ip: string; userAgent: string };

  const { error } = await supabase.from("profiles").update({
    onboarding_completed: true,
    onboarding_signed_at: new Date().toISOString(),
    onboarding_ip: ip || "unknown",
    onboarding_user_agent: userAgent || "unknown",
    is_onboarded: true,
  }).eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
