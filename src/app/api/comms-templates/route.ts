import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * P37 — Comms Templates API
 *
 * GET  /api/comms-templates           → lista raggruppata per slug (auth)
 * GET  /api/comms-templates?slug=xxx  → versione attiva più recente per quella slug
 * POST /api/comms-templates           → crea nuova versione (admin only)
 */

const ChannelEnum = z.enum(["email", "whatsapp", "pec", "in_app"]);

const PostBodySchema = z.object({
  slug: z.string().min(1).max(120),
  subject: z.string().max(500).optional().nullable(),
  body: z.string().min(1),
  channel: ChannelEnum,
});

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const { data, error } = await supabase
      .from("comms_templates")
      .select(
        "id, slug, subject, body, channel, version, is_active, created_at, updated_at"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[comms-templates] GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ template: data ?? null });
  }

  const { data, error } = await supabase
    .from("comms_templates")
    .select(
      "id, slug, subject, body, channel, version, is_active, created_at, updated_at"
    )
    .order("slug", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    console.error("[comms-templates] GET list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const admin = supabaseAdmin();

  // Admin role check
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  let parsed;
  try {
    const json = await req.json();
    parsed = PostBodySchema.parse(json);
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Body non valido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { slug, subject, body, channel } = parsed;

  // Compute next version
  const { data: latest, error: latestErr } = await admin
    .from("comms_templates")
    .select("version")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestErr) {
    console.error("[comms-templates] latest version lookup error:", latestErr);
    return NextResponse.json({ error: latestErr.message }, { status: 500 });
  }
  const nextVersion = latest?.version ? latest.version + 1 : 1;

  // Deactivate previous versions for this slug
  if (latest) {
    const { error: deactErr } = await admin
      .from("comms_templates")
      .update({ is_active: false })
      .eq("slug", slug);
    if (deactErr) {
      console.error("[comms-templates] deactivate error:", deactErr);
      return NextResponse.json({ error: deactErr.message }, { status: 500 });
    }
  }

  // Insert new active version
  const { data: inserted, error: insErr } = await admin
    .from("comms_templates")
    .insert({
      slug,
      subject: subject?.trim() || null,
      body,
      channel,
      version: nextVersion,
      is_active: true,
    })
    .select(
      "id, slug, subject, body, channel, version, is_active, created_at, updated_at"
    )
    .single();

  if (insErr) {
    console.error("[comms-templates] insert error:", insErr);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, template: inserted });
}
