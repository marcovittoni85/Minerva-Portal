import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { generateDealCover } from '@/lib/cover-generator'

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

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: deal } = await supabase
    .from('deals')
    .select('id, sector, sub_sector, deal_type, cover_url')
    .eq('id', dealId)
    .single()

  if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const result = await generateDealCover({
      dealId: deal.id,
      settore: deal.sector || deal.sub_sector || '',
      tipoOperazione: deal.deal_type || 'M&A',
    })

    return NextResponse.json({ success: true, url: result.url })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
