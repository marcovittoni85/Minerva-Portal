import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email e password obbligatori." }, { status: 400 });

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error("RESEND_API_KEY mancante.");
    const resend = new Resend(resendApiKey);

    const { error: userError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: name || "" },
    });

    if (userError && userError.message.includes("already registered")) {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existing = users?.find((u) => u.email === email.toLowerCase().trim());
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { full_name: name || existing.user_metadata?.full_name || "" },
        });
      }
    } else if (userError) {
      throw userError;
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://minervapartners.it"}/login`;

    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email.toLowerCase().trim(),
      subject: "Accesso Riservato: Private Marketplace Minerva Partners",
      html: `
        <div style="background-color:#001220;padding:50px 30px;text-align:center;color:white;font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#D4AF37;font-size:24px;text-transform:uppercase;letter-spacing:4px;margin-bottom:8px;">Benvenuto${name ? ", " + name : ""}</h1>
          <p style="letter-spacing:3px;color:#C0C0C0;font-size:11px;text-transform:uppercase;">Minerva Partners — Private Marketplace</p>
          <div style="background-color:#001c30;border:1px solid #1a3a50;border-radius:12px;padding:30px;margin:30px 0;text-align:left;">
            <p style="color:#D4AF37;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-bottom:20px;">Le tue credenziali di accesso</p>
            <p style="color:#fff;font-size:14px;margin-bottom:12px;"><strong style="color:#C0C0C0;">Email:</strong>&nbsp;&nbsp;${email}</p>
            <p style="color:#fff;font-size:14px;"><strong style="color:#C0C0C0;">Password:</strong>&nbsp;&nbsp;${password}</p>
          </div>
          <div style="margin:40px 0;">
            <a href="${loginUrl}" style="background-color:#D4AF37;color:#001220;padding:16px 40px;text-decoration:none;font-weight:bold;text-transform:uppercase;font-size:12px;letter-spacing:3px;border-radius:4px;display:inline-block;">Accedi al Portale</a>
          </div>
          <p style="font-size:11px;color:#666;margin-top:40px;">Ti consigliamo di cambiare la password dopo il primo accesso dalla sezione Impostazioni.</p>
          <div style="border-top:1px solid #1a3a50;margin-top:40px;padding-top:20px;">
            <p style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:2px;">Comunicazione Strettamente Riservata</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Errore Onboarding:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}