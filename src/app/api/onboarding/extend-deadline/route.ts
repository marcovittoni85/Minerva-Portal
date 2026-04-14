import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { userId, days } = body as { userId: string; days: number };

  if (!userId || !days) return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 });

  const newDeadline = new Date();
  newDeadline.setDate(newDeadline.getDate() + days);

  const { error } = await supabase.from("profiles").update({
    onboarding_deadline: newDeadline.toISOString().split("T")[0],
    active: true,
  }).eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, newDeadline: newDeadline.toISOString().split("T")[0] });
}
