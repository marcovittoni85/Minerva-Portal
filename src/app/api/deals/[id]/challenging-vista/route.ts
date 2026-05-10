import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { ChallengingVistaSchema } from '@/lib/claude/schemas/challenging-vista'

const anthropic = new Anthropic()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const supabase = await supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single()
  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dealContext = `
DEAL: ${deal.code || deal.title}
Settore: ${deal.sector || ''}
Tipo operazione: ${deal.deal_type || ''}
Descrizione: ${deal.description || ''}
EV Range: ${deal.ev_range || ''}
Area: ${deal.geography || ''}
`

  const systemPrompt = `Sei l'engine "Challenging Vista" di Minerva Partners.
Generi 3 letture parallele dello stesso deal da 3 prospettive distinte:

1. MARCO VITTONI (M&A boutique advisor): lente strategica, valuation, exit, multipli, deal architecture
2. ENRICO VIGANO (Tax/Governance/CFO): lente fiscale, governance societaria, rischi compliance, struttura legal
3. CLIENTE IMPRENDITORE: lente emotiva e personale - paura, ambizione, eredita famiglia, controllo, legacy

REGOLE:
- Le 3 viste devono essere DISTINTE e autentiche, non variazioni della stessa risposta
- Ogni vista propone 2-3 soluzioni con pro/contro
- Esplicita le TENSIONI tra le viste
- Recommendation finale bilanciata che riconosca i trade-off
- Italiano professionale e diretto
- Rispondi SOLO con JSON valido, nessun testo aggiuntivo`

  const userPrompt = `Analizza:\n${dealContext}\n\nGenera Challenging Vista con questo schema JSON:
{
  "marco_view": { "perspective": "...", "reading": "...", "proposed_solutions": [{"title":"...", "description":"...", "pros":["..."], "cons":["..."]}], "trade_offs": ["..."], "tensions_with_others": ["..."] },
  "enrico_view": { ... same structure ... },
  "cliente_view": { ... same structure ... },
  "consolidated_tensions": ["..."],
  "recommendation": "..."
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from Claude' }, { status: 500 })
    }

    // Parse and validate
    const raw = JSON.parse(textBlock.text)
    const vista = ChallengingVistaSchema.parse(raw)

    // Save in intelligence_outputs (if table exists)
    try {
      const { data: existing } = await supabase
        .from('intelligence_outputs')
        .select('version')
        .eq('deal_id', dealId)
        .eq('output_type', 'challenging_vista')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      const newVersion = (existing?.version ?? 0) + 1

      await supabase.from('intelligence_outputs').insert({
        deal_id: dealId,
        output_type: 'challenging_vista',
        version: newVersion,
        content: vista,
        generated_by: 'claude-sonnet-4',
        created_by: user.id,
        is_published: false,
      })
    } catch {
      // intelligence_outputs table may not exist yet - continue anyway
    }

    return NextResponse.json({ success: true, vista })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
