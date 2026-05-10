import { getAuthUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateStructured } from '@/lib/claude/generators'
import { PitchDeckSchema } from '@/lib/claude/schemas/pitch-deck'
import mammoth from 'mammoth'
import Anthropic from '@anthropic-ai/sdk'

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

  // Admin gate
  const { data: prof } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (prof?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  // Get deal
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single()
  if (dealError || !deal) {
    return NextResponse.json({ error: 'Deal non trovato' }, { status: 404 })
  }

  // Get deal documents
  const { data: docs } = await supabase
    .from('deal_documents')
    .select('id, file_name, storage_path, mime_type')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Download and extract documents
  const documentTexts: string[] = []

  if (docs && docs.length > 0) {
    for (const doc of docs) {
      try {
        const { data: fileData, error: dlError } = await supabase.storage
          .from('deal-documents')
          .download(doc.storage_path)

        if (dlError || !fileData) continue

        const buffer = Buffer.from(await fileData.arrayBuffer())
        const mime = doc.mime_type || fileData.type

        if (mime === 'application/pdf') {
          // PDF: extract what we can, Claude will process via structured generation
          const str = buffer.toString('latin1')
          const textMatches = str.match(/\(([^)]+)\)/g)
          if (textMatches) {
            const text = textMatches.map((m) => m.slice(1, -1)).join(' ')
            if (text.length > 50) {
              documentTexts.push(`[Documento: ${doc.file_name}]\n${text}`)
            }
          }
          // Also add base64 reference for Claude
          documentTexts.push(
            `[PDF base64 — ${doc.file_name}]: Contenuto PDF disponibile per analisi`
          )
        } else if (
          mime ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mime === 'application/msword'
        ) {
          const result = await mammoth.extractRawText({ buffer })
          if (result.value) {
            documentTexts.push(
              `[Documento: ${doc.file_name}]\n${result.value}`
            )
          }
        } else {
          const text = buffer.toString('utf-8')
          if (text.length > 0 && text.length < 100000) {
            documentTexts.push(`[File: ${doc.file_name}]\n${text}`)
          }
        }
      } catch {
        // Skip unreadable documents
      }
    }
  }

  // Build document context
  const documentContext =
    documentTexts.length > 0
      ? `\n\nDOCUMENTI DISPONIBILI:\n${documentTexts.join('\n\n---\n\n')}`
      : '\n\nNessun documento disponibile — basa il pitch deck sui dati del deal.'

  // Build user prompt with deal data
  const checklist = deal.checklist_data || {}
  const userPrompt = `Genera un pitch deck professionale per questa operazione di investment banking.

DATI DEL DEAL:
- Titolo: ${deal.title || 'N/A'}
- Codice: ${deal.code || 'N/A'}
- Settore: ${deal.sector || 'N/A'}
- Sub-settore: ${deal.sub_sector || 'N/A'}
- Tipo operazione: ${deal.deal_type || 'N/A'}
- Asset class: ${deal.asset_class || 'N/A'}
- Side: ${deal.side || 'N/A'}
- EV Range: ${deal.ev_range || 'N/A'}
- Geografia: ${deal.geography || 'N/A'}
- Descrizione: ${deal.description || deal.teaser_description || deal.blind_description || 'N/A'}
- Dati checklist: ${JSON.stringify(checklist)}
${documentContext}

ISTRUZIONI:
- Genera TUTTI i campi del pitch deck in formato JSON
- Per i financials, usa dati realistici basati sui documenti se disponibili
- I valori monetari devono essere in EUR
- Il tono deve essere professionale da investment banking italiano
- Non inventare nomi di persone se non presenti nei documenti
- Per i contatti, usa "Minerva Partners" come lead advisor
- Rispondi SOLO con un JSON valido che rispetti lo schema`

  const systemPrompt = `Sei un senior investment banker di Minerva Partners, boutique di M&A italiana di alto livello.
Il tuo compito è generare pitch deck professionali per operazioni di finanza straordinaria.
Scrivi in italiano professionale con terminologia tecnica di investment banking.
Rispondi ESCLUSIVAMENTE con un JSON valido, senza testo aggiuntivo, senza markdown.`

  try {
    const pitchDeck = await generateStructured({
      useCase: 'pitch_deck',
      systemPrompt,
      userPrompt,
      schema: PitchDeckSchema,
      dealId,
      userId: user.id,
      maxTokens: 6000,
    })

    // Determine next version
    const { data: existing } = await supabase
      .from('intelligence_outputs')
      .select('version')
      .eq('deal_id', dealId)
      .eq('output_type', 'pitch_deck')
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1

    // Save to intelligence_outputs as DRAFT
    const { data: output, error: insertError } = await supabase
      .from('intelligence_outputs')
      .insert({
        deal_id: dealId,
        output_type: 'pitch_deck',
        version: nextVersion,
        content: pitchDeck,
        generated_by: 'claude-sonnet-4-20250514',
        created_by: user.id,
        is_published: false,
      })
      .select()
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
        action: 'pitch_deck_generated',
        details: {
          version: nextVersion,
          output_id: output.id,
          deal_title: deal.title,
        },
      })
      .then(
        () => {},
        () => {}
      )

    return NextResponse.json({ data: output })
  } catch (err: any) {
    console.error('Pitch deck generation error:', err)
    return NextResponse.json(
      { error: err.message || 'Errore generazione pitch deck' },
      { status: 500 }
    )
  }
}
