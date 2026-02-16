import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Creazione Utente in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (authError) throw authError;

    // 2. Creazione Profilo con scadenza a 30gg e flag documenti
    await supabase.from('profiles').insert({
      id: authUser.user.id,
      full_name: name,
      email: email.toLowerCase().trim(),
      role: 'partner',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      documents_signed: false
    });

    // 3. Lettura dei 5 Allegati dalla cartella public/documents
    const docsDir = path.join(process.cwd(), 'public', 'documents');
    const filenames = [
      'CODICE ETICO.pdf',
      'CODICE OPERATIVO.pdf',
      'CODICE RETRIBUTIVO.pdf',
      'DOCUMENTO ISTITUZIONALE.pdf',
      'Minerva Company Profile.pdf'
    ];

    const attachments = filenames.map(file => ({
      filename: file,
      content: fs.readFileSync(path.join(docsDir, file))
    }));

    // 4. Invio Email Luxury da info@minervapartners.it
    await resend.emails.send({
      from: "Minerva Partners <info@minervapartners.it>",
      to: email,
      subject: "Benvenuto in Minerva Partners - Accesso Riservato",
      attachments: attachments,
      html: `
        <div style="background-color: #ffffff; padding: 45px; font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h1 style="color: #D4AF37; text-align: center; letter-spacing: 5px; font-weight: 300; text-transform: uppercase;">Minerva Partners</h1>
          
          <p style="margin-top: 30px; font-size: 16px;">Caro <strong>${name}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6;">Se ricevi questa e-mail, sono felice di dirti che ho pensato a te per il progetto <strong>Minerva Partners</strong>. Non siamo un fondo classico, ma un ecosistema basato sulla trasparenza e sul valore condiviso.</p>

          <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #D4AF37; font-weight: 800; letter-spacing: 2px; margin-bottom: 10px;">Le tue credenziali riservate</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0; font-size: 15px;"><strong>Password:</strong> ${password}</p>
          </div>

          <p style="font-size: 14px;">Ti abbiamo allegato i 5 documenti istituzionali e operativi del modello <strong>VERITAS</strong>. Ti chiediamo di prenderne visione.</p>

          <div style="text-align: center; margin: 45px 0;">
            <a href="https://www.minervapartners.it/login" style="background-color: #0f172a; color: #D4AF37; padding: 18px 40px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; border-radius: 8px; display: inline-block;">Accedi al Marketplace</a>
          </div>

          <p style="font-size: 12px; color: #64748b; background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
            <strong>Nota VERITAS:</strong> L'accesso è attivo per <strong>30 giorni</strong>. Per rendere la tua posizione permanente, ti chiediamo di restituire i documenti firmati entro tale termine.
          </p>

          <p style="font-size: 14px; margin-top: 40px;">Un caro saluto,<br><strong>Marco Vittoni / Enrico Viganò</strong></p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Errore Onboarding:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}