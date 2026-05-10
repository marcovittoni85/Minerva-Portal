'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateTimeIT } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  buttonGold,
  buttonPrimary,
  buttonSecondary,
  selectClass,
} from '@/components/ui/form'
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Upload,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PiggyBank,
  ShieldCheck,
  Calculator,
  FileSpreadsheet,
  MessageSquareText,
  X,
} from 'lucide-react'

/* ─────────── Types ─────────── */

interface ReclassificationOutput {
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

interface FinancialsProps {
  deal: {
    id: string
    codice_anonimo: string | null
    nome_azienda: string | null
    settore: string | null
    tipo_operazione: string | null
    range_fatturato: string | null
    range_ebitda: string | null
  }
  outputs: ReclassificationOutput[]
  isAdmin: boolean
  currentUserId: string
}

/* ─────────── Tipo badge colors ─────────── */

const tipoBadgeColors: Record<string, string> = {
  one_off: 'bg-blue-100 text-blue-800 border-blue-200',
  normalizzazione: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  extra_ordinaria: 'bg-amber-100 text-amber-800 border-amber-200',
  related_party: 'bg-purple-100 text-purple-800 border-purple-200',
}

const tipoLabels: Record<string, string> = {
  one_off: 'One-Off',
  normalizzazione: 'Normalizzazione',
  extra_ordinaria: 'Straordinaria',
  related_party: 'Parti Correlate',
}

/* ─────────── Component ─────────── */

export default function FinancialsClient({
  deal,
  outputs,
  isAdmin,
  currentUserId,
}: FinancialsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [generating, setGenerating] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<number>(
    outputs.length > 0 ? outputs[0].version : 0
  )
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedOutput =
    outputs.find((o) => o.version === selectedVersion) ?? null
  const data = selectedOutput?.content as any | null

  /* ─── File handling ─── */

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Seleziona un file PDF valido')
      return
    }
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const removeFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  /* ─── Reclassification ─── */

  const handleReclassify = async () => {
    if (!selectedFile) {
      setError('Seleziona un file PDF del bilancio')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch(
        `/api/deals/${deal.id}/reclassify-financials`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Errore nella riclassificazione')
        return
      }

      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
      setSelectedVersion(result.version)
    } catch {
      setError('Errore di rete durante la riclassificazione')
    } finally {
      setGenerating(false)
    }
  }

  /* ─── Approve ─── */

  const handleApprove = async () => {
    if (!selectedOutput) return
    const supabase = createClient()
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('intelligence_outputs')
      .update({
        is_published: true,
        published_at: now,
        reviewed_at: now,
        reviewed_by: currentUserId,
      })
      .eq('id', selectedOutput.id)

    if (updateError) {
      alert("Errore durante l'approvazione: " + updateError.message)
      return
    }
    router.refresh()
  }

  /* ─── Helpers ─── */

  const formatKey = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

  const formatPct = (n: number | null | undefined) =>
    n !== null && n !== undefined ? `${n.toFixed(1)}%` : '--'

  const formatMultiple = (n: number | null | undefined) =>
    n !== null && n !== undefined ? `${n.toFixed(1)}x` : '--'

  /* ─────────── Render ─────────── */

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
              {deal.codice_anonimo || deal.id.slice(0, 8)}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Riclassificazione Bilancio{' '}
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
                className={cn(selectClass, 'w-52')}
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
          </div>
        </div>
      </header>

