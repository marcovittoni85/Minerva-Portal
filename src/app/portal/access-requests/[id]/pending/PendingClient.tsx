'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Clock, Circle, ArrowLeft, ListOrdered } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buttonSecondary } from '@/components/ui/form'
import { formatDateTimeIT, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PendingClient({ request }: { request: any }) {
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!polling) return
    const interval = setInterval(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('deal_interest_requests')
        .select('l1_status')
        .eq('id', request.id)
        .single()

      if (data && data.l1_status !== 'pending') {
        window.location.reload()
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [polling, request.id])

  const deal = request.deals
  const steps = [
    {
      label: 'Richiesta inviata',
      timestamp: request.created_at,
      status: 'completed' as const,
    },
    {
      label: 'In review da Hub Minerva',
      timestamp: null,
      status: 'active' as const,
    },
    {
      label: 'Decisione (entro 5 gg lavorativi)',
      timestamp: null,
      status: 'future' as const,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-block bg-amber-50 rounded-full p-4 mb-4">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Richiesta in revisione
        </h1>
        <p className="text-slate-500 text-sm">
          Stiamo valutando la tua richiesta per il deal {deal.code || deal.title}
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Stato richiesta</h3>

        <div className="relative">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 relative pb-8 last:pb-0">

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className={cn(
                  'absolute left-4 top-10 bottom-0 w-0.5',
                  step.status === 'completed' ? 'bg-[#D4AF37]' : 'bg-slate-200'
                )} />
              )}

              {/* Icon */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                step.status === 'completed' && 'bg-[#D4AF37]',
                step.status === 'active' && 'bg-amber-100 animate-pulse border-2 border-amber-400',
                step.status === 'future' && 'bg-slate-100 border-2 border-slate-200'
              )}>
                {step.status === 'completed' && <Check className="w-4 h-4 text-white" />}
                {step.status === 'active' && <Circle className="w-4 h-4 text-amber-500" />}
                {step.status === 'future' && <Circle className="w-4 h-4 text-slate-300" />}
              </div>

              {/* Content */}
              <div className="flex-1 -mt-0.5">
                <div className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-slate-900',
                  step.status === 'active' && 'text-amber-700',
                  step.status === 'future' && 'text-slate-400'
                )}>
                  {step.label}
                </div>
                {step.timestamp && (
                  <div className="text-xs text-slate-400 mt-1">
                    {formatDateTimeIT(step.timestamp)} &middot; {timeAgo(step.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Riepilogo richiesta */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Riepilogo richiesta</h3>
        <div className="space-y-3 text-sm">
          <Row label="Codice" value={request.anonymous_code} />
          <Row label="Deal" value={deal.code || deal.title} />
          <Row label="Settore" value={deal.sector} />
          <div>
            <div className="text-xs text-slate-400 mb-1">Motivazione</div>
            <div className="text-slate-600 italic text-sm">{request.interest_message}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Link href="/portal" className={buttonSecondary}>
          <ArrowLeft className="w-4 h-4" /> Torna alla bacheca
        </Link>
        <Link href="/portal/access-requests" className={buttonSecondary}>
          <ListOrdered className="w-4 h-4" /> Tutte le mie richieste
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}
