'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle2, AlertCircle, FileSignature } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buttonPrimary } from '@/components/ui/form'
import { cn } from '@/lib/utils'

export function PattoStatusWidget() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user
      if (!user) return setLoading(false)
      const { data } = await supabase
        .from('profiles')
        .select('id, role, onboarding_completed, onboarding_deadline, created_at')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading || !profile) return null
  if (profile.role === 'admin') return null
  if (profile.onboarding_completed) return null

  const deadline = profile.onboarding_deadline
    ? new Date(profile.onboarding_deadline)
    : new Date(new Date(profile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
  const daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
  const expired = daysRemaining === 0

  return (
    <div className={cn(
      'bg-white rounded-2xl border-2 p-5 mb-6',
      expired ? 'border-red-300' : 'border-amber-200'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-sm font-bold text-slate-900">Onboarding Minerva</h3>
        </div>

        <div className="text-right">
          <div className={cn(
            'text-xs flex items-center gap-1',
            expired ? 'text-red-500' : daysRemaining < 7 ? 'text-amber-500' : 'text-slate-400'
          )}>
            <Clock className="w-3 h-3" />
            {expired ? 'Scaduto' : `${daysRemaining} giorni rimasti`}
          </div>
          {!expired && (
            <div className="mt-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
              <div
                className={cn(
                  'h-full transition-all rounded-full',
                  daysRemaining < 7 ? 'bg-amber-400' : 'bg-[#D4AF37]'
                )}
                style={{ width: `${(daysRemaining / 30) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">Firma Codici & Patto</span>
        <span className="text-amber-500 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> Da completare
        </span>
      </div>

      <Link href="/portal/onboarding" className={cn(buttonPrimary, 'w-full justify-center')}>
        Continua onboarding
      </Link>
    </div>
  )
}
