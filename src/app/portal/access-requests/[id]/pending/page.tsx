import { PendingClient } from './PendingClient'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PendingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase
    .from('deal_interest_requests')
    .select(`
      id, deal_id, l1_status, l1_decided_at,
      interest_message, anonymous_code,
      created_at,
      deals!inner(code, title, sector, geography)
    `)
    .eq('id', id)
    .eq('requester_id', user.id)
    .single()

  if (!request) notFound()

  // Se già decisa, redirect alla pagina deal
  if (request.l1_status !== 'pending') {
    redirect(`/portal/deals/${request.deal_id}`)
  }

  return <PendingClient request={request} />
}