      {/* Upload zone — admin only */}
      {isAdmin && (
        <div className="mb-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
              dragOver
                ? 'border-gold bg-gold/5'
                : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-gold/50 hover:bg-slate-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  className="ml-2 p-1 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  Trascina il bilancio PDF qui oppure{' '}
                  <span className="text-gold font-semibold">sfoglia</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Accetta solo file .pdf
                </p>
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Reclassify button */}
          <div className="mt-4 flex justify-end">
            <button
              className={buttonGold}
              onClick={handleReclassify}
              disabled={generating || !selectedFile}
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Riclassificazione in corso...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Riclassifica con AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

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
                Questa riclassificazione non e ancora visibile agli utenti.
                Rivedi i dati e approva per pubblicare.
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

      {/* Published banner */}
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
            Nessuna Riclassificazione
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {isAdmin
              ? 'Carica un bilancio PDF e utilizza l\'AI per generare la riclassificazione automatica.'
              : 'La riclassificazione del bilancio per questo deal non e ancora stata pubblicata.'}
          </p>
        </div>
      )}

      {/* ─────────── Data content ─────────── */}
      {data && (
        <div className="space-y-8">
          {/* Metadata header */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-lg">
            <div className="bg-navy px-8 py-6">
              <p className="font-[family-name:var(--font-cormorant)] text-gold text-sm tracking-[4px] uppercase">
                Minerva Partners
              </p>
              <h2 className="font-[family-name:var(--font-cormorant)] text-white text-3xl mt-2">
                Riclassificazione Bilancio
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-slate-400">
                  {data.metadata?.company_name || deal.nome_azienda || deal.codice_anonimo || ''}
                </span>
                {data.metadata?.fiscal_year && (
                  <span className="text-gold font-semibold">
                    FY {data.metadata.fiscal_year}
                  </span>
                )}
                {data.metadata?.extraction_confidence && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      data.metadata.extraction_confidence === 'high'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : data.metadata.extraction_confidence === 'medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-red-500/20 text-red-300'
                    )}
                  >
                    Confidenza: {data.metadata.extraction_confidence}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={<TrendingUp className="w-5 h-5" />}
              label="EBITDA Margin"
              value={formatPct(data.kpi?.ebitda_margin_pct)}
              positive={data.kpi?.ebitda_margin_pct > 0}
            />
            <KPICard
              icon={<ShieldCheck className="w-5 h-5" />}
              label="DSCR"
              value={formatMultiple(data.kpi?.dscr)}
              positive={data.kpi?.dscr >= 1.2}
            />
            <KPICard
              icon={<PiggyBank className="w-5 h-5" />}
              label="Debt / EBITDA"
              value={formatMultiple(data.kpi?.debt_to_ebitda)}
              positive={data.kpi?.debt_to_ebitda < 3}
            />
            <KPICard
              icon={<BarChart3 className="w-5 h-5" />}
              label="ROIC"
              value={formatPct(data.kpi?.roic_pct)}
              positive={data.kpi?.roic_pct > 8}
            />
          </div>

          {/* Financial Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conto Economico */}
            <FinancialTable
              title="Conto Economico"
              icon={<Calculator className="w-5 h-5" />}
              data={data.conto_economico}
              highlightKeys={['ebitda', 'ebit', 'utile_netto']}
            />

            {/* Stato Patrimoniale */}
            <FinancialTable
              title="Stato Patrimoniale"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              data={data.stato_patrimoniale}
              highlightKeys={['pfn', 'patrimonio_netto', 'capitale_circolante_netto']}
            />

            {/* Cash Flow */}
            <FinancialTable
              title="Cash Flow"
              icon={<TrendingDown className="w-5 h-5" />}
              data={data.cash_flow}
              highlightKeys={['variazione_cassa']}
            />
          </div>

          {/* Rettifiche EBITDA */}
          {data.rettifiche_ebitda_suggerite &&
            data.rettifiche_ebitda_suggerite.length > 0 && (
              <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-navy/5 px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-gold">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-navy">
                      Rettifiche EBITDA Suggerite
                    </h3>
                  </div>
                </div>

                <div className="bg-white divide-y divide-slate-50">
                  {data.rettifiche_ebitda_suggerite.map(
                    (
                      r: {
                        tipo: string
                        descrizione: string
                        rationale: string
                        impatto_eur: number
                      },
                      i: number
                    ) => (
                      <div
                        key={i}
                        className="px-6 py-4 flex items-start gap-4"
                      >
                        {/* Tipo badge */}
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 mt-0.5',
                            tipoBadgeColors[r.tipo] ||
                              'bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {tipoLabels[r.tipo] || r.tipo}
                        </span>

                        {/* Description + Rationale */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {r.descrizione}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {r.rationale}
                          </p>
                        </div>

                        {/* Amount */}
                        <span
                          className={cn(
                            'text-sm font-bold tabular-nums whitespace-nowrap',
                            r.impatto_eur >= 0
                              ? 'text-emerald-700'
                              : 'text-red-700'
                          )}
                        >
                          {r.impatto_eur >= 0 ? '+' : ''}
                          {formatCurrency(r.impatto_eur)}
                        </span>
                      </div>
                    )
                  )}

                  {/* EBITDA Adjusted total */}
                  <div className="px-6 py-5 bg-navy/5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-navy">
                        EBITDA Adjusted
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        EBITDA reported{' '}
                        {formatCurrency(data.conto_economico?.ebitda)} +
                        rettifiche
                      </p>
                    </div>
                    <span className="text-xl font-bold text-navy tabular-nums">
                      {formatCurrency(data.ebitda_adjusted)}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* Analyst Notes */}
          {data.notes && data.notes.length > 0 && (
            <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-navy/5 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-gold">
                    <MessageSquareText className="w-5 h-5" />
                  </span>
                  <h3 className="font-[family-name:var(--font-cormorant)] text-lg font-semibold text-navy">
                    Note Analista
                  </h3>
                </div>
              </div>
              <div className="bg-white px-6 py-5">
                <ul className="space-y-3">
                  {data.notes.map((note: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gold/10 text-gold flex items-center justify-center text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
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
        </div>
      )}
    </div>
  )
}

/* ─────────── Sub-components ─────────── */

function KPICard({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode
  label: string
  value: string
  positive: boolean
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gold">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          positive ? 'text-navy' : 'text-red-700'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function FinancialTable({
  title,
  icon,
  data,
  highlightKeys,
}: {
  title: string
  icon: React.ReactNode
  data: Record<string, number> | null | undefined
  highlightKeys: string[]
}) {
  if (!data) return null

  const formatKey = (key: string) =>
    key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === 'number'
  )

  return (
    <div className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-navy/5 px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-gold">{icon}</span>
          <h3 className="font-[family-name:var(--font-cormorant)] text-base font-semibold text-navy">
            {title}
          </h3>
        </div>
      </div>
      <div className="bg-white divide-y divide-slate-50">
        {entries.map(([key, value]) => {
          const isHighlight = highlightKeys.includes(key)
          return (
            <div
              key={key}
              className={cn(
                'flex items-center justify-between px-5 py-2.5 text-sm',
                isHighlight && 'bg-navy/[0.03]'
              )}
            >
              <span
                className={cn(
                  'text-slate-600',
                  isHighlight && 'font-semibold text-navy'
                )}
              >
                {formatKey(key)}
              </span>
              <span
                className={cn(
                  'tabular-nums',
                  isHighlight
                    ? 'font-bold text-navy'
                    : 'text-slate-800'
                )}
              >
                {formatCurrency(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
