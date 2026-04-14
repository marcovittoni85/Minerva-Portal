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
  const { nome, cognome, email, company, ruolo } = body as {
    nome: string; cognome: string; email: string; company: string; ruolo: string;
  };

  if (!nome || !cognome || !email || !ruolo) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  if (!["partner", "friend", "advisor"].includes(ruolo)) {
    return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const tempPassword = generateTempPassword();
  const fullName = `${nome} ${cognome}`;

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message?.includes("already")) {
      return NextResponse.json({ error: "Esiste già un utente con questa email" }, { status: 409 });
    }
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const newUserId = authData.user.id;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  // Create/update profile
  const { error: profileError } = await admin.from("profiles").upsert({
    id: newUserId,
    email,
    full_name: fullName,
    role: ruolo,
    company: company || null,
    must_change_password: true,
    onboarding_deadline: deadline.toISOString().split("T")[0],
    onboarding_completed: false,
    is_onboarded: false,
    invited_by: user.id,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Send welcome email
  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.minervapartners.it";
  await sendNotificationEmail({
    to: email,
    recipientName: fullName,
    title: "Benvenuto in Minerva Partners",
    body: `Le tue credenziali di accesso al portale:<br/><br/>
<strong>Email:</strong> ${email}<br/>
<strong>Password temporanea:</strong> ${tempPassword}<br/><br/>
Accedi a <a href="${portalUrl}" style="color:#D4AF37;">${portalUrl}</a> e cambia la password al primo accesso.<br/><br/>
Hai <strong>30 giorni</strong> per prendere visione e firmare i codici Minerva (Codice Etico VERITAS, Codice Retributivo, Codice Operativo).`,
    link: "/login",
  });

  return NextResponse.json({ ok: true, userId: newUserId });
}
