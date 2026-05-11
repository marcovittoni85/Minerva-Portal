import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { signature_id, action, rejection_reason, admin_notes } = body

    if (!signature_id || !action) {
      return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Action non valida" }, { status: 400 })
    }

    if (action === "reject" && (!rejection_reason || rejection_reason.trim().length < 5)) {
      return NextResponse.json({ error: "Motivazione rifiuto obbligatoria (min 5 caratteri)" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user: admin } } = await supabase.auth.getUser()
    if (!admin) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", admin.id)
      .single()

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Solo admin" }, { status: 403 })
    }

    const { data: signature, error: fetchErr } = await supabase
      .from("patto_signatures")
      .select("id, user_id, approval_status")
      .eq("id", signature_id)
      .single()

    if (fetchErr || !signature) {
      return NextResponse.json({ error: "Firma non trovata" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    const { error: updateSigErr } = await supabase
      .from("patto_signatures")
      .update({
        approval_status: newStatus,
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
        rejection_reason: action === "reject" ? rejection_reason : null,
        admin_notes: admin_notes || null,
      })
      .eq("id", signature_id)

    if (updateSigErr) {
      console.error("[ACTION] Update signature error:", updateSigErr)
      return NextResponse.json({ error: updateSigErr.message }, { status: 500 })
    }

    const profileUpdate: Record<string, any> = action === "approve"
      ? {
          onboarding_status: "approved",
          onboarding_completed: true,
          is_onboarded: true,
          documents_signed: true,
          policies_accepted_at: new Date().toISOString(),
        }
      : {
          onboarding_status: "rejected",
          onboarding_completed: false,
          is_onboarded: false,
          documents_signed: false,
        }

    await supabase.from("profiles").update(profileUpdate).eq("id", signature.user_id)

    const { data: partnerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", signature.user_id)
      .single()

    // ============ EMAIL CON DIAGNOSTICA ============
    console.log("[EMAIL] Starting email send process")
    console.log("[EMAIL] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY)
    console.log("[EMAIL] RESEND_API_KEY length:", process.env.RESEND_API_KEY?.length || 0)
    console.log("[EMAIL] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL)
    console.log("[EMAIL] Partner email:", partnerProfile?.email)
    console.log("[EMAIL] Action:", action)

    if (!process.env.RESEND_API_KEY) {
      console.error("[EMAIL] RESEND_API_KEY non configurato. Skip email.")
    } else if (!partnerProfile?.email) {
      console.error("[EMAIL] Partner email mancante. Skip email.")
    } else {
      try {
        const firstName = partnerProfile.full_name?.split(" ")[0] || ""
        const subject = action === "approve"
          ? "Minerva Partners - Benvenuto, accesso confermato"
          : "Minerva Partners - Richiesta di modifica documenti"

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        const html = action === "approve"
          ? "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a\">" +
            "<h1 style=\"font-size:20px;color:#0f172a;margin-bottom:16px\">Benvenuto in Minerva, " + firstName + "</h1>" +
            "<p style=\"font-size:14px;line-height:1.6\">La tua firma del Patto di Ingresso e accettazione dei Codici e stata approvata.</p>" +
            "<p style=\"font-size:14px;line-height:1.6\">Da ora hai accesso completo al portale Minerva Partners.</p>" +
            "<a href=\"" + baseUrl + "/portal\" style=\"display:inline-block;padding:12px 24px;background:#0f172a;color:#D4AF37;text-decoration:none;border-radius:8px;font-weight:bold;text-transform:uppercase;letter-spacing:0.2em;font-size:11px;margin-top:16px\">Accedi al portale</a>" +
            "</div>"
          : "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a\">" +
            "<h1 style=\"font-size:20px;color:#0f172a;margin-bottom:16px\">Ciao " + firstName + "</h1>" +
            "<p style=\"font-size:14px;line-height:1.6\">La tua firma del Patto e stata rifiutata.</p>" +
            "<p style=\"font-size:14px;line-height:1.6;background:#fef3c7;padding:12px;border-radius:8px;border-left:4px solid #f59e0b\"><strong>Motivazione:</strong><br>" + (rejection_reason || "") + "</p>" +
            "<a href=\"" + baseUrl + "/portal/onboarding\" style=\"display:inline-block;padding:12px 24px;background:#0f172a;color:#D4AF37;text-decoration:none;border-radius:8px;font-weight:bold;text-transform:uppercase;letter-spacing:0.2em;font-size:11px;margin-top:16px\">Ri-invia documenti</a>" +
            "</div>"

        console.log("[EMAIL] Sending POST to Resend...")
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + process.env.RESEND_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || "Minerva Partners <info@minervapartners.it>",
            to: [partnerProfile.email],
            subject,
            html,
          }),
        })

        const emailData = await emailRes.json()
        console.log("[EMAIL] Resend response status:", emailRes.status)
        console.log("[EMAIL] Resend response body:", JSON.stringify(emailData))

        if (!emailRes.ok) {
          console.error("[EMAIL] FAILED:", emailData)
        } else {
          console.log("[EMAIL] SUCCESS - id:", emailData.id)
        }
      } catch (emailErr: any) {
        console.error("[EMAIL] Exception:", emailErr?.message)
      }
    }
    // ============ END EMAIL ============

    return NextResponse.json({
      ok: true,
      action,
      new_status: newStatus,
      email_sent_to: partnerProfile?.email,
    })
  } catch (e: any) {
    console.error("[ACTION] Error:", e)
    return NextResponse.json({ error: e?.message || "Errore interno" }, { status: 500 })
  }
}
