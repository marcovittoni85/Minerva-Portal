import { AccessRequestClient } from './AccessRequestClient'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AccessDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  // Verifica utente ha completato onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect('/portal/onboarding')
  }

  // Recupera deal
  const { data: deal } = await supabase
    .from('deals')
    .select('id, code, title, sector, geography, side, ev_range, board_status')
    .eq('id', id)
    .single()

  if (!deal) notFound()

  // Verifica che l'utente non abbia già una richiesta attiva
  const { data: existingRequest } = await supabase
    .from('deal_interest_requests')
    .select('id, l1_status')
    .eq('deal_id', id)
    .eq('requester_id', user.id)
    .in('l1_status', ['pending', 'approved'])
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.l1_status === 'pending') {
      redirect(`/portal/access-requests/${existingRequest.id}/pending`)
    }
    redirect(`/portal/deals/${id}`)
  }

  return <AccessRequestClient deal={deal} profile={profile} />
}
