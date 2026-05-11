import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const ip = formData.get("ip") as string | null
    const userAgent = formData.get("userAgent") as string | null
    const codiciAcceptedRaw = formData.get("codiciAccepted") as string | null

    if (!file) {
      return NextResponse.json({ error: "File mancante" }, { status: 400 })
    }

    const allowedMimes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json({ error: "Formato non valido. Carica PDF, PNG o JPG." }, { status: 400 })
    }

    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File troppo grande. Max 10MB." }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || "pdf"
    const timestamp = Date.now()
    const storagePath = user.id + "/patto-signed-" + timestamp + "." + ext

    const buffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabase.storage
      .from("agreements")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      console.error("Upload error:", uploadErr)
      return NextResponse.json({ error: "Errore upload: " + uploadErr.message }, { status: 500 })
    }

    let codiciAccepted = []
    try {
      codiciAccepted = codiciAcceptedRaw ? JSON.parse(codiciAcceptedRaw) : []
    } catch {}

    const { error: insertErr } = await supabase
      .from("patto_signatures")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        original_filename: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        codici_accepted: codiciAccepted,
        uploaded_ip: ip || "unknown",
        uploaded_user_agent: userAgent || "unknown",
        approval_status: "pending",
      })

    if (insertErr) {
      console.error("Insert error:", insertErr)
      return NextResponse.json({ error: "Errore registrazione: " + insertErr.message }, { status: 500 })
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        onboarding_status: "pending_approval",
      })
      .eq("id", user.id)

    if (updateErr) {
      console.error("Profile update error:", updateErr)
    }

    // Email admin notification
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: partnerProfile } = await supabase
          .from("profiles")
          .select("full_name, email, role, company")
          .eq("id", user.id)
          .single()

        const { data: admins } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")

        const adminEmails = (admins || []).map((a: any) => a.email).filter(Boolean)

        if (adminEmails.length > 0 && partnerProfile) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

          const html = "<div style=\"font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0f172a\">" +
            "<h1 style=\"font-size:20px;color:#0f172a;margin-bottom:16px\">Nuova firma Patto da approvare</h1>" +
            "<p style=\"font-size:14px;line-height:1.6\"><strong>" + (partnerProfile.full_name || "Partner") + "</strong> (" + partnerProfile.email + ") ha caricato il Patto di Ingresso firmato.</p>" +
            "<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0\">" +
            "<div style=\"font-size:12px;color:#64748b;margin-bottom:4px\">Ruolo</div>" +
            "<div style=\"font-size:14px;font-weight:bold;margin-bottom:12px\">" + (partnerProfile.role || "n/a") + "</div>" +
            "<div style=\"font-size:12px;color:#64748b;margin-bottom:4px\">Company</div>" +
            "<div style=\"font-size:14px;font-weight:bold;margin-bottom:12px\">" + (partnerProfile.company || "n/a") + "</div>" +
            "<div style=\"font-size:12px;color:#64748b;margin-bottom:4px\">File caricato</div>" +
            "<div style=\"font-size:14px;font-weight:bold\">" + file.name + " (" + (file.size / 1024).toFixed(0) + " KB)</div>" +
            "</div>" +
            "<a href=\"" + baseUrl + "/portal/admin/onboarding-approvals\" style=\"display:inline-block;padding:12px 24px;background:#0f172a;color:#D4AF37;text-decoration:none;border-radius:8px;font-weight:bold;text-transform:uppercase;letter-spacing:0.2em;font-size:11px\">Vai ad approvazioni</a>" +
            "</div>"

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + process.env.RESEND_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Minerva Partners <info@minervapartners.it>",
              to: adminEmails,
              subject: "Minerva — Nuova firma Patto da approvare: " + (partnerProfile.full_name || "Partner"),
              html,
            }),
          })
        }
      } catch (emailErr) {
        console.error("Admin email send error (non blocking):", emailErr)
      }
    }

    return NextResponse.json({ ok: true, status: "pending_approval" })
  } catch (e: any) {
    console.error("Sign API error:", e)
    return NextResponse.json({ error: e?.message || "Errore interno" }, { status: 500 })
  }
}
