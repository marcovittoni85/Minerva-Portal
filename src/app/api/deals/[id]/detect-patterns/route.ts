import { getAuthUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateStructured } from '@/lib/claude/generators'
import { PatternDetectionSchema } from '@/lib/claude/schemas/pattern-detection'

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

  // Check if user is admin (only admin can regenerate)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Any authenticated user can trigger first detection, but only admin can regenerate
  const isAdmin = profile?.role === 'admin'

  // Check if detection already exists
  const { data: existing } = await supabase
    .from('intelligence_outputs')
    .select('id, version')
    .eq('deal_id', dealId)
    .eq('output_type', 'pattern_detection')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && !isAdmin) {
    return NextResponse.json(
      { error: 'Solo gli admin possono rigenerare la detection' },
      { status: 403 }
    )
  }

  // Fetch deal data
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select(
      'id, codice_anonimo, settore, tipo_operazione, razionale_strategico, perche_interessante, dati_full'
    )
    .eq('id', dealId)
    .single()

  if (dealError || !deal) {
    return NextResponse.json({ error: 'Deal non trovato' }, { status: 404 })
  }

  // Fetch all active patterns
  const { data: patterns, error: patternsError } = await supabase
    .from('a2_patterns')
    .select('code, name, category, description')
    .eq('is_active', true)
    .order('code')

  if (patternsError || !patterns || patterns.length === 0) {
    return NextResponse.json(
      { error: 'Nessun pattern attivo trovato' },
      { status: 500 }
    )
  }

  // Build patterns context
  const patternsContext = patterns
    .map((p) => `- ${p.code} | ${p.name} [${p.category}]: ${p.description}`)
    .join('\n')

  // Build deal context
  const dealContext = `
DATI DEAL:
- Codice Anonimo: ${deal.codice_anonimo || 'N/A'}
- Settore: ${deal.settore || 'N/A'}
- Tipo Operazione: ${deal.tipo_operazione || 'N/A'}
- Razionale Strategico: ${deal.razionale_strategico || 'N/A'}
- Perche Interessante: ${deal.perche_interessante || 'N/A'}
- Dati Completi: ${deal.dati_full ? JSON.stringify(deal.dati_full) : 'N/A'}

CATALOGO PATTERN (${patterns.length} pattern attivi):
${patternsContext}

Analizza il deal rispetto a TUTTI i ${patterns.length} pattern del catalogo.
Restituisci SOLO i pattern con score >= 50.
Per ogni pattern rilevato fornisci: code, name, score (0-100), confidence (high/medium/low), evidence (breve spiegazione di perche il pattern si applica), e opzionalmente suggested_action.
Se nessun pattern ha score >= 50, restituisci un array vuoto e un no_patterns_note esplicativo.
Rispondi ESCLUSIVAMENTE con JSON valido.`

  const systemPrompt = `Sei il motore di Pattern Detection di Minerva Partners, boutique di investment banking italiana.
Il tuo compito e analizzare un deal M&A rispetto a un catalogo di 42 pattern comportamentali, strategici e di rischio.
Per ogni pattern, valuta quanto si applica al deal specifico e assegna uno score da 0 a 100.
Restituisci SOLO i pattern con score >= 50, ordinati per score decrescente.
Sii rigoroso: un pattern deve avere evidenza concreta nel deal per ricevere uno score alto.
- Score >= 80: evidenza forte e diretta
- Score 65-79: evidenza moderata o indiretta
- Score 50-64: segnale debole ma rilevante
Rispondi ESCLUSIVAMENTE con un JSON valido, senza testo aggiuntivo.`

  try {
    const result = await generateStructured({
      useCase: 'pattern_detection',
      systemPrompt,
      userPrompt: dealContext,
      schema: PatternDetectionSchema,
      dealId,
      userId: user.id,
      maxTokens: 4000,
    })

    // Get max version for this deal + output_type
    const newVersion = (existing?.version ?? 0) + 1

    // Save to intelligence_outputs — pattern detection is always published
    const { data: output, error: insertError } = await supabase
      .from('intelligence_outputs')
      .insert({
        deal_id: dealId,
        output_type: 'pattern_detection',
        version: newVersion,
        content: result,
        is_published: true,
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
        action: 'pattern_detection_generated',
        details: {
          version: newVersion,
          output_id: output.id,
          patterns_detected: result.detected_patterns.length,
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
      detection: result,
    })
  } catch (err: any) {
    console.error('Pattern detection error:', err)
    return NextResponse.json(
      { error: 'Errore generazione: ' + (err?.message || 'Errore sconosciuto') },
      { status: 500 }
    )
  }
}
