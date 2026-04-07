import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 0. Verifica che il chiamante sia admin
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // no-op in route handler
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: callerProfile } = await supabaseAuth
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (callerProfile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email, name } = await req.json();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Genera invite link (crea utente senza password)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://www.minervapartners.it";
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: normalizedEmail,
        options: {
          data: { full_name: name },
          redirectTo: `${siteUrl}/portal/activate`,
        },
      });

    if (linkError) throw linkError;

    const inviteUrl = linkData.properties?.action_link;
    const newUserId = linkData.user?.id;

    if (!newUserId || !inviteUrl) {
      throw new Error("Impossibile generare il link di attivazione");
    }

    // 2. Creazione Profilo con scadenza a 30gg e flag documenti
    await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      full_name: name,
      email: normalizedEmail,
      role: "partner",
      trial_ends_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      documents_signed: false,
    });

    // 3. Lettura dei 5 Allegati dalla cartella public/documents
    const docsDir = path.join(process.cwd(), "public", "documents");
    const filenames = [
      "CODICE ETICO.pdf",
      "CODICE OPERATIVO.pdf",
      "CODICE RETRIBUTIVO.pdf",
      "DOCUMENTO ISTITUZIONALE.pdf",
      "Minerva Company Profile.pdf",
    ];

    const attachments = filenames.map((file) => ({
      filename: file,
      content: fs.readFileSync(path.join(docsDir, file)),
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

          <p style="font-size: 14px;">Ti abbiamo allegato i 5 documenti istituzionali e operativi del modello <strong>VERITAS</strong>. Ti chiediamo di prenderne visione.</p>

          <div style="text-align: center; margin: 45px 0;">
            <a href="${inviteUrl}" style="background-color: #0f172a; color: #D4AF37; padding: 18px 40px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; border-radius: 8px; display: inline-block;">Attiva il tuo Account</a>
          </div>

          <p style="font-size: 12px; color: #64748b; background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7;">
            <strong>Nota VERITAS:</strong> L'accesso è attivo per <strong>30 giorni</strong>. Per rendere la tua posizione permanente, ti chiediamo di restituire i documenti firmati entro tale termine.
          </p>

          <p style="font-size: 14px; margin-top: 40px;">Un caro saluto,<br><strong>Marco Vittoni / Enrico Viganò</strong></p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Errore Onboarding:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
