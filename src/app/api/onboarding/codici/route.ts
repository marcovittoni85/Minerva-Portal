import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

const CODICI = {
  etico: { nome: "Codice Etico VERITAS", path: "codici/v3.0/Codice_Etico_VERITAS_v3.0.pdf" },
  retributivo: { nome: "Codice Retributivo", path: "codici/v3.0/Codice_Retributivo_v3.0.pdf" },
  operativo: { nome: "Codice Operativo", path: "codici/v3.0/Codice_Operativo_v3.0.pdf" },
}

const PATTO = { nome: "Patto di Ingresso", path: "patti/v1.1/Patto_di_Ingresso_v1.1.pdf" }

export async function GET() {
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

  const codici = []
  for (const [id, info] of Object.entries(CODICI)) {
    const cleanName = info.nome.replace(/\s+/g, "_") + ".pdf"
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(info.path, 3600, { download: cleanName })
    codici.push({ id, nome: info.nome, versione: "", signedUrl: data?.signedUrl ?? "" })
  }

  const pattoCleanName = PATTO.nome.replace(/\s+/g, "_") + ".pdf"
  const { data: pattoData } = await supabase.storage
    .from("documents")
    .createSignedUrl(PATTO.path, 3600, { download: pattoCleanName })

  const patto = {
    nome: PATTO.nome,
    signedUrl: pattoData?.signedUrl ?? "",
  }

  return NextResponse.json({ codici, patto })
}
