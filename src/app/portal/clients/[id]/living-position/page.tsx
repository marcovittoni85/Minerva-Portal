import { LivingPositionClient } from './LivingPositionClient'
import { FAMIGLIA_BIANCHI_DEMO } from '@/data/living-position-demo'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function LivingPositionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/portal')

  if (id === 'demo-bianchi' || id === 'famiglia-bianchi') {
    return <LivingPositionClient client={FAMIGLIA_BIANCHI_DEMO} />
  }

  notFound()
}
