'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Clock,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PitchDeck } from '@/lib/claude/schemas/pitch-deck'

interface IntelligenceOutput {
  id: string
  deal_id: string
  output_type: string
  version: number
  content: PitchDeck
  generated_by: string
  generated_at: string
  created_by: string
  is_published: boolean
  published_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

const SLIDE_TITLES = [
  'Cover',
  'Investment Thesis',
  'Company Overview',
  'Market Opportunity',
  'Business Model',
  'Traction',
  'Financials',
  'Management Team',
  'Competitive Landscape',
  'Transaction Structure',
  'Valuation',
  'Risk Factors',
  'Next Steps',
  'Contacts',
] as const

export default function PitchDeckClient({
  deal,
  outputs,
  isAdmin,
  userId,
  userName,
}: {
  deal: any
  outputs: IntelligenceOutput[]
  isAdmin: boolean
  userId: string
  userName: string
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedVersion, setSelectedVersion] = useState<number>(
    outputs.length > 0 ? outputs[0].version : 0
  )
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [localOutputs, setLocalOutputs] = useState(outputs)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const currentOutput = localOutputs.find((o) => o.version === selectedVersion)
  const deck: PitchDeck | null = currentOutput
    ? (currentOutput.content as PitchDeck)
    : null

  const totalSlides = SLIDE_TITLES.length

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < totalSlides) setCurrentSlide(idx)
    },
    [totalSlides]
  )

  const prev = useCallback(
    () => goTo(currentSlide - 1),
    [currentSlide, goTo]
  )
  const next = useCallback(
    () => goTo(currentSlide + 1),
    [currentSlide, goTo]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [prev, next, isFullscreen])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/deals/${deal.id}/generate-pitch`, {
        method: 'POST',
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setLocalOutputs((prev) => [json.data, ...prev])
        setSelectedVersion(json.data.version)
        setCurrentSlide(0)
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
    if (!currentOutput) return
    setApproving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('intelligence_outputs')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq('id', currentOutput.id)

      if (!error) {
        setLocalOutputs((prev) =>
          prev.map((o) =>
            o.id === currentOutput.id
              ? {
                  ...o,
                  is_published: true,
                  published_at: new Date().toISOString(),
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: userId,
                }
              : o
          )
        )
      }
    } catch {
      alert('Errore approvazione')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className={cn('min-h-screen', isFullscreen ? 'fixed inset-0 z-50 bg-navy' : 'p-4 md:p-8')}>
      {/* Header */}
      {!isFullscreen && (
        <div className="max-w-7xl mx-auto mb-6">
          <Link
            href={`/portal/deals/${deal.id}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Torna al Deal
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                {deal.code}
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Pitch Deck{' '}
                <span className="text-gold">AI</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Version selector */}
              {localOutputs.length > 1 && (
                <select
                  value={selectedVersion}
                  onChange={(e) => {
                    setSelectedVersion(Number(e.target.value))
                    setCurrentSlide(0)
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold/40"
                >
                  {localOutputs.map((o) => (
                    <option key={o.version} value={o.version}>
                      v{o.version}{' '}
                      {o.is_published ? '(Pubblicato)' : '(Bozza)'}
                    </option>
                  ))}
                </select>
              )}

              {/* Generate / Regenerate */}
              {isAdmin && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                    'bg-gradient-to-r from-gold to-[#b8962d] text-white',
                    'hover:shadow-md hover:shadow-gold/20 transition-all',
                    'disabled:opacity-50'
                  )}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : localOutputs.length > 0 ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {generating
                    ? 'Generazione...'
                    : localOutputs.length > 0
                      ? 'Rigenera'
                      : 'Genera Pitch Deck'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAFT banner */}
      {currentOutput && !currentOutput.is_published && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-2 rounded-lg mb-4',
            'bg-amber-50 border border-amber-200',
            isFullscreen ? 'mx-4' : 'max-w-7xl mx-auto'
          )}
        >
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <Clock className="w-4 h-4" />
            BOZZA v{currentOutput.version} — Non pubblicato
          </div>
          {isAdmin && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {approving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Approva e Pubblica
            </button>
          )}
        </div>
      )}

      {/* No deck yet */}
      {!deck && !generating && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Nessun Pitch Deck generato
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {isAdmin
                ? 'Clicca "Genera Pitch Deck" per creare una presentazione professionale con AI.'
                : 'Il pitch deck non e\' ancora stato pubblicato per questo deal.'}
            </p>
          </div>
        </div>
      )}

      {/* Generating state */}
      {generating && !deck && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Generazione in corso...
            </h2>
            <p className="text-slate-500 text-sm">
              L&apos;AI sta analizzando i documenti e preparando il pitch deck.
            </p>
          </div>
        </div>
      )}

      {/* Slide viewer */}
      {deck && (
        <div className={cn(isFullscreen ? 'h-full flex flex-col' : 'max-w-7xl mx-auto')}>
          {/* Fullscreen toggle */}
          <div className={cn('flex justify-end mb-2', isFullscreen && 'px-4')}>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              title={isFullscreen ? 'Esci fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 16:9 slide viewport */}
          <div
            className={cn(
              'relative w-full overflow-hidden rounded-2xl shadow-2xl',
              isFullscreen ? 'flex-1 mx-4 mb-4 rounded-xl' : ''
            )}
            style={{ aspectRatio: isFullscreen ? undefined : '16/9' }}
          >
            <div className="absolute inset-0 bg-navy">
              {currentSlide === 0 && <SlideCover deck={deck} deal={deal} />}
              {currentSlide === 1 && <SlideInvestmentThesis deck={deck} />}
              {currentSlide === 2 && <SlideCompanyOverview deck={deck} />}
              {currentSlide === 3 && <SlideMarketOpportunity deck={deck} />}
              {currentSlide === 4 && <SlideBusinessModel deck={deck} />}
              {currentSlide === 5 && <SlideTraction deck={deck} />}
              {currentSlide === 6 && <SlideFinancials deck={deck} />}
              {currentSlide === 7 && <SlideManagementTeam deck={deck} />}
              {currentSlide === 8 && <SlideCompetitiveLandscape deck={deck} />}
              {currentSlide === 9 && <SlideTransactionStructure deck={deck} />}
              {currentSlide === 10 && <SlideValuation deck={deck} />}
              {currentSlide === 11 && <SlideRiskFactors deck={deck} />}
              {currentSlide === 12 && <SlideNextSteps deck={deck} />}
              {currentSlide === 13 && <SlideContacts deck={deck} />}
            </div>

            {/* Left arrow */}
            {currentSlide > 0 && (
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right arrow */}
            {currentSlide < totalSlides - 1 && (
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Slide counter */}
            <div className="absolute bottom-4 right-6 text-white/40 text-xs font-medium">
              {currentSlide + 1} / {totalSlides}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
            {SLIDE_TITLES.map((title, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                title={title}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  idx === currentSlide
                    ? 'bg-gold w-6'
                    : 'bg-slate-300 hover:bg-slate-400'
                )}
              />
            ))}
          </div>

          {/* Slide title label */}
          <p className="text-center text-xs text-slate-500 mt-1 mb-6">
            {SLIDE_TITLES[currentSlide]}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   SHARED SLIDE COMPONENTS
   ───────────────────────────────────────────── */

function SlideHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="absolute top-6 left-8 right-8 flex items-center justify-between">
      <p className="font-[family-name:var(--font-cormorant)] text-gold/60 text-sm tracking-[0.3em] uppercase">
        Minerva Partners
      </p>
      {subtitle && (
        <p className="text-white/30 text-[10px] tracking-widest uppercase">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function SlideFooter() {
  return (
    <div className="absolute bottom-5 left-8 right-8 flex items-center justify-between border-t border-gold/20 pt-3">
      <p className="font-[family-name:var(--font-cormorant)] text-gold/40 text-xs">
        Confidenziale
      </p>
      <p className="text-white/20 text-[10px]">Minerva Partners S.r.l.</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 1: COVER
   ───────────────────────────────────────────── */
function SlideCover({ deck, deal }: { deck: PitchDeck; deal: any }) {
  return (
    <div className="absolute inset-0 bg-navy flex flex-col items-center justify-center text-center px-16">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <p className="font-[family-name:var(--font-cormorant)] text-gold/60 text-sm tracking-[0.4em] uppercase mb-8">
        Minerva Partners
      </p>

      <div className="w-16 h-px bg-gold/40 mb-8" />

      <h1 className="font-[family-name:var(--font-cormorant)] text-gold text-5xl md:text-6xl font-bold leading-tight mb-4">
        {deck.cover.company_name}
      </h1>

      <p className="text-white/60 text-lg max-w-xl leading-relaxed mb-10">
        {deck.cover.tagline}
      </p>

      <div className="w-16 h-px bg-gold/40 mb-8" />

      <div className="flex items-center gap-6 text-white/30 text-xs tracking-widest uppercase">
        <span>{deal.asset_class?.replace(/_/g, ' ') || 'M&A'}</span>
        <span className="w-1 h-1 rounded-full bg-gold/40" />
        <span>Confidenziale</span>
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 2: INVESTMENT THESIS
   ───────────────────────────────────────────── */
function SlideInvestmentThesis({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Investment Thesis" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-3">
          Investment Thesis
        </h2>
        <p className="text-white/70 text-lg mb-10 max-w-2xl leading-relaxed">
          {deck.investment_thesis.headline}
        </p>

        <div className="space-y-4">
          {deck.investment_thesis.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                <span className="text-gold text-sm font-bold">{i + 1}</span>
              </div>
              <p className="text-white/80 text-base leading-relaxed pt-1">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 3: COMPANY OVERVIEW
   ───────────────────────────────────────────── */
function SlideCompanyOverview({ deck }: { deck: PitchDeck }) {
  const infoItems = [
    { label: 'Fondazione', value: deck.company_overview.founded },
    { label: 'Sede', value: deck.company_overview.hq },
    {
      label: 'Dipendenti',
      value: deck.company_overview.employees?.toLocaleString('it-IT'),
    },
  ].filter((item) => item.value)

  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Company Overview" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Company Overview
        </h2>

        {/* Info cards row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {infoItems.map((item, i) => (
            <div
              key={i}
              className="bg-white/5 border border-gold/15 rounded-xl p-5"
            >
              <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-1">
                {item.label}
              </p>
              <p className="text-white text-lg font-semibold">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5">
          <p className="text-white/70 text-base leading-relaxed">
            {deck.company_overview.description}
          </p>
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 4: MARKET OPPORTUNITY
   ───────────────────────────────────────────── */
function SlideMarketOpportunity({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Market Opportunity" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-3">
          Market Opportunity
        </h2>
        <p className="text-white/70 text-lg mb-8 max-w-2xl">
          {deck.market_opportunity.headline}
        </p>

        {/* TAM */}
        {deck.market_opportunity.tam_eur && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 mb-8 inline-block">
            <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-1">
              Total Addressable Market
            </p>
            <p className="font-[family-name:var(--font-cormorant)] text-gold text-3xl font-bold">
              {deck.market_opportunity.tam_eur}
            </p>
          </div>
        )}

        {/* Growth drivers */}
        <div className="grid grid-cols-2 gap-4">
          {deck.market_opportunity.growth_drivers.map((driver, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white/[0.03] rounded-lg p-4 border border-white/5"
            >
              <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
              <p className="text-white/70 text-sm leading-relaxed">{driver}</p>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 5: BUSINESS MODEL
   ───────────────────────────────────────────── */
function SlideBusinessModel({ deck }: { deck: PitchDeck }) {
  const maxPct = Math.max(
    ...deck.business_model.revenue_streams.map((s) => s.pct ?? 0),
    1
  )

  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Business Model" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-3">
          Business Model
        </h2>
        <p className="text-white/70 text-base mb-10 max-w-2xl leading-relaxed">
          {deck.business_model.description}
        </p>

        {/* Revenue streams */}
        <div className="space-y-4">
          {deck.business_model.revenue_streams.map((stream, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white/80 text-sm font-medium">
                  {stream.name}
                </p>
                {stream.pct != null && (
                  <span className="text-gold text-sm font-bold">
                    {stream.pct}%
                  </span>
                )}
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold to-gold/60 rounded-full transition-all"
                  style={{
                    width: `${stream.pct != null ? (stream.pct / maxPct) * 100 : 50}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 6: TRACTION
   ───────────────────────────────────────────── */
function SlideTraction({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Traction & KPIs" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Traction &amp; Key Metrics
        </h2>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {deck.traction.key_metrics.map((kpi, i) => (
            <div
              key={i}
              className="bg-white/5 border border-gold/15 rounded-xl p-5 text-center"
            >
              <p className="font-[family-name:var(--font-cormorant)] text-gold text-2xl font-bold mb-1">
                {kpi.value}
              </p>
              <p className="text-white/50 text-xs tracking-widest uppercase">
                {kpi.label}
              </p>
            </div>
          ))}
        </div>

        {/* Growth narrative */}
        <div className="bg-white/[0.03] rounded-xl p-6 border border-white/5">
          <p className="text-white/70 text-base leading-relaxed">
            {deck.traction.growth_narrative}
          </p>
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 7: FINANCIALS (with bar charts)
   ───────────────────────────────────────────── */
function SlideFinancials({ deck }: { deck: PitchDeck }) {
  const revenueMax = Math.max(
    ...deck.financials.revenue_3y.map((r) => r.value_eur),
    1
  )
  const ebitdaMax = Math.max(
    ...deck.financials.ebitda_3y.map((e) => e.value_eur),
    1
  )

  const formatEur = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return v.toLocaleString('it-IT')
  }

  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Financials" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Financial Overview
        </h2>

        <div className="grid grid-cols-2 gap-10">
          {/* Revenue chart */}
          <div>
            <p className="text-gold/70 text-xs tracking-[0.2em] uppercase mb-4">
              Ricavi (EUR)
            </p>
            <div className="flex items-end gap-3 h-48">
              {deck.financials.revenue_3y.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <p className="text-white/60 text-xs mb-2 font-medium">
                    {formatEur(item.value_eur)}
                  </p>
                  <div
                    className="w-full bg-gradient-to-t from-gold to-gold/60 rounded-t-lg transition-all"
                    style={{
                      height: `${(item.value_eur / revenueMax) * 100}%`,
                      minHeight: '8px',
                    }}
                  />
                  <p className="text-white/40 text-xs mt-2">{item.year}</p>
                </div>
              ))}
            </div>
          </div>

          {/* EBITDA chart */}
          <div>
            <p className="text-gold/70 text-xs tracking-[0.2em] uppercase mb-4">
              EBITDA (EUR)
            </p>
            <div className="flex items-end gap-3 h-48">
              {deck.financials.ebitda_3y.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <p className="text-white/60 text-xs mb-2 font-medium">
                    {formatEur(item.value_eur)}
                  </p>
                  <div
                    className="w-full bg-gradient-to-t from-gold/80 to-gold/40 rounded-t-lg transition-all"
                    style={{
                      height: `${(item.value_eur / ebitdaMax) * 100}%`,
                      minHeight: '8px',
                    }}
                  />
                  <p className="text-white/40 text-xs mt-2">{item.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast note */}
        {deck.financials.forecast_note && (
          <p className="text-white/40 text-xs mt-6 italic">
            {deck.financials.forecast_note}
          </p>
        )}
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 8: MANAGEMENT TEAM
   ───────────────────────────────────────────── */
function SlideManagementTeam({ deck }: { deck: PitchDeck }) {
  const cols =
    deck.management_team.members.length <= 3
      ? 'grid-cols-' + deck.management_team.members.length
      : deck.management_team.members.length <= 4
        ? 'grid-cols-2'
        : 'grid-cols-3'

  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Management Team" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Management Team
        </h2>

        <div className={cn('grid gap-4', cols)}>
          {deck.management_team.members.map((member, i) => (
            <div
              key={i}
              className="bg-white/5 border border-gold/15 rounded-xl p-5"
            >
              {/* Avatar placeholder */}
              <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-3">
                <span className="text-gold font-bold text-lg">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              </div>
              <p className="text-white text-sm font-semibold mb-0.5">
                {member.name}
              </p>
              <p className="text-gold/70 text-xs tracking-wider uppercase mb-2">
                {member.role}
              </p>
              <p className="text-white/50 text-xs leading-relaxed">
                {member.background}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 9: COMPETITIVE LANDSCAPE
   ───────────────────────────────────────────── */
function SlideCompetitiveLandscape({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Competitive Landscape" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-3">
          Competitive Landscape
        </h2>
        <p className="text-white/70 text-base mb-8 max-w-2xl">
          {deck.competitive_landscape.headline}
        </p>

        {/* Competitor table */}
        <div className="bg-white/[0.03] rounded-xl border border-white/5 overflow-hidden mb-6">
          <div className="grid grid-cols-2 gap-px bg-white/5">
            <div className="p-3 bg-navy">
              <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase font-medium">
                Competitor
              </p>
            </div>
            <div className="p-3 bg-navy">
              <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase font-medium">
                Posizionamento
              </p>
            </div>
          </div>
          {deck.competitive_landscape.competitors.map((comp, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-px bg-white/5"
            >
              <div className="p-3 bg-navy">
                <p className="text-white/80 text-sm font-medium">
                  {comp.name}
                </p>
              </div>
              <div className="p-3 bg-navy">
                <p className="text-white/60 text-sm">{comp.positioning}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Moat */}
        <div className="bg-gold/5 border border-gold/20 rounded-xl p-5">
          <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-2">
            Vantaggio Competitivo
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            {deck.competitive_landscape.moat}
          </p>
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 10: TRANSACTION STRUCTURE
   ───────────────────────────────────────────── */
function SlideTransactionStructure({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Transaction Structure" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Transaction Structure
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Type */}
          <div className="bg-white/5 border border-gold/15 rounded-xl p-6">
            <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-2">
              Tipologia
            </p>
            <p className="text-white text-xl font-semibold">
              {deck.transaction_structure.type}
            </p>
          </div>

          {/* Stake */}
          {deck.transaction_structure.target_stake_pct && (
            <div className="bg-white/5 border border-gold/15 rounded-xl p-6">
              <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-2">
                Quota Target
              </p>
              <p className="font-[family-name:var(--font-cormorant)] text-gold text-3xl font-bold">
                {deck.transaction_structure.target_stake_pct}
              </p>
            </div>
          )}
        </div>

        {/* Use of proceeds */}
        <div>
          <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-4">
            Utilizzo dei Proventi
          </p>
          <div className="space-y-3">
            {deck.transaction_structure.use_of_proceeds.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-white/[0.03] rounded-lg p-4 border border-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-sm font-bold">{i + 1}</span>
                </div>
                <p className="text-white/70 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 11: VALUATION
   ───────────────────────────────────────────── */
function SlideValuation({ deck }: { deck: PitchDeck }) {
  const formatEurLarge = (v: number) => {
    if (v >= 1_000_000_000)
      return `${(v / 1_000_000_000).toFixed(1)} Mld`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} Mln`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
    return v.toLocaleString('it-IT')
  }

  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Valuation" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Valuation
        </h2>

        {/* Range display */}
        <div className="bg-gold/5 border border-gold/30 rounded-2xl p-8 mb-8">
          <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase mb-3">
            Enterprise Value Range
          </p>
          <div className="flex items-center gap-4">
            <span className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold">
              EUR {formatEurLarge(deck.valuation.range_eur_low)}
            </span>
            <div className="flex-1 h-px bg-gold/30" />
            <span className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold">
              EUR {formatEurLarge(deck.valuation.range_eur_high)}
            </span>
          </div>
        </div>

        {/* Methodology */}
        <p className="text-white/60 text-sm mb-6 leading-relaxed">
          {deck.valuation.methodology}
        </p>

        {/* Multiples */}
        <div className="grid grid-cols-3 gap-4">
          {deck.valuation.multiples.map((m, i) => (
            <div
              key={i}
              className="bg-white/5 border border-gold/15 rounded-xl p-4 text-center"
            >
              <p className="font-[family-name:var(--font-cormorant)] text-gold text-2xl font-bold mb-1">
                {m.value}
              </p>
              <p className="text-white/50 text-xs tracking-wider uppercase">
                {m.metric}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 12: RISK FACTORS
   ───────────────────────────────────────────── */
function SlideRiskFactors({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Risk Factors" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Risk Factors
        </h2>

        <div className="space-y-4">
          {deck.risk_factors.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-4 bg-white/[0.03] rounded-xl p-5 border border-white/5"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <span className="text-red-400 text-sm font-bold">{i + 1}</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed pt-1">
                {risk}
              </p>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 13: NEXT STEPS
   ───────────────────────────────────────────── */
function SlideNextSteps({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy p-12 pt-16 flex flex-col">
      <SlideHeader subtitle="Next Steps" />

      <div className="flex-1 flex flex-col justify-center px-4">
        <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-8">
          Next Steps
        </h2>

        <div className="space-y-6">
          {deck.next_steps.map((step, i) => (
            <div key={i} className="flex items-start gap-6">
              {/* Timeline node */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center">
                  <span className="text-gold font-bold">{i + 1}</span>
                </div>
                {i < deck.next_steps.length - 1 && (
                  <div className="w-px h-8 bg-gold/20 mt-2" />
                )}
              </div>

              <div className="pt-2">
                <p className="text-white/80 text-base leading-relaxed">
                  {step}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </div>
  )
}

/* ─────────────────────────────────────────────
   SLIDE 14: CONTACTS
   ───────────────────────────────────────────── */
function SlideContacts({ deck }: { deck: PitchDeck }) {
  return (
    <div className="absolute inset-0 bg-navy flex flex-col items-center justify-center text-center px-16">
      {/* Decorative top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <p className="font-[family-name:var(--font-cormorant)] text-gold/60 text-sm tracking-[0.4em] uppercase mb-6">
        Minerva Partners
      </p>

      <div className="w-16 h-px bg-gold/40 mb-8" />

      <h2 className="font-[family-name:var(--font-cormorant)] text-gold text-4xl font-bold mb-10">
        Contatti
      </h2>

      <div className="bg-white/5 border border-gold/15 rounded-2xl p-8 min-w-[400px]">
        <p className="text-white text-lg font-semibold mb-1">
          {deck.contacts.lead_advisor}
        </p>
        <p className="text-gold/70 text-xs tracking-[0.2em] uppercase mb-4">
          Lead Advisor
        </p>

        <div className="w-12 h-px bg-gold/30 mx-auto mb-4" />

        <p className="text-white/70 text-sm mb-2">{deck.contacts.email}</p>
        {deck.contacts.phone && (
          <p className="text-white/50 text-sm">{deck.contacts.phone}</p>
        )}
      </div>

      <div className="mt-12 text-white/30 text-xs tracking-widest uppercase">
        Documento Strettamente Confidenziale
      </div>

      {/* Decorative bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  )
}
