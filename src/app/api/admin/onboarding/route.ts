import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { email, name, password } = await req.json();

    // 1. Crea l'utente con la password che hai scelto tu
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true, // L'utente è già confermato
      user_metadata: { full_name: name }
    });

    if (error) throw error;

    // 2. Invia la mail brandizzata con le credenziali
    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Benvenuto in Minerva Partners - Le tue credenziali",
      html: `
        <div style="background-color: #001220; padding: 40px; color: white; font-family: sans-serif; text-align: center;">
          <h1 style="color: #D4AF37; letter-spacing: 4px;">MINERVA PARTNERS</h1>
          <p style="margin-top: 30px; font-size: 16px;">Gentile ${name}, il tuo accesso al Private Marketplace è attivo.</p>
          <div style="background: #001c30; padding: 20px; border: 1px solid #D4AF37; margin: 30px 0;">
            <p style="margin: 5px 0; color: #D4AF37;">EMAIL: <strong>${email}</strong></p>
            <p style="margin: 5px 0; color: #D4AF37;">PASSWORD TEMPORANEA: <strong>${password}</strong></p>
          </div>
          <a href="https://www.minervapartners.it/login" style="display: inline-block; background: #D4AF37; color: #001220; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Accedi al Portale</a>
          <p style="margin-top: 40px; font-size: 10px; color: #666;">Ti consigliamo di cambiare la password dopo il primo accesso nella sezione Impostazioni.</p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}