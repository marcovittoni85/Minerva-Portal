import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const data = await resend.emails.send({
      from: "Minerva Partners <info@minervapartners.it>",
      to: "tua-email-personale@gmail.com", // METTI LA TUA EMAIL QUI
      subject: "Test Tecnico Resend - Minerva",
      html: "<h1>Funziona!</h1><p>Se ricevi questa mail, Resend e il dominio sono configurati correttamente.</p>"
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}