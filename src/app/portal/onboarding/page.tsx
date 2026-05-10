import { OnboardingClient } from './OnboardingClient'
import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, onboarding_completed, onboarding_deadline, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.onboarding_completed) redirect('/portal')

  // Lookup Codici correnti dal DB (table: documents)
  const { data: codici } = await supabase
    .from('documents')
    .select('id, tipo, nome, versione, storage_path')
    .eq('tipo', 'codice')
    .eq('is_current', true)
    .order('nome')

  // Fallback: se documents table non ha dati, usa hardcoded
  const hasDynamicCodici = codici && codici.length > 0

  const codiciWithUrls = hasDynamicCodici
    ? await Promise.all(codici.map(async (c: any) => {
        const { data: signed } = await supabase.storage
          .from('minerva-documents')
          .createSignedUrl(c.storage_path, 3600)
        return { ...c, signedUrl: signed?.signedUrl ?? '' }
      }))
    : [
        { id: 'etico', nome: 'Codice Etico VERITAS', versione: '3.0', signedUrl: '' },
        { id: 'retributivo', nome: 'Codice Retributivo', versione: '3.0', signedUrl: '' },
        { id: 'operativo', nome: 'Codice Operativo', versione: '3.0', signedUrl: '' },
      ]

  // If fallback, get public URLs
  if (!hasDynamicCodici) {
    const paths: Record<string, string> = {
      etico: 'codici/Codice_Etico_VERITAS_Minerva.pdf',
      retributivo: 'codici/Codice_Retributivo_Minerva.pdf',
      operativo: 'codici/Codice_Operativo_Minerva.pdf',
    }
    for (const c of codiciWithUrls) {
      const path = paths[c.id]
      if (path) {
        const { data } = supabase.storage.from('minerva-documents').getPublicUrl(path)
        c.signedUrl = data?.publicUrl ?? ''
      }
    }
  }

  // Calcola giorni rimasti per onboarding
  const deadline = profile.onboarding_deadline
    ? new Date(profile.onboarding_deadline)
    : new Date(new Date(profile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))

  return (
    <OnboardingClient
      profile={profile}
      codici={codiciWithUrls}
      daysRemaining={daysRemaining}
      deadline={deadline.toISOString()}
    />
  )
}
