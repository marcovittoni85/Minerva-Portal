import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendNotificationEmail({
  to,
  recipientName,
  title,
  body,
  link,
}: {
  to: string;
  recipientName?: string;
  title: string;
  body: string;
  link?: string;
}) {
  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.minervapartners.it";
  const fullLink = link ? `${portalUrl}${link}` : portalUrl;

  const html = `
    <div style="background-color:#ffffff;padding:45px;font-family:sans-serif;color:#1e293b;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;">
      <div style="text-align:center;padding-bottom:30px;border-bottom:1px solid #f1f5f9;">
        <h1 style="color:#D4AF37;letter-spacing:5px;font-weight:300;text-transform:uppercase;margin:0;">Minerva Partners</h1>
      </div>

      ${recipientName ? `<p style="margin-top:30px;font-size:16px;">Caro <strong>${recipientName}</strong>,</p>` : ""}

      <div style="background-color:#f8fafc;padding:25px;border-radius:12px;margin:25px 0;border:1px solid #f1f5f9;">
        <p style="margin:0 0 5px 0;font-size:11px;text-transform:uppercase;color:#D4AF37;font-weight:800;letter-spacing:2px;">${title}</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">${body}</p>
      </div>

      <div style="text-align:center;margin:35px 0;">
        <a href="${fullLink}" style="background-color:#0f172a;color:#D4AF37;padding:18px 40px;text-decoration:none;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:3px;border-radius:8px;display:inline-block;">Vai al Portale</a>
      </div>

      <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:30px;">
        Questa è una notifica automatica dal portale Minerva Partners.<br/>
        Se non desideri ricevere queste email, puoi modificare le tue preferenze nelle impostazioni.
      </p>
    </div>
  `;

  try {
    await getResend().emails.send({
      from: "Minerva Partners <info@minervapartners.it>",
      to,
      subject: title,
      html,
    });
  } catch (err) {
    console.error("Errore invio email notifica:", err);
  }
}
