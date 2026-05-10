export const dynamic = 'force-dynamic'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PresentationClient from './PresentationClient'

export default async function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: deal } = await supabase
    .from('deals')
    .select(`
      id, code, title, sector, geography, side, ev_range, asset_class,
      description, blind_description, teaser_description,
      checklist_data, originator_id,
      deal_documents(id, file_name, file_type, file_size)
    `)
    .eq('id', id)
    .single()

  if (!deal) notFound()

  const isAdmin = profile.role === 'admin'
  const isOriginator = deal.originator_id === user.id

  // Check L1/L2 status
  const { data: interest } = await supabase
    .from('deal_interest_requests')
    .select('id, l1_status, l2_status, l2_admin_verified')
    .eq('deal_id', id)
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const canSeeFull = isAdmin || isOriginator ||
    interest?.l1_status === 'approved' ||
    interest?.l2_status === 'approved'

  const ndaRequired = canSeeFull && !isAdmin && !isOriginator

  let originatorName = ''
  if (deal.originator_id) {
    const { data: orig } = await supabase.from('profiles').select('full_name').eq('id', deal.originator_id).single()
    originatorName = orig?.full_name || ''
  }

  return (
    <PresentationClient
      deal={deal}
      originatorName={originatorName}
      canSeeFull={canSeeFull}
      ndaRequired={ndaRequired}
    />
  )
}
