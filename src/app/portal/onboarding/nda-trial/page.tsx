import { NdaTrialClient } from './NdaTrialClient'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NdaTrialPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* no-op in server component */ },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Se già firmato, vai avanti ai Codici
  const { data: existingNDA } = await supabase
    .from('nda_trial_signatures')
    .select('id, signed_at')
    .eq('user_id', user.id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingNDA) redirect('/portal/onboarding')

  return <NdaTrialClient profile={profile} />
}