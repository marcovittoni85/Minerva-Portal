import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const CODICI_PATHS: Record<string, { nome: string; path: string }> = {
  etico: { nome: 'Codice Etico VERITAS', path: 'codici/v3.0/Codice_Etico_VERITAS_v3.0.pdf' },
  retributivo: { nome: 'Codice Retributivo', path: 'codici/v3.0/Codice_Retributivo_v3.0.pdf' },
  operativo: { nome: 'Codice Operativo', path: 'codici/v3.0/Codice_Operativo_v3.0.pdf' },
}

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

  const codiciWithUrls = []
  
  for (const [id, info] of Object.entries(CODICI_PATHS)) {
    const cleanName = info.nome.replace(/\s+/g, '_') + '.pdf'
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(info.path, 3600, { download: cleanName })
    
    codiciWithUrls.push({
      id,
      nome: info.nome,
      versione: '',
      signedUrl: data?.signedUrl ?? '',
    })
  }

  return NextResponse.json({ codici: codiciWithUrls })
}