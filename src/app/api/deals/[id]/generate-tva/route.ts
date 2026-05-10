import { getAuthUser } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateStructured } from '@/lib/claude/generators'
import { TVASchema } from '@/lib/claude/schemas/tva'

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

  // Parse body
  let body: {
    settore: string
    revenue_eur: number
    ebitda_eur: number
    growth_pct: number
    country: string
    notes?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Body JSON non valido' },
      { status: 400 }
    )
  }

  const { settore, revenue_eur, ebitda_eur, growth_pct, country, notes } = body

  if (!settore || !revenue_eur || !ebitda_eur || !country) {
    return NextResponse.json(
      { error: 'Campi obbligatori mancanti: settore, revenue_eur, ebitda_eur, country' },
      { status: 400 }
    )
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

  // Optionally retrieve existing published reclassification for real financial data
  let reclassificationContext = ''
  const { data: reclassification } = await supabase
    .from('intelligence_outputs')
    .select('content')
    .eq('deal_id', dealId)
    .eq('output_type', 'reclassification')
    .eq('is_published', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (reclassification?.content) {
    reclassificationContext = `

RICLASSIFICAZIONE BILANCIO DISPONIBILE (dati reali):
${JSON.stringify(reclassification.content, null, 2)}

IMPORTANTE: Usa i dati della riclassificazione come base per la valutazione. I valori di revenue e EBITDA forniti dall'utente devono essere usati come riferimento primario, ma integra con i dati della riclassificazione dove disponibili per una valutazione piu accurata.`
  }

  // Build prompts
  const systemPrompt = `Sei un esperto di valutazione aziendale italiano, specializzato in PMI e mid-market.
Il tuo compito e produrre una True Value Assessment (TVA) professionale per un'azienda italiana.

REGOLE:
1. Usa ESCLUSIVAMENTE 5 metodologie di valutazione:
   - EBITDA Multiple: applica multipli EV/EBITDA appropriati per il settore e la dimensione dell'azienda in Italia
   - Revenue Multiple: applica multipli EV/Revenue appropriati per il settore
   - DCF (Discounted Cash Flow): con WACC realistico per PMI italiane (tipicamente 8-14%), terminal growth 1.5-2.5%
   - Comparables: usa transazioni REALI nel mercato italiano o europeo (almeno 2, massimo 5). Indica date, target, settore e multipli reali. Non inventare transazioni — usa comparabili realistici basati sulla tua conoscenza del mercato M&A italiano.
   - Asset-based: valutazione patrimoniale, indica applicable=true solo se l'azienda ha asset tangibili significativi (immobiliare, macchinari, etc.)

2. Per ogni metodologia, calcola range low/mid/high coerenti tra loro
3. Il consolidated_range deve essere la media ponderata intelligente delle metodologie, dando piu peso a EBITDA multiple e DCF
4. La narrativa deve essere in italiano professionale, stile investment banking
5. Tutti gli importi in EUR
6. I multipli devono essere realistici per il mercato italiano nel settore indicato
7. Rispondi ESCLUSIVAMENTE con un JSON valido che rispetta lo schema fornito, senza testo aggiuntivo`

  const userPrompt = `Genera una True Value Assessment (TVA) completa per questa azienda.

DATI DELL'AZIENDA:
- Nome/Codice Deal: ${deal.title || deal.codice_anonimo || deal.code || 'N/A'}
- Settore: ${settore}
- Paese: ${country}
- Revenue (EUR): ${revenue_eur.toLocaleString('it-IT')}
- EBITDA (EUR): ${ebitda_eur.toLocaleString('it-IT')}
- Margine EBITDA: ${((ebitda_eur / revenue_eur) * 100).toFixed(1)}%
- Tasso di crescita: ${growth_pct}%
${notes ? `- Note aggiuntive: ${notes}` : ''}

DATI DEL DEAL:
- Tipo operazione: ${deal.tipo_operazione || deal.deal_type || 'N/A'}
- EV Range indicativo: ${deal.ev_range || deal.range_fatturato || 'N/A'}
- Geografia: ${deal.area_geografica || deal.geography || country}
- Descrizione: ${deal.description || deal.razionale_strategico || deal.blind_description || 'N/A'}
${reclassificationContext}

ISTRUZIONI:
- Calcola la valutazione usando tutte e 5 le metodologie
- Per i comparables, usa transazioni reali o realistiche nel mercato italiano/europeo del settore ${settore}
- Il consolidated_range deve riflettere una sintesi ponderata ragionevole
- La narrativa (why_valuation) deve spiegare in 2-3 paragrafi perche l'azienda vale quanto indicato
- Elenca almeno 3 value_drivers, 3 key_risks e 3 sensitivities
- Rispondi SOLO con un JSON valido`

  try {
    const tva = await generateStructured({
      useCase: 'tva',
      systemPrompt,
      userPrompt,
      schema: TVASchema,
      dealId,
      userId: user.id,
      maxTokens: 8000,
    })

    // Determine next version
    const { data: maxVersionRow } = await supabase
      .from('intelligence_outputs')
      .select('version')
      .eq('deal_id', dealId)
      .eq('output_type', 'tva')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (maxVersionRow?.version ?? 0) + 1

    // Save to intelligence_outputs as DRAFT
    const { data: output, error: insertError } = await supabase
      .from('intelligence_outputs')
      .insert({
        deal_id: dealId,
        output_type: 'tva',
        version: nextVersion,
        content: tva,
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
        action: 'tva_generated',
        details: {
          version: nextVersion,
          output_id: output.id,
          settore,
          revenue_eur,
          ebitda_eur,
          growth_pct,
          country,
        },
      })
      .then(
        () => {},
        () => {}
      )

    return NextResponse.json({ data: output })
  } catch (err: any) {
    console.error('TVA generation error:', err)
    return NextResponse.json(
      { error: err.message || 'Errore generazione TVA' },
      { status: 500 }
    )
  }
}
