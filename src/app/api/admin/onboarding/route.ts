import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    
    // Inizializziamo Resend solo qui dentro
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY non configurata su Vercel.");
    }
    const resend = new Resend(resendApiKey);

    const { data, error: authError } = await supabase.auth.admin.generateLink({
      type: 'invite', 
      email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/activate` }
    });

    if (authError || !data?.properties?.action_link) {
      throw new Error(authError?.message || "Errore generazione link.");
    }

    const inviteLink = data.properties.action_link;

    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Accesso Riservato: Private Marketplace Minerva Partners",
      html: `
        <div style="background-color: #001220; padding: 50px; text-align: center; color: white; font-family: sans-serif;">
          <h1 style="color: #D4AF37; text-transform: uppercase;">Benvenuto, ${name}</h1>
          <p style="color: #C0C0C0;">CONFEDERAZIONE DEL VALORE</p>
          <div style="margin: 40px 0;">
            <a href="${inviteLink}" style="background-color: #D4AF37; color: #001220; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 11px;">Attiva Account Partner</a>
          </div>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (e: any) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}