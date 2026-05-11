import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { renderBySlug } from "@/lib/comms/template-engine";
import { sendEmail } from "@/lib/notifications/channels/email";

/**
 * P37 — Test send for a comms template (admin-only).
 * POST /api/comms-templates/test
 * Body: { slug: string, variables: Record<string, string|number> }
 */

const TEST_RECIPIENT = "marvittoni@gmail.com";

const TestBodySchema = z.object({
  slug: z.string().min(1),
  variables: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .default({}),
});

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Non autenticato" },
      { status: 401 }
    );
  }

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Solo admin" }, { status: 403 });
  }

  let parsed;
  try {
    const json = await req.json();
    parsed = TestBodySchema.parse(json);
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Body non valido";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }

  const rendered = await renderBySlug(parsed.slug, parsed.variables);
  if (!rendered) {
    return NextResponse.json(
      { ok: false, error: `Template '${parsed.slug}' non trovato o non attivo` },
      { status: 404 }
    );
  }

  console.log("[comms-templates/test] render:", {
    slug: parsed.slug,
    channel: rendered.channel,
    subject: rendered.subject,
    body: rendered.body,
    variables: parsed.variables,
  });

  if (rendered.channel !== "email") {
    return NextResponse.json({
      ok: true,
      channel: rendered.channel,
      message: "Test send disponibile solo per email in v1",
      preview: { subject: rendered.subject, body: rendered.body },
    });
  }

  const html = rendered.body
    .split("\n")
    .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br/>");

  try {
    await sendEmail({
      to: TEST_RECIPIENT,
      subject: `[TEST] ${rendered.subject || parsed.slug}`,
      html,
      text: rendered.body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[comms-templates/test] sendEmail error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    channel: rendered.channel,
    recipient: TEST_RECIPIENT,
  });
}
