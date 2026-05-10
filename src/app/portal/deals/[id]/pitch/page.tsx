export const dynamic = 'force-dynamic'
import { supabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PitchDeckClient from './PitchDeckClient'

export default async function PitchDeckPage({
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

  const { data: prof } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = prof?.role?.toString() === 'admin'

  // Get deal
  const { data: deal } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .single()

  if (!deal) redirect('/portal/my-deals')

  // Get intelligence_outputs for pitch_deck
  // Admin sees all (including drafts), non-admin only published
  let query = supabase
    .from('intelligence_outputs')
    .select('*')
    .eq('deal_id', id)
    .eq('output_type', 'pitch_deck')
    .order('version', { ascending: false })

  if (!isAdmin) {
    query = query.eq('is_published', true)
  }

  const { data: outputs } = await query

  return (
    <PitchDeckClient
      deal={deal}
      outputs={outputs ?? []}
      isAdmin={isAdmin}
      userId={user.id}
      userName={prof?.full_name || ''}
    />
  )
}
