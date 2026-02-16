import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    
    // Generiamo il link
    const { data, error: authError } = await supabase.auth.admin.generateLink({
      type: 'invite', 
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/activate` }
    });

    // CONTROLLO DI SICUREZZA PER TYPESCRIPT
    // Verifichiamo che data, properties e action_link esistano davvero
    if (authError || !data?.properties?.action_link) {
      throw new Error(authError?.message || "Impossibile generare il link di invito.");
    }

    const inviteLink = data.properties.action_link;

    // Invio Email
    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Accesso Riservato: Private Marketplace Minerva Partners",
      html: `
        <div style="background-color: #001220; padding: 50px; text-align: center; color: white; font-family: sans-serif;">
          <h1 style="color: #D4AF37; text-transform: uppercase; letter-spacing: 3px;">Benvenuto, ${name}</h1>
          <p style="letter-spacing: 2px; color: #C0C0C0;">CONFEDERAZIONE DEL VALORE</p>
          <div style="margin: 40px 0;">
            <a href="${inviteLink}" style="background-color: #D4AF37; color: #001220; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; border-radius: 2px;">Attiva Account Partner</a>
          </div>
          <p style="font-size: 9px; color: #444; letter-spacing: 1px; margin-top: 50px;">Comunicazione Strettamente Riservata</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (e: any) { 
    console.error("Errore Onboarding:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}