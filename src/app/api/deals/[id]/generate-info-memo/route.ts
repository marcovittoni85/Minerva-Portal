import { getAuthUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateStructured } from '@/lib/claude/generators'
import { InfoMemoSchema } from '@/lib/claude/schemas/info-memo'
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

  // Fetch deal data
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select(
      'id, codice_anonimo, nome_azienda, settore, area_geografica, tipo_operazione, range_fatturato, range_ebitda, razionale_strategico, perche_interessante, dati_full'
    )
    .eq('id', dealId)
    .single()

  if (dealError || !deal) {
    return NextResponse.json({ error: 'Deal non trovato' }, { status: 404 })
  }

  // Fetch deal documents
  const { data: documents } = await supabase
    .from('deal_documents')
    .select('id, file_name, file_url, doc_type')
    .eq('deal_id', dealId)
    .limit(5)

  // Extract text from documents
  const extractedTexts: string[] = []
  const tempDir = join(tmpdir(), `minerva-info-memo-${dealId}`)
  await mkdir(tempDir, { recursive: true })

  if (documents && documents.length > 0) {
    for (const doc of documents) {
      try {
        // Download from Supabase storage
        const storagePath = doc.file_url
        const { data: fileData, error: dlError } = await supabase.storage
          .from('deal-docs')
          .download(storagePath)

        if (dlError || !fileData) continue

        const buffer = Buffer.from(await fileData.arrayBuffer())
        const tempPath = join(tempDir, doc.file_name)
        await writeFile(tempPath, buffer)

        // Extract text
        const extraction = await extractDocument(tempPath)
        if (extraction.text) {
          extractedTexts.push(
            `--- Documento: ${doc.file_name} (${doc.doc_type || 'generico'}) ---\n${extraction.text}`
          )
        }

        // Cleanup temp file
        await unlink(tempPath).catch(() => {})
      } catch {
        // Skip documents that fail extraction
      }
    }
  }

  // Build prompts
  const systemPrompt = `Sei un analista M&A senior di Minerva Partners, boutique di investment banking italiana.
Genera un Information Memorandum professionale e dettagliato in italiano per l'operazione indicata.
Il documento deve essere strutturato, formale e adatto a investitori istituzionali.
Rispondi ESCLUSIVAMENTE con un JSON valido che rispetta lo schema fornito.
Non inventare dati finanziari specifici se non sono presenti nei documenti — usa stime ragionevoli e indicalo chiaramente.
Tutti gli importi devono essere in EUR.`

  const dealContext = `
DATI DEAL:
- Codice Anonimo: ${deal.codice_anonimo || 'N/A'}
- Nome Azienda: ${deal.nome_azienda || 'Riservato'}
- Settore: ${deal.settore || 'N/A'}
- Area Geografica: ${deal.area_geografica || 'N/A'}
- Tipo Operazione: ${deal.tipo_operazione || 'N/A'}
- Range Fatturato: ${deal.range_fatturato || 'N/A'}
- Range EBITDA: ${deal.range_ebitda || 'N/A'}
- Razionale Strategico: ${deal.razionale_strategico || 'N/A'}
- Perche Interessante: ${deal.perche_interessante || 'N/A'}
- Dati Completi: ${deal.dati_full ? JSON.stringify(deal.dati_full) : 'N/A'}

${extractedTexts.length > 0 ? `DOCUMENTI ALLEGATI:\n${extractedTexts.join('\n\n')}` : 'Nessun documento allegato disponibile.'}

Genera l'Information Memorandum completo basandoti su tutti i dati disponibili.
Il JSON deve contenere: executive_summary, business_overview (con description, key_products, main_markets, business_model), market_position (con market_size_eur, growth_rate, competitive_position, key_competitors), financial_highlights (con revenue_last_3y, ebitda_last_3y, key_kpi), transaction_rationale, valuation_range (con methodology, range_eur_low, range_eur_high, notes), next_steps.`

  try {
    const result = await generateStructured({
      useCase: 'info_memo',
      systemPrompt,
      userPrompt: dealContext,
      schema: InfoMemoSchema,
      dealId,
      userId: user.id,
      maxTokens: 8000,
    })

    // Get max version for this deal + output_type
    const { data: maxVersionRow } = await supabase
      .from('intelligence_outputs')
      .select('version')
      .eq('deal_id', dealId)
      .eq('output_type', 'info_memo')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newVersion = (maxVersionRow?.version ?? 0) + 1

    // Save to intelligence_outputs as DRAFT
    const { data: output, error: insertError } = await supabase
      .from('intelligence_outputs')
      .insert({
        deal_id: dealId,
        output_type: 'info_memo',
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
        action: 'info_memo_generated',
        details: {
          version: newVersion,
          output_id: output.id,
          documents_analyzed: extractedTexts.length,
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
    })
  } catch (err: any) {
    console.error('Info memo generation error:', err)
    return NextResponse.json(
      { error: 'Errore generazione: ' + (err?.message || 'Errore sconosciuto') },
      { status: 500 }
    )
  }
}
