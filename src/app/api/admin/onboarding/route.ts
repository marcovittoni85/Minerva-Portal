import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();
    const { data } = await supabase.auth.admin.generateLink({
      type: 'invite', email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/portal/activate` }
    });
    await resend.emails.send({
      from: "Minerva Partners <board@minervapartners.it>",
      to: email,
      subject: "Accesso Riservato Minerva Partners",
      html: `<div style="background:#001220;padding:50px;color:white;text-align:center;">
              <h1 style="color:#D4AF37;">Benvenuto, ${name}</h1>
              <a href="${data.properties.action_link}" style="background:#D4AF37;color:#001220;padding:15px 30px;text-decoration:none;font-weight:bold;">ATTIVA ACCOUNT</a>
             </div>`
    });
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}