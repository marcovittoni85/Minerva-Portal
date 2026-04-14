import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotificationEmail } from "@/lib/send-notification-email";
import { NextResponse } from "next/server";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { userId } = body as { userId: string };
  if (!userId) return NextResponse.json({ error: "userId mancante" }, { status: 400 });

  const admin = supabaseAdmin();

  // Get profile
  const { data: target } = await admin.from("profiles").select("email, full_name").eq("id", userId).single();
  if (!target) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });

  // Generate new temp password and update auth
  const tempPassword = generateTempPassword();
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Reset must_change_password
  await admin.from("profiles").update({ must_change_password: true }).eq("id", userId);

  // Send email
  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.minervapartners.it";
  await sendNotificationEmail({
    to: target.email,
    recipientName: target.full_name || undefined,
    title: "Nuove credenziali Minerva Partners",
    body: `Le tue nuove credenziali di accesso:<br/><br/>
<strong>Email:</strong> ${target.email}<br/>
<strong>Password temporanea:</strong> ${tempPassword}<br/><br/>
Accedi a <a href="${portalUrl}" style="color:#D4AF37;">${portalUrl}</a> e cambia la password al primo accesso.`,
    link: "/login",
  });

  return NextResponse.json({ ok: true });
}
