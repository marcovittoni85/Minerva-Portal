import { getAuthUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateStructured } from '@/lib/claude/generators'
import { ReclassificationSchema } from '@/lib/claude/schemas/reclassification'
import { extractDocument } from '@/lib/document-extraction/pipeline'
import { writeFile, unlink, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

export const maxDuration = 120

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params
  const { supabase, user } = await getAuthUser()

  if (!user) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accesso non autorizzato' }, { status: 403 })
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Richiesta non valida — inviare FormData con campo "file"' },
      { status: 400 }
    )
  }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'Nessun file PDF fornito' },
      { status: 400 }
    )
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json(
      { error: 'Il file deve essere in formato PDF' },
      { status: 400 }
    )
  }

  // Save PDF to temp file
  const tempDir = join(tmpdir(), `minerva-reclassify-${dealId}`)
  await mkdir(tempDir, { recursive: true })
  const tempPath = join(tempDir, file.name)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(tempPath, buffer)

  try {
    // Upload original PDF to Supabase storage
    const timestamp = Date.now()
    const storagePath = `bilanci/${dealId}/${timestamp}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('deal-docs')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Non-blocking — continue even if upload fails
    }

    // Extract text + tables from the PDF
    const extraction = await extractDocument(tempPath)

    // Validate extraction has enough content
    const hasEnoughText = extraction.text.length > 500
    const hasTables = extraction.tables && extraction.tables.length > 0

    if (!hasEnoughText && !hasTables) {
      return NextResponse.json(
        {
          error:
            'Il documento non contiene abbastanza dati estraibili. Assicurarsi che il PDF contenga testo selezionabile (non scansionato come immagine).',
        },
        { status: 422 }
      )
    }

    // Build context from extraction
    const tablesContext =
      hasTables
        ? `\n\nTABELLE ESTRATTE:\n${extraction.tables
            .map(
              (t, i) =>
                `Tabella ${i + 1}:\n${Object.entries(t)
                  .map(([k, v]) => `  ${k}: ${v}`)
                  .join('\n')}`
            )
            .join('\n\n')}`
        : ''

    const extractedContext = `TESTO ESTRATTO DAL BILANCIO:\n${extraction.text}${tablesContext}`

    // System prompt for Italian accountant reclassification
    const systemPrompt = `Sei un commercialista e analista finanziario senior specializzato in riclassificazione di bilanci secondo lo Schema A5 utilizzato da Minerva Partners.

Il tuo compito e analizzare il bilancio fornito e produrre una riclassificazione completa in formato strutturato JSON.

ISTRUZIONI:
1. Riclassifica il Conto Economico identificando: ricavi, costi operativi, EBITDA, ammortamenti, EBIT, oneri/proventi finanziari, imposte, utile netto
2. Riclassifica lo Stato Patrimoniale identificando: attivo immobilizzato, capitale circolante netto (crediti, debiti commerciali, rimanenze), posizione finanziaria netta, patrimonio netto
3. Ricostruisci il Cash Flow operativo, da investimenti e da finanziamento
4. Calcola i KPI fondamentali: EBITDA margin %, EBIT margin %, Net margin %, DSCR, Debt/EBITDA, giorni capitale circolante, ROIC %
5. Identifica le rettifiche suggerite all'EBITDA: costi/ricavi one-off, normalizzazioni, elementi straordinari, transazioni con parti correlate
6. Calcola l'EBITDA Adjusted sommando le rettifiche all'EBITDA reported
7. Aggiungi note analitiche rilevanti per l'analista

REGOLE:
- Tutti gli importi in EUR, numeri interi (no centesimi)
- Se un dato non e presente nel bilancio, usa 0 e segnalalo nelle note
- Le percentuali devono essere espresse come numeri (es. 15.5 per 15.5%)
- Il DSCR si calcola come EBITDA / (oneri finanziari + quota capitale debiti)
- Il ROIC si calcola come EBIT * (1-aliquota) / (patrimonio netto + debiti finanziari - cassa)
- Rispondi ESCLUSIVAMENTE con un JSON valido che rispetta lo schema fornito`

    const userPrompt = `Analizza il seguente bilancio e produci la riclassificazione completa secondo lo Schema A5 Minerva.

${extractedContext}

Produci il JSON di riclassificazione completo con tutti i campi richiesti.`

    // Call Claude for structured reclassification
    const result = await generateStructured({
      useCase: 'reclassification',
      systemPrompt,
      userPrompt,
      schema: ReclassificationSchema,
      dealId,
      userId: user.id,
      maxTokens: 8000,
    })

    // Get max version for this deal + output_type
    const { data: maxVersionRow } = await supabase
      .from('intelligence_outputs')
      .select('version')
      .eq('deal_id', dealId)
      .eq('output_type', 'reclassification')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newVersion = (maxVersionRow?.version ?? 0) + 1

    // Save to intelligence_outputs as DRAFT
    const { data: output, error: insertError } = await supabase
      .from('intelligence_outputs')
      .insert({
        deal_id: dealId,
        output_type: 'reclassification',
        version: newVersion,
        content: result,
        is_published: false,
        created_by: user.id,
      })
      .select('id, version, created_at')
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Errore salvataggio: ' + insertError.message },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('deal_activity_log')
      .insert({
        deal_id: dealId,
        user_id: user.id,
        action: 'reclassification_generated',
        details: {
          version: newVersion,
          output_id: output.id,
          file_name: file.name,
          storage_path: storagePath,
          extraction_chars: extraction.text.length,
          tables_found: extraction.tables?.length ?? 0,
        },
      })
      .then(
        () => {},
        () => {}
      )

    return NextResponse.json({
      success: true,
      output_id: output.id,
      version: newVersion,
      created_at: output.created_at,
      reclassification: result,
    })
  } catch (err: any) {
    console.error('Reclassification error:', err)
    return NextResponse.json(
      {
        error:
          'Errore nella riclassificazione: ' +
          (err?.message || 'Errore sconosciuto'),
      },
      { status: 500 }
    )
  } finally {
    // Cleanup temp file
    await unlink(tempPath).catch(() => {})
  }
}
