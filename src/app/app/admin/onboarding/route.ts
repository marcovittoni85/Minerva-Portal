import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// Utilizziamo il client admin per bypassare le restrizioni di sicurezza
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    // 1. Genera il link di invito senza inviare l'email automatica di Supabase
    const { data, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/activate`,
        data: { full_name: name }
      }
    });

    if (authError) throw authError;

    const inviteLink = data.properties.action_link;

    // 2. Email di Benvenuto Minerva
    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Accesso Riservato: Private Marketplace Minerva Partners",
      html: `
        <div style="background-color: #001220; padding: 60px 20px; font-family: 'Helvetica', sans-serif; text-align: center; color: #ffffff;">
          <div style="margin-bottom: 40px;">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL}/icon.webp" alt="Minerva Logo" width="120" />
          </div>
          
          <h1 style="color: #D4AF37; font-size: 28px; letter-spacing: 3px; text-transform: uppercase; font-weight: 300; margin-bottom: 10px;">
            Benvenuto, ${name}
          </h1>
          
          <p style="color: #C0C0C0; font-size: 14px; letter-spacing: 2px; margin-bottom: 40px; text-transform: uppercase; opacity: 0.8;">
            User - Confederazione del Valore
          </p>

          <p style="font-size: 16px; line-height: 1.8; color: #e0e0e0; max-width: 480px; margin: 0 auto 50px auto; font-style: italic;">
            "L'eccellenza non è un atto, ma un'abitudine."<br/>
            Siamo lieti di accoglierLa nel Private Marketplace esclusivo di Minerva Partners.
          </p>

          <a href="${inviteLink}" 
             style="background-color: #D4AF37; color: #001220; padding: 18px 40px; text-decoration: none; font-weight: bold; border-radius: 2px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: inline-block;">
            Attiva Account Partner
          </a>

          <div style="margin-top: 80px; border-top: 1px solid #1a2a3a; padding-top: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
            <p style="font-size: 10px; color: #555; letter-spacing: 1px; text-transform: uppercase;">
              Questa comunicazione è strettamente riservata.<br/>
              © 2026 Minerva Partners Board
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}