import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { extractDocument } from '@/lib/document-extraction/pipeline'
import { generateStructured } from '@/lib/claude/generators'
import { BlindProfileSchema } from '@/lib/claude/schemas/blind-profile'
import { writeFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = supabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  if (files.length === 0) return NextResponse.json({ error: 'No files' }, { status: 400 })

  const tempPaths: string[] = []

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const tempPath = join(tmpdir(), `${randomUUID()}_${file.name}`)
    await writeFile(tempPath, buffer)
    tempPaths.push(tempPath)
  }

  try {
    // Extract text from each file
    const extractions = await Promise.all(
      tempPaths.map(p => extractDocument(p))
    )

    const aggregatedText = extractions.map(e => e.text).join('\n\n---\n\n')
    const aggregatedTables = extractions.flatMap(e => e.tables)

    const systemPrompt = `Sei analista M&A senior di Minerva Partners.
Estrai dai documenti i dati per creare un Blind Profile anonimizzato.

REGOLE ANONIMIZZAZIONE:
- Nome azienda → settore + area generica (es. "industriale meccanica Lombardia")
- Località esatte → macro-aree ("Nord Italia", "Lombardia")
- Ammontari precisi → range ("€38M" → "€30-50M")
- Nomi persone → ruoli generici ("CEO", "CFO")
- Mantieni: settore, tipo operazione, razionale, perché interessante

Rispondi in formato JSON valido.`

    const userPrompt = `DOCUMENTI ESTRATTI:

TESTO:
${aggregatedText.slice(0, 30000)}

TABELLE:
${JSON.stringify(aggregatedTables.slice(0, 10))}

Genera Blind Profile anonimizzato. Identifica anche eventuali campi mancanti
e suggerisci documenti aggiuntivi da chiedere.`

    const blind = await generateStructured({
      useCase: 'auto_blind',
      systemPrompt,
      userPrompt,
      schema: BlindProfileSchema,
      dealId: 'new',
      userId: user.id,
    })

    await Promise.all(tempPaths.map(p => unlink(p).catch(() => {})))

    return NextResponse.json({
      blind,
      sourceDocsCount: files.length,
    })
  } catch (e: any) {
    await Promise.all(tempPaths.map(p => unlink(p).catch(() => {})))
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
