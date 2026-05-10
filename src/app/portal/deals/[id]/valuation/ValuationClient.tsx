'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTimeIT } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  inputClass,
  labelClass,
  textareaClass,
  selectClass,
  buttonGold,
  buttonPrimary,
  buttonSecondary,
} from '@/components/ui/form'
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calculator,
  DollarSign,
  Activity,
  Building2,
  Shield,
  Zap,
  Loader2,
} from 'lucide-react'
import type { TVA } from '@/lib/claude/schemas/tva'

interface TVAOutput {
  id: string
  deal_id: string
  output_type: string
  version: number
  content: TVA
  is_published: boolean
  published_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  created_by: string
  created_at: string
}

interface ValuationProps {
  deal: {
    id: string
    codice_anonimo?: string | null
    code?: string | null
    nome_azienda?: string | null
    title?: string | null
    settore?: string | null
    sector?: string | null
    tipo_operazione?: string | null
    deal_type?: string | null
    area_geografica?: string | null
    geography?: string | null
    range_fatturato?: string | null
    range_ebitda?: string | null
    ev_range?: string | null
    [key: string]: any
  }
  outputs: TVAOutput[]
  isAdmin: boolean
  currentUserId: string
}

export default function ValuationClient({
  deal,
  outputs,
  isAdmin,
  currentUserId,
}: ValuationProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<number>(
    outputs.length > 0 ? outputs[0].version : 0
  )
  const [localOutputs, setLocalOutputs] = useState<TVAOutput[]>(outputs)

  // Form state
  const [settore, setSettore] = useState(
    deal.settore || deal.sector || ''
  )
  const [country, setCountry] = useState(
    deal.area_geografica || deal.geography || 'Italia'
  )
  const [revenueEur, setRevenueEur] = useState('')
  const [ebitdaEur, setEbitdaEur] = useState('')
  const [growthPct, setGrowthPct] = useState('')
  const [notes, setNotes] = useState('')
  const [approving, setApproving] = useState(false)

  const selectedOutput =
    localOutputs.find((o) => o.version === selectedVersion) ?? null
  const tva = selectedOutput?.content as TVA | null

  const handleGenerate = async () => {
    if (!settore || !revenueEur || !ebitdaEur || !country) {
      alert('Compila tutti i campi obbligatori: settore, country, revenue, EBITDA')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}/generate-tva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settore,
          revenue_eur: parseFloat(revenueEur),
          ebitda_eur: parseFloat(ebitdaEur),
          growth_pct: parseFloat(growthPct) || 0,
          country,
          notes: notes || undefined,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setLocalOutputs((prev) => [json.data, ...prev])
        setSelectedVersion(json.data.version)
      } else {
        alert(json.error || 'Errore nella generazione')
      }
    } catch {
      alert('Errore di rete')
    } finally {
      setGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedOutput) return
    setApproving(true)
    try {
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

      if (!error) {
        setLocalOutputs((prev) =>
          prev.map((o) =>
            o.id === selectedOutput.id
              ? {
                  ...o,
                  is_published: true,
                  published_at: now,
                  reviewed_at: now,
                  reviewed_by: currentUserId,
                }
              : o
          )
        )
      } else {
        alert('Errore approvazione: ' + error.message)
      }
    } catch {
      alert('Errore approvazione')
    } finally {
      setApproving(false)
    }
  }

  const formatEurLarge = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} Mld`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Mln`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return v.toLocaleString('it-IT')
  }

  const dealCode =
    deal.codice_anonimo || deal.code || deal.id.slice(0, 8)
  const dealName = deal.nome_azienda || deal.title || deal.settore || ''

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
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
              {dealCode}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              TVA Express{' '}
              <span className="text-gold">{dealName}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              True Value Assessment &middot;{' '}
              {deal.tipo_operazione || deal.deal_type || 'Valutazione'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Version selector */}
            {localOutputs.length > 1 && (
              <select
                className={cn(selectClass, 'w-52')}
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(Number(e.target.value))}
              >
                {localOutputs.map((o) => (
                  <option key={o.version} value={o.version}>
                    v{o.version} — {formatDateTimeIT(o.created_at)}
                    {o.is_published ? ' (Pubblicata)' : ' (Bozza)'}
                  </option>
                ))}
              </select>
            )}

            {/* PDF export for published versions */}
            {selectedOutput?.is_published && (
              <a
                href={`/api/deals/${deal.id}/tva-pdf?version=${selectedVersion}`}
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

      {/* DRAFT banner */}
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
            <button
              className={buttonPrimary}
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Approva e pubblica
            </button>
          )}
        </div>
      )}

      {/* Published banner */}
      {selectedOutput?.is_published && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Pubblicata — versione {selectedOutput.version}
            </p>
            <p className="text-xs text-emerald-600">
              Approvata il {formatDateTimeIT(selectedOutput.reviewed_at)}
            </p>
          </div>
        </div>
      )}

      {/* Input Form (admin only) */}
      {isAdmin && (
        <div className="mb-8 rounded-2xl border border-slate-100 shadow-sm bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <Calculator className="w-5 h-5 text-gold" />
            <h2 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-navy">
              Parametri di Valutazione
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>Settore *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="es. Manifatturiero, Tech, Food..."
                value={settore}
                onChange={(e) => setSettore(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Paese *</label>
              <input
                type="text"
                className={inputClass}
                placeholder="es. Italia"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Crescita annua %</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="es. 8.5"
                value={growthPct}
                onChange={(e) => setGrowthPct(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Revenue EUR *</label>
              <input
                type="number"
                step="1"
                className={inputClass}
                placeholder="es. 15000000"
                value={revenueEur}
                onChange={(e) => setRevenueEur(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>EBITDA EUR *</label>
              <input
                type="number"
                step="1"
                className={inputClass}
                placeholder="es. 2500000"
                value={ebitdaEur}
                onChange={(e) => setEbitdaEur(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass}>Note aggiuntive</label>
            <textarea
              className={textareaClass}
              placeholder="Informazioni aggiuntive sull'azienda, asset particolari, contesto di mercato..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <button
            className={buttonGold}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generazione TVA in corso...
              </>
            ) : localOutputs.length > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Rigenera TVA
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Genera TVA
              </>
            )}
          </button>
        </div>
      )}

      {/* Generating state */}
      {generating && !tva && (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Generazione TVA in corso...
          </h2>
          <p className="text-sm text-slate-400">
            L&apos;AI sta calcolando la valutazione con 5 metodologie diverse.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!tva && !generating && (
        <div className="text-center py-20">
          <BarChart3 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            Nessuna TVA generata
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {isAdmin
              ? 'Compila i parametri e genera la prima True Value Assessment per questo deal.'
              : 'La TVA per questo deal non e ancora stata pubblicata.'}
          </p>
        </div>
      )}

      {/* TVA Content */}
      {tva && (
        <div className="space-y-8">
          {/* ── Consolidated Valuation Range ── */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-lg">
            <div className="bg-navy px-8 py-6">
              <p className="font-[family-name:var(--font-cormorant)] text-gold text-sm tracking-[4px] uppercase">
                Minerva Partners
              </p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-white text-3xl mt-2">
                True Value Assessment
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {tva.metadata.company_name} &middot; {tva.metadata.sector} &middot;{' '}
                {tva.metadata.valuation_date}
              </p>
            </div>

            <div className="bg-white p-8">
              {/* Big center card */}
              <div className="rounded-2xl bg-gradient-to-br from-navy to-[#0a2540] p-8 text-center mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-gold/70 mb-3">
                  Enterprise Value Consolidato
                </p>
                <p className="font-[family-name:var(--font-cormorant)] text-gold text-5xl md:text-6xl font-bold mb-2">
                  EUR {formatEurLarge(tva.consolidated_range.mid)}
                </p>
                <p className="text-white/50 text-sm mb-6">
                  Range: EUR {formatEurLarge(tva.consolidated_range.low)} — EUR{' '}
                  {formatEurLarge(tva.consolidated_range.high)}
                </p>

                {/* Visual gradient bar */}
                <div className="max-w-lg mx-auto">
                  <div className="relative h-4 rounded-full bg-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/40 via-gold to-gold/40 rounded-full" />
                    {/* Mid marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50"
                      style={{
                        left: `${
                          tva.consolidated_range.high > tva.consolidated_range.low
                            ? ((tva.consolidated_range.mid - tva.consolidated_range.low) /
                                (tva.consolidated_range.high - tva.consolidated_range.low)) *
                              100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-white/40 text-xs">
                      {formatEurLarge(tva.consolidated_range.low)}
                    </span>
                    <span className="text-gold text-xs font-semibold">
                      {formatEurLarge(tva.consolidated_range.mid)}
                    </span>
                    <span className="text-white/40 text-xs">
                      {formatEurLarge(tva.consolidated_range.high)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5 Methodology Cards ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gold" />
              <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-semibold text-navy">
                Metodologie di Valutazione
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. EBITDA Multiple */}
              <MethodologyCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="EBITDA Multiple"
                detail={`${tva.metodologie.ebitda_multiple.multiple_low}x - ${tva.metodologie.ebitda_multiple.multiple_high}x`}
                detailLabel="Range multipli EV/EBITDA"
                range={tva.metodologie.ebitda_multiple.range}
                notes={tva.metodologie.ebitda_multiple.notes}
                extra={
                  <div className="flex gap-4 mb-3">
                    <MiniStat
                      label="EBITDA"
                      value={formatCurrency(tva.metodologie.ebitda_multiple.ebitda_eur)}
                    />
                    <MiniStat
                      label="Fonte"
                      value={tva.metodologie.ebitda_multiple.benchmark_source}
                    />
                  </div>
                }
                formatEur={formatEurLarge}
              />

              {/* 2. Revenue Multiple */}
              <MethodologyCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Revenue Multiple"
                detail={`${tva.metodologie.revenue_multiple.multiple_low}x - ${tva.metodologie.revenue_multiple.multiple_high}x`}
                detailLabel="Range multipli EV/Revenue"
                range={tva.metodologie.revenue_multiple.range}
                notes={tva.metodologie.revenue_multiple.notes}
                extra={
                  <div className="flex gap-4 mb-3">
                    <MiniStat
                      label="Revenue"
                      value={formatCurrency(tva.metodologie.revenue_multiple.revenue_eur)}
                    />
                    <MiniStat
                      label="Fonte"
                      value={tva.metodologie.revenue_multiple.benchmark_source}
                    />
                  </div>
                }
                formatEur={formatEurLarge}
              />

              {/* 3. DCF */}
              <MethodologyCard
                icon={<DollarSign className="w-5 h-5" />}
                title="DCF — Discounted Cash Flow"
                detail={`WACC ${tva.metodologie.dcf.wacc_pct}% · TGR ${tva.metodologie.dcf.terminal_growth_pct}%`}
                detailLabel={`Forecast ${tva.metodologie.dcf.forecast_years} anni`}
                range={tva.metodologie.dcf.range}
                notes={tva.metodologie.dcf.notes}
                extra={
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                      Assunzioni chiave
                    </p>
                    <ul className="space-y-1">
                      {tva.metodologie.dcf.key_assumptions.map((a, i) => (
                        <li
                          key={i}
                          className="text-xs text-slate-600 flex items-start gap-1.5"
                        >
                          <span className="text-gold mt-0.5">&#8226;</span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                }
                formatEur={formatEurLarge}
              />

              {/* 4. Comparables */}
              <MethodologyCard
                icon={<Building2 className="w-5 h-5" />}
                title="Transazioni Comparabili"
                detail={`${tva.metodologie.comparables.transactions.length} transazioni`}
                detailLabel="Mercato italiano/europeo"
                range={tva.metodologie.comparables.range}
                notes={tva.metodologie.comparables.notes}
                extra={
                  <div className="mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                      Transazioni di riferimento
                    </p>
                    <div className="space-y-1.5">
                      {tva.metodologie.comparables.transactions.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <span className="font-medium text-slate-800">
                              {t.target}
                            </span>
                            <span className="text-slate-400 ml-2">
                              ({t.date})
                            </span>
                          </div>
                          <div className="flex gap-3 text-slate-500">
                            {t.ev_ebitda != null && (
                              <span>
                                EV/EBITDA:{' '}
                                <span className="font-semibold text-navy">
                                  {t.ev_ebitda}x
                                </span>
                              </span>
                            )}
                            {t.ev_revenue != null && (
                              <span>
                                EV/Rev:{' '}
                                <span className="font-semibold text-navy">
                                  {t.ev_revenue}x
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
                formatEur={formatEurLarge}
              />

              {/* 5. Asset-based (only if applicable) */}
              {tva.metodologie.asset_based.applicable && (
                <MethodologyCard
                  icon={<Shield className="w-5 h-5" />}
                  title="Asset-Based"
                  detail={
                    tva.metodologie.asset_based.net_asset_value_eur
                      ? `NAV: EUR ${formatEurLarge(tva.metodologie.asset_based.net_asset_value_eur)}`
                      : 'Valutazione patrimoniale'
                  }
                  detailLabel="Valore patrimoniale netto"
                  range={tva.metodologie.asset_based.range}
                  notes={tva.metodologie.asset_based.notes}
                  formatEur={formatEurLarge}
                />
              )}
            </div>
          </div>

          {/* ── Narrative Section ── */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="bg-navy px-8 py-5">
              <h3 className="font-[family-name:var(--font-cormorant)] text-gold text-xl font-semibold">
                Perche vale EUR {formatEurLarge(tva.consolidated_range.mid)}
              </h3>
            </div>

            <div className="bg-white divide-y divide-slate-100">
              {/* Why valuation narrative */}
              <div className="px-8 py-6">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {tva.narrative.why_valuation}
                </p>
              </div>

              {/* Value Drivers */}
              <div className="px-8 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Value Drivers
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {tva.narrative.value_drivers.map((d, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Risks */}
              <div className="px-8 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Key Risks
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {tva.narrative.key_risks.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sensitivities */}
              <div className="px-8 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Sensitivities
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {tva.narrative.sensitivities.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
                  {dealCode} &middot; TVA v{selectedVersion}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────── Sub-components ─────────── */

function MethodologyCard({
  icon,
  title,
  detail,
  detailLabel,
  range,
  notes,
  extra,
  formatEur,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  detailLabel: string
  range?: { low: number; mid: number; high: number }
  notes: string
  extra?: React.ReactNode
  formatEur: (v: number) => string
}) {
  return (
    <div className="rounded-xl border border-slate-100 shadow-sm bg-white p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-gold">{icon}</span>
        <div>
          <h4 className="font-[family-name:var(--font-cormorant)] text-base font-semibold text-navy">
            {title}
          </h4>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
            {detailLabel}
          </p>
        </div>
      </div>

      {/* Detail badge */}
      <div className="inline-block bg-navy/5 text-navy px-3 py-1.5 rounded-lg text-sm font-semibold mb-4">
        {detail}
      </div>

      {/* Extra content */}
      {extra}

      {/* Range values */}
      {range && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              Low
            </p>
            <p className="text-sm font-semibold text-slate-800 tabular-nums">
              {formatEur(range.low)}
            </p>
          </div>
          <div className="rounded-lg bg-gold/5 border border-gold/20 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gold mb-0.5">
              Mid
            </p>
            <p className="text-sm font-bold text-navy tabular-nums">
              {formatEur(range.mid)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              High
            </p>
            <p className="text-sm font-semibold text-slate-800 tabular-nums">
              {formatEur(range.high)}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <p className="text-xs text-slate-500 leading-relaxed italic">{notes}</p>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-xs font-medium text-slate-700">{value}</p>
    </div>
  )
}
