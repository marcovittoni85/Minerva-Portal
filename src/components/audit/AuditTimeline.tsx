'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronRight, Filter } from 'lucide-react'
import { MinervaAvatar } from '@/components/ui/MinervaAvatar'
import { timeAgo, formatDateTimeIT } from '@/lib/format'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: string
  action: string
  user_id: string
  details: any
  created_at: string
  profile?: { full_name: string } | null
}

interface Props {
  dealId: string
}

const ACTION_LABELS: Record<string, string> = {
  deal_created: 'Deal creato',
  deal_published: 'Deal pubblicato',
  deal_viewed: 'Deal visualizzato',
  access_requested: 'Accesso richiesto',
  access_approved: 'Accesso approvato',
  workgroup_added: 'Aggiunto al workgroup',
  declaration_submitted: 'Dichiarazione inviata',
  stage_changed: 'Stato cambiato',
  l1_interest_requested: 'L1 richiesta inviata',
  l1_approved: 'L1 approvata',
  l1_declined: 'L1 declinata',
  l2_submitted: 'L2 documenti caricati',
  l2_admin_verified: 'L2 verificata da admin',
  l2_approved: 'L2 approvata',
  l2_declined: 'L2 declinata',
  nda_awareness_confirmed: 'NDA confermato',
  nda_uploaded: 'NDA caricato',
  fee_agreement_signed: 'Fee agreement firmato',
  document_uploaded: 'Documento caricato',
  presentation_requested: 'Presentazione richiesta',
  presentation_approved: 'Presentazione approvata',
  presentation_rejected: 'Presentazione rifiutata',
  board_fields_updated: 'Campi bacheca aggiornati',
  blind_generated: 'Blind generato',
}

export function AuditTimeline({ dealId }: Props) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('deal_activity_log')
      .select('id, action, user_id, details, created_at')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(async ({ data }) => {
        if (!data || data.length === 0) {
          setLoading(false)
          return
        }

        // Resolve user names
        const userIds = [...new Set(data.map(e => e.user_id).filter(Boolean))]
        const { data: profiles } = userIds.length > 0
          ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
          : { data: [] }
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, { full_name: p.full_name }]))

        setEntries(data.map(e => ({
          ...e,
          profile: e.user_id ? profileMap[e.user_id] : null,
        })))
        setLoading(false)
      })
  }, [dealId])

  const actionTypes = Array.from(new Set(entries.map(e => e.action)))
  const filtered = filter === 'all' ? entries : entries.filter(e => e.action === filter)

  if (loading) return <div className="text-slate-400 text-sm py-4">Caricamento timeline...</div>

  if (entries.length === 0) {
    return <div className="text-slate-400 text-sm text-center py-8">Nessun evento registrato</div>
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
        >
          <option value="all">Tutti gli eventi ({entries.length})</option>
          {actionTypes.map(t => (
            <option key={t} value={t}>
              {ACTION_LABELS[t] ?? t} ({entries.filter(e => e.action === t).length})
            </option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[26px] top-3 w-3 h-3 rounded-full bg-[#D4AF37] ring-4 ring-white" />

              <div className="bg-white border border-slate-100 rounded-xl p-3">
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <MinervaAvatar user={entry.profile ?? { full_name: 'Sistema' }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-700">
                      <strong className="text-slate-900">{entry.profile?.full_name ?? 'Sistema'}</strong>
                      {' '}
                      <span className="text-slate-500">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {timeAgo(entry.created_at)} &middot; {formatDateTimeIT(entry.created_at)}
                    </div>
                  </div>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    expandedId === entry.id
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {expandedId === entry.id && entry.details && Object.keys(entry.details).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <pre className="text-[10px] text-slate-500 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
