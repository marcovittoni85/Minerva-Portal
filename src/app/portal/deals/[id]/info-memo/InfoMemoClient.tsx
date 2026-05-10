'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDateTimeIT } from '@/lib/format'
import { cn } from '@/lib/utils'
import { buttonGold, buttonPrimary, buttonSecondary, selectClass } from '@/components/ui/form'
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  TrendingUp,
  Building2,
  Target,
  BarChart3,
  Handshake,
  ListChecks,
} from 'lucide-react'

interface InfoMemoOutput {
  id: string
  deal_id: string
  output_type: string
  version: number
  content: any
  is_published: boolean
  published_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  created_by: string
  created_at: string
}

interface InfoMemoProps {
  deal: {
    id: string
    codice_anonimo: string | null
    nome_azienda: string | null
    settore: string | null
    tipo_operazione: string | null
    range_fatturato: string | null
    range_ebitda: string | null
  }
  outputs: InfoMemoOutput[]
  isAdmin: boolean
  currentUserId: string
}

export default function InfoMemoClient({
  deal,
  outputs,
  isAdmin,
  currentUserId,
}: InfoMemoProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<number>(
    outputs.length > 0 ? outputs[0].version : 0
  )

  const selectedOutput = outputs.find((o) => o.version === selectedVersion) ?? null
  const memo = selectedOutput?.content as any | null

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}/generate-info-memo`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Errore nella generazione')
        return
      }
      router.refresh()
      // After refresh, select the new version
      setSelectedVersion(data.version)
    } catch (err) {
      alert('Errore di rete durante la generazione')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedOutput) return
    const supabase = createClient()
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('intelligence_outputs')
      .update({
        is_published: true,
        published_at: now,
        reviewed_at: now,
        reviewed_by: currentUserId,
      })
      .eq('id', selectedOutput.id)

    if (error) {
      alert('Errore durante l\'approvazione: ' + error.message)
      return
    }
    router.refresh()
  }

  const formatEur = (n: number) =>
    new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href={`/portal/deals/${deal.id}`}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              {deal.codice_anonimo || deal.id.slice(0, 8)}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Information Memorandum{' '}
              <span className="text-gold">
                {deal.nome_azienda || deal.settore || ''}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {deal.tipo_operazione} &middot; {deal.settore}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Version selector */}
            {outputs.length > 0 && (
              <select
                className={cn(selectClass, 'w-48')}
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
              >
                {outputs.map((o) => (
                  <option key={o.version} value={o.version}>
                    v{o.version} — {formatDateTimeIT(o.created_at)}
                    {o.is_published ? ' (Pubblicata)' : ' (Bozza)'}
                  </option>
                ))}
              </select>
            )}

            {/* Generate / Regenerate button */}
            {isAdmin && (
              <button
                className={buttonGold}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generazione in corso...
                  </>
                ) : outputs.length > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Rigenera
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Genera Info Memo
                  </>
                )}
              </button>
            )}

            {/* PDF export for published versions */}
            {selectedOutput?.is_published && (
              <a
                href={`/api/deals/${deal.id}/info-memo-pdf?version=${selectedVersion}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonSecondary}
              >
                <Download className="w-4 h-4" />
                Esporta PDF
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Status banner */}
      {selectedOutput && !selectedOutput.is_published && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Bozza — versione {selectedOutput.version}
              </p>
              <p className="text-xs text-amber-600">
                Questa versione non e ancora visibile agli utenti. Rivedi il
                contenuto e approvalo per pubblicare.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button className={buttonPrimary} onClick={handleApprove}>
              <CheckCircle2 className="w-4 h-4" />
              Approva e pubblica
            </button>
          )}
        </div>
      )}

      {selectedOutput?.is_published && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Pubblicata — versione {selectedOutput.version}
            </p>
            <p className="text-xs text-emerald-600">
              Approvata da{' '}
              <span className="font-medium">
                {selectedOutput.reviewer_name || 'Admin'}
              </span>{' '}
              il {formatDateTimeIT(selectedOutput.reviewed_at)}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedOutput && (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Nessun Information Memorandum
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {isAdmin
              ? 'Genera il primo Information Memorandum per questo deal utilizzando l\'intelligenza artificiale.'
              : 'L\'Information Memorandum per questo deal non e ancora stato pubblicato.'}
          </p>
          {isAdmin && (
            <button
              className={buttonGold}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Genera Info Memo
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Info Memo Content */}
      {memo && (
        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-lg">
          {/* Navy header bar */}
          <div className="bg-navy px-8 py-6">
            <p className="font-[family-name:var(--font-cormorant)] text-gold text-sm tracking-[4px] uppercase">
              Minerva Partners
            </p>
            <h2 className="font-[family-name:var(--font-cormorant)] text-white text-3xl mt-2">
              Information Memorandum
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {deal.nome_azienda || deal.codice_anonimo || ''} &middot;{' '}
              {deal.settore}
            </p>
          </div>

          <div className="bg-white divide-y divide-slate-100">
            {/* 1. Executive Summary */}
            <MemoSection
              icon={<Sparkles className="w-5 h-5" />}
              title="Executive Summary"
              number="01"
            >
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {memo.executive_summary}
              </p>
            </MemoSection>

            {/* 2. Business Overview */}
            <MemoSection
              icon={<Building2 className="w-5 h-5" />}
              title="Business Overview"
              number="02"
            >
              <p className="text-slate-700 leading-relaxed mb-6">
                {memo.business_overview?.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Key Products */}
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-3">
                    Prodotti / Servizi
                  </p>
                  <ul className="space-y-1.5">
                    {memo.business_overview?.key_products?.map(
                      (p: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-slate-600 flex items-start gap-2"
                        >
                          <span className="text-gold mt-1">&#8226;</span> {p}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Main Markets */}
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-3">
                    Mercati Principali
                  </p>
                  <ul className="space-y-1.5">
                    {memo.business_overview?.main_markets?.map(
                      (m: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-slate-600 flex items-start gap-2"
                        >
                          <span className="text-gold mt-1">&#8226;</span> {m}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Business Model */}
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-3">
                    Modello di Business
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {memo.business_overview?.business_model}
                  </p>
                </div>
              </div>
            </MemoSection>

            {/* 3. Market Position */}
            <MemoSection
              icon={<Target className="w-5 h-5" />}
              title="Posizionamento di Mercato"
              number="03"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {memo.market_position?.market_size_eur && (
                  <MetricCard
                    label="Dimensione Mercato"
                    value={memo.market_position.market_size_eur}
                  />
                )}
                {memo.market_position?.growth_rate && (
                  <MetricCard
                    label="Tasso di Crescita"
                    value={memo.market_position.growth_rate}
                  />
                )}
              </div>

              <p className="text-slate-700 leading-relaxed mb-6">
                {memo.market_position?.competitive_position}
              </p>

              {memo.market_position?.key_competitors?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Principali Competitor
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {memo.market_position.key_competitors.map(
                      (c: string, i: number) => (
                        <span
                          key={i}
                          className="inline-block bg-navy/5 text-navy px-3 py-1.5 rounded-lg text-sm font-medium"
                        >
                          {c}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </MemoSection>

            {/* 4. Financial Highlights */}
            <MemoSection
              icon={<BarChart3 className="w-5 h-5" />}
              title="Highlights Finanziari"
              number="04"
            >
              {/* Revenue table */}
              {memo.financial_highlights?.revenue_last_3y?.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Fatturato
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 pr-4 text-slate-500 font-medium">
                            Anno
                          </th>
                          <th className="text-right py-2 pl-4 text-slate-500 font-medium">
                            Fatturato (EUR)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {memo.financial_highlights.revenue_last_3y.map(
                          (
                            r: { year: number; amount_eur: number },
                            i: number
                          ) => (
                            <tr
                              key={i}
                              className="border-b border-slate-50"
                            >
                              <td className="py-2.5 pr-4 font-semibold text-slate-800">
                                {r.year}
                              </td>
                              <td className="py-2.5 pl-4 text-right text-slate-700 tabular-nums">
                                {formatEur(r.amount_eur)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EBITDA table */}
              {memo.financial_highlights?.ebitda_last_3y?.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    EBITDA
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 pr-4 text-slate-500 font-medium">
                            Anno
                          </th>
                          <th className="text-right py-2 px-4 text-slate-500 font-medium">
                            EBITDA (EUR)
                          </th>
                          <th className="text-right py-2 pl-4 text-slate-500 font-medium">
                            Margine %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {memo.financial_highlights.ebitda_last_3y.map(
                          (
                            e: {
                              year: number
                              amount_eur: number
                              margin_pct: number
                            },
                            i: number
                          ) => (
                            <tr
                              key={i}
                              className="border-b border-slate-50"
                            >
                              <td className="py-2.5 pr-4 font-semibold text-slate-800">
                                {e.year}
                              </td>
                              <td className="py-2.5 px-4 text-right text-slate-700 tabular-nums">
                                {formatEur(e.amount_eur)}
                              </td>
                              <td className="py-2.5 pl-4 text-right text-slate-700 tabular-nums">
                                {e.margin_pct.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Key KPIs */}
              {memo.financial_highlights?.key_kpi?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    KPI Chiave
                  </p>
                  <ul className="space-y-2">
                    {memo.financial_highlights.key_kpi.map(
                      (kpi: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <TrendingUp className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                          {kpi}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </MemoSection>

            {/* 5. Transaction Rationale */}
            <MemoSection
              icon={<Handshake className="w-5 h-5" />}
              title="Razionale dell'Operazione"
              number="05"
            >
              <ul className="space-y-3">
                {memo.transaction_rationale?.map((r: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/10 text-gold flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{r}</span>
                  </li>
                ))}
              </ul>
            </MemoSection>

            {/* 6. Valuation Range */}
            <MemoSection
              icon={<BarChart3 className="w-5 h-5" />}
              title="Range di Valutazione"
              number="06"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-navy p-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70 mb-2">
                    Minimo
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatEur(memo.valuation_range?.range_eur_low ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl bg-navy p-5 text-center border-2 border-gold">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">
                    Metodologia
                  </p>
                  <p className="text-sm font-medium text-white leading-relaxed">
                    {memo.valuation_range?.methodology}
                  </p>
                </div>
                <div className="rounded-xl bg-navy p-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold/70 mb-2">
                    Massimo
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatEur(memo.valuation_range?.range_eur_high ?? 0)}
                  </p>
                </div>
              </div>

              {memo.valuation_range?.notes && (
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">
                  {memo.valuation_range.notes}
                </p>
              )}
            </MemoSection>

            {/* 7. Next Steps */}
            <MemoSection
              icon={<ListChecks className="w-5 h-5" />}
              title="Prossimi Passi"
              number="07"
            >
              <ol className="space-y-3">
                {memo.next_steps?.map((step: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </MemoSection>
          </div>

          {/* Footer */}
          <div className="bg-navy px-8 py-5 flex items-center justify-between">
            <p className="font-[family-name:var(--font-cormorant)] text-gold text-lg font-bold">
              Minerva Partners
            </p>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Documento riservato
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {deal.codice_anonimo || deal.id.slice(0, 8)} &middot; v
                {selectedVersion}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── Sub-components ─────────── */

function MemoSection({
  icon,
  title,
  number,
  children,
}: {
  icon: React.ReactNode
  title: string
  number: string
  children: React.ReactNode
}) {
  return (
    <section className="px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-gold">{icon}</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
            Sezione {number}
          </p>
          <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-navy">
            {title}
          </h3>
        </div>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-navy">{value}</p>
    </div>
  )
}
