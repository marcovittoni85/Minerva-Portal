import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    // Inizializziamo il client SOLO qui dentro, non all'inizio del file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configurazione Supabase mancante sul server.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, name } = await req.json();
    
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error("RESEND_API_KEY mancante.");
    const resend = new Resend(resendApiKey);

    // 1. Crea utente
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (userError && !userError.message.includes("already registered")) {
        throw userError;
    }

    // 2. Genera link
    const { data, error: authError } = await supabase.auth.admin.generateLink({
      type: 'invite', 
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.minervapartners.it'}/portal/activate` }
    });

    if (authError || !data?.properties?.action_link) {
      throw new Error(authError?.message || "Errore generazione link.");
    }

    const inviteLink = data.properties.action_link;

    // 3. Invia Email
    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Accesso Riservato: Private Marketplace Minerva Partners",
      html: `
        <div style="background-color: #001220; padding: 50px; text-align: center; color: white; font-family: sans-serif;">
          <h1 style="color: #D4AF37; text-transform: uppercase; letter-spacing: 3px;">Benvenuto, ${name}</h1>
          <p style="letter-spacing: 2px; color: #C0C0C0;">MINERVA PARTNERS - PRIVATE MARKETPLACE</p>
          <div style="margin: 40px 0;">
            <a href="${inviteLink}" style="background-color: #D4AF37; color: #001220; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 2px; border-radius: 2px;">Attiva Account Partner</a>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (e: any) { 
    console.error("Errore Onboarding:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}