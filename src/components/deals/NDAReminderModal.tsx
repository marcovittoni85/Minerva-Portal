'use client'
import { useEffect, useState } from 'react'
import { Shield, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buttonPrimary } from '@/components/ui/form'
import { formatDateIT } from '@/lib/format'

interface Props {
  dealId: string
  dealCode: string
  ndaSignedAt?: string
  onAccepted: () => void
}

const SESSION_KEY_PREFIX = 'minerva_nda_ack_'

export function NDAReminderModal({ dealId, dealCode, ndaSignedAt, onAccepted }: Props) {
  const [show, setShow] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const sessionKey = `${SESSION_KEY_PREFIX}${dealId}`
    const acked = sessionStorage.getItem(sessionKey)
    if (!acked) setShow(true)
  }, [dealId])

  const handleAccept = async () => {
    setAccepting(true)

    const supabase = createClient()
    await supabase.from('deal_activity_log').insert({
      deal_id: dealId,
      action: 'nda_awareness_confirmed',
      details: { confirmed_at: new Date().toISOString() },
    })

    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${dealId}`, '1')
    setShow(false)
    onAccepted()
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Stai accedendo a dati riservati
            </h2>
            <p className="text-sm text-slate-500 mt-1">Deal {dealCode}</p>
          </div>
        </div>

        {ndaSignedAt && (
          <p className="text-slate-600 mb-4 text-sm">
            Hai firmato NDA preliminare il <strong className="text-slate-900">{formatDateIT(ndaSignedAt)}</strong>
          </p>
        )}

        <div className="space-y-3 mb-6">
          {[
            {
              title: 'Art. 1 — Riservatezza assoluta',
              body: 'I dati e documenti del deal sono strettamente confidenziali. Vietato condividere con terzi senza autorizzazione scritta di Minerva Partners.',
            },
            {
              title: 'Art. 2 — Non-circumvention 18 mesi',
              body: 'Vietato contattare direttamente target/controparti senza intermediazione Minerva per 18 mesi dalla firma NDA.',
            },
            {
              title: 'Art. 3 — Sanzioni e penali',
              body: 'Violazioni comportano risoluzione immediata del rapporto, penale forfettaria €100.000 + risarcimento danni.',
            },
          ].map((art, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-slate-900">{art.title}</strong>
                <p className="text-slate-500 mt-1">{art.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <a
            href={`/portal/deals/${dealId}`}
            className="text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Torna al deal
          </a>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className={buttonPrimary}
          >
            {accepting ? 'Conferma in corso...' : 'Comprendo e accetto'}
          </button>
        </div>
      </div>
    </div>
  )
}
