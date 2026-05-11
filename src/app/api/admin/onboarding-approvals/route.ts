import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET() {
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
    if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })

    const { data: meProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (meProfile?.role !== "admin") {
      return NextResponse.json({ error: "Solo admin" }, { status: 403 })
    }

    const { data: pendings, error } = await supabase
      .from("patto_signatures")
      .select("id, user_id, storage_path, original_filename, file_size_bytes, mime_type, codici_accepted, uploaded_at, uploaded_ip, uploaded_user_agent, approval_status, rejection_reason, admin_notes")
      .in("approval_status", ["pending", "rejected"])
      .order("uploaded_at", { ascending: false })

    if (error) {
      console.error("Fetch pendings error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const enriched = await Promise.all((pendings || []).map(async (p: any) => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("email, full_name, role, ruolo_enumerato, partner_line, company, position, phone, created_at")
        .eq("id", p.user_id)
        .single()

      const { data: signed } = await supabase.storage
        .from("agreements")
        .createSignedUrl(p.storage_path, 3600)

      return {
        ...p,
        profile: profileData,
        signed_url: signed?.signedUrl ?? null,
      }
    }))

    return NextResponse.json({ pendings: enriched })
  } catch (e: any) {
    console.error("Admin approvals GET error:", e)
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 500 })
  }
}
