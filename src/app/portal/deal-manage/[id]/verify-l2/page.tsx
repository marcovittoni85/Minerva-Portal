import { VerifyL2Client } from './VerifyL2Client'
import { getAuthUser } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function VerifyL2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  const admin = supabaseAdmin()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/portal')

  // Pending L2 requests for this deal
  const { data: pendingRequests } = await admin
    .from('deal_interest_requests')
    .select('*')
    .eq('deal_id', id)
    .eq('l2_status', 'pending_admin')
    .order('created_at', { ascending: false })

  // Resolve requester profiles
  const requesterIds = [...new Set((pendingRequests ?? []).map(r => r.requester_id))]
  const { data: requesterProfiles } = requesterIds.length > 0
    ? await admin.from('profiles').select('id, full_name, email, phone').in('id', requesterIds)
    : { data: [] }
  const profileMap = Object.fromEntries((requesterProfiles ?? []).map(p => [p.id, p]))

  // Get deal info
  const { data: deal } = await admin
    .from('deals')
    .select('code, title')
    .eq('id', id)
    .single()

  // Fetch documents for each requester
  const requestsWithDocs = await Promise.all((pendingRequests ?? []).map(async req => {
    const { data: docs } = await admin
      .from('deal_documents')
      .select('*')
      .eq('deal_id', id)
      .eq('uploaded_by', req.requester_id)
      .order('created_at', { ascending: false })
    return {
      ...req,
      requester: profileMap[req.requester_id] || { full_name: 'Sconosciuto', email: '' },
      deal: deal || { code: '', title: '' },
      docs: docs ?? [],
    }
  }))

  return <VerifyL2Client requests={requestsWithDocs} />
}
