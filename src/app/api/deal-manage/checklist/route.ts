import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { dealId, checklist_data, checklist_completeness, blind_title, blind_description, checklist_manually_edited } = body;

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  const updatePayload: Record<string, unknown> = {};
  if (checklist_data !== undefined) updatePayload.checklist_data = checklist_data;
  if (checklist_completeness !== undefined) updatePayload.checklist_completeness = checklist_completeness;
  if (blind_title !== undefined) updatePayload.blind_title = blind_title;
  if (blind_description !== undefined) updatePayload.blind_description = blind_description;
  if (checklist_manually_edited !== undefined) updatePayload.checklist_manually_edited = checklist_manually_edited;

  const { error } = await supabase.from("deals").update(updatePayload).eq("id", dealId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
