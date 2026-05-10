'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, X, AlertCircle, FileText, ArrowLeft } from 'lucide-react'
import { buttonPrimary, buttonSecondary, textareaClass } from '@/components/ui/form'
import { MinervaAvatar } from '@/components/ui/MinervaAvatar'
import { cn } from '@/lib/utils'

const VERIFICATION_CHECKLIST = [
  { id: 'mandate_signed', label: 'Mandato firmato (data + firma autentica)' },
  { id: 'client_consistent', label: 'Nome cliente coerente con dichiarato' },
  { id: 'fees_consistent', label: 'Fee coerenti con accordo' },
  { id: 'mandate_type_declared', label: 'Tipo mandato dichiarato (esclusivo/generico/nessuno)' },
]

export function VerifyL2Client({ requests }: { requests: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(requests[0]?.id ?? null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [decision, setDecision] = useState<'approve' | 'decline' | 'clarify' | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selected = requests.find((r: any) => r.id === selectedId)
  const allChecked = VERIFICATION_CHECKLIST.every(c => checks[c.id])

  const handleSubmit = async () => {
    if (!selected || !decision) return
    if (decision === 'decline' && !reason) return

    setSubmitting(true)
    try {
      const decisionMap: Record<string, string> = {
        approve: 'approved',
        decline: 'rejected',
        clarify: 'clarification',
      }
      await fetch('/api/deal-interest/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selected.id,
          decision: decisionMap[decision],
          notes: reason || undefined,
        }),
      })
      window.location.reload()
    } catch {
      alert('Errore durante l\'invio')
    } finally {
      setSubmitting(false)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900">Nessuna richiesta L2 da verificare</h2>
        <Link href="/portal/deal-manage" className={cn(buttonSecondary, 'mt-4')}>
          <ArrowLeft className="w-4 h-4" /> Torna alla gestione deal
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Link href="/portal/deal-manage" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna alla gestione deal
      </Link>

      <h1 className="text-xl font-bold text-slate-900 mb-6">Verifica richieste L2 ({requests.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-2">
          {requests.map((r: any) => (
            <button
              key={r.id}
              onClick={() => { setSelectedId(r.id); setChecks({}); setDecision(null); setReason('') }}
              className={cn(
                'w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors',
                selectedId === r.id ? 'bg-[#D4AF37]/5 border-2 border-[#D4AF37]/30' : 'bg-white border border-slate-100 hover:bg-slate-50'
              )}
            >
              <MinervaAvatar user={r.requester} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-900 font-medium truncate">{r.requester.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{r.docs.length} documenti</div>
              </div>
            </button>
          ))}
        </aside>

        {/* Detail */}
        {selected && (
          <main className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-4">
                <MinervaAvatar user={selected.requester} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.requester.full_name}</h2>
                  <p className="text-sm text-slate-500">{selected.requester.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Deal: {selected.deal.code} &middot; Cliente: {selected.l2_client_name} {selected.l2_client_surname}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Documenti caricati</h3>
              {selected.docs.length === 0 ? (
                <p className="text-sm text-slate-400">Nessun documento caricato</p>
              ) : (
                <div className="space-y-2">
                  {selected.docs.map((doc: any) => (
                    <div key={doc.id} className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div className="flex-1">
                        <div className="text-sm text-slate-700">{doc.file_name}</div>
                        <div className="text-[10px] text-slate-400">{doc.doc_type || 'documento'}</div>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" className="text-[10px] font-bold text-[#D4AF37] hover:underline uppercase tracking-widest">
                          Apri
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Checklist verifica</h3>
              <div className="space-y-2">
                {VERIFICATION_CHECKLIST.map(item => (
                  <label key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={checks[item.id] ?? false}
                      onChange={e => setChecks({ ...checks, [item.id]: e.target.checked })}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Decision */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Decisione</h3>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setDecision('approve')}
                  disabled={!allChecked}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    decision === 'approve' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300',
                    !allChecked && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  <Check className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">Approva</div>
                </button>
                <button
                  onClick={() => setDecision('clarify')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    decision === 'clarify' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">Chiarimenti</div>
                </button>
                <button
                  onClick={() => setDecision('decline')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-center',
                    decision === 'decline' ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <X className="w-5 h-5 text-red-500 mx-auto mb-1" />
                  <div className="text-xs font-bold text-slate-700">Rifiuta</div>
                </button>
              </div>

              {(decision === 'decline' || decision === 'clarify') && (
                <textarea
                  className={textareaClass + ' mb-4'}
                  placeholder={decision === 'decline' ? 'Motivazione rifiuto (obbligatoria)' : 'Cosa chiarire'}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={!decision || submitting || (decision === 'decline' && !reason)}
                className={cn(buttonPrimary, 'w-full justify-center')}
              >
                {submitting ? 'Invio...' : 'Conferma decisione'}
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
