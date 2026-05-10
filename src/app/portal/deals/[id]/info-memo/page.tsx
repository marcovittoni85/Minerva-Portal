export const dynamic = 'force-dynamic'
import { supabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InfoMemoClient from './InfoMemoClient'

export default async function InfoMemoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await supabaseServer()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Get deal
  const { data: deal } = await supabase
    .from('deals')
    .select('id, codice_anonimo, nome_azienda, settore, tipo_operazione, range_fatturato, range_ebitda')
    .eq('id', id)
    .single()

  if (!deal) redirect('/portal/pipeline')

  // Get intelligence outputs for info_memo
  let query = supabase
    .from('intelligence_outputs')
    .select('id, deal_id, output_type, version, content, is_published, published_at, reviewed_at, reviewed_by, created_by, created_at')
    .eq('deal_id', id)
    .eq('output_type', 'info_memo')
    .order('version', { ascending: false })

  // Non-admin only sees published versions
  if (!isAdmin) {
    query = query.eq('is_published', true)
  }

  const { data: rawOutputs } = await query

  // Join reviewer profile (full_name) for each output that has reviewed_by
  const outputs = []
  if (rawOutputs && rawOutputs.length > 0) {
    const reviewerIds = [
      ...new Set(
        rawOutputs
          .filter((o) => o.reviewed_by)
          .map((o) => o.reviewed_by as string)
      ),
    ]

    let reviewerMap: Record<string, string> = {}
    if (reviewerIds.length > 0) {
      const { data: reviewerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', reviewerIds)
      reviewerMap = Object.fromEntries(
        (reviewerProfiles ?? []).map((p) => [p.id, p.full_name])
      )
    }

    for (const o of rawOutputs) {
      outputs.push({
        ...o,
        reviewer_name: o.reviewed_by ? reviewerMap[o.reviewed_by] || null : null,
      })
    }
  }

  return (
    <InfoMemoClient
      deal={deal}
      outputs={outputs}
      isAdmin={isAdmin}
      currentUserId={user.id}
    />
  )
}
