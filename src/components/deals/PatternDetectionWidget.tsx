'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { buttonPrimary, buttonSecondary } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { PatternDetection } from '@/lib/claude/schemas/pattern-detection'

interface Props {
  dealId: string
  isAdmin?: boolean
}

export function PatternDetectionWidget({ dealId, isAdmin = false }: Props) {
  const [detection, setDetection] = useState<PatternDetection | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExisting()
  }, [dealId])

  const loadExisting = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('intelligence_outputs')
        .select('content')
        .eq('deal_id', dealId)
        .eq('output_type', 'pattern_detection')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setDetection(data.content as PatternDetection)
      }
    } catch {
      // Table may not exist yet
    } finally {
      setLoaded(true)
    }
  }

  const handleDetect = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/deals/${dealId}/detect-patterns`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Errore sconosciuto' }))
        throw new Error(body.error || 'Errore nella richiesta')
      }
      const data = await res.json()
      setDetection(data.detection)
    } catch (e: any) {
      setError(e?.message || 'Errore nella detection')
    } finally {
      setLoading(false)
    }
  }

  if (!loaded) return null

  // No detection exists yet
  if (!detection) {
    if (!isAdmin) return null
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-lg font-[family-name:var(--font-cormorant)] text-white">
              Pattern Detection
            </h3>
          </div>
          <button
            onClick={handleDetect}
            disabled={loading}
            className={cn(buttonPrimary, '!bg-[#D4AF37] !text-[#001220]')}
          >
            {loading ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Rileva pattern
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }

  const patterns = detection.detected_patterns
  const topPatterns = patterns.slice(0, 3)
  const remainingPatterns = patterns.slice(3)

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="text-lg font-[family-name:var(--font-cormorant)] text-white">
            Pattern Detection
          </h3>
          {patterns.length > 0 && (
            <span className="text-xs bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full">
              {patterns.length} pattern
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={handleDetect}
            disabled={loading}
            className={cn(buttonSecondary, 'text-xs')}
          >
            {loading ? (
              <>
                <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                Rigenerazione...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Rigenera
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* No patterns detected */}
      {patterns.length === 0 && (
        <div className="flex items-center gap-3 text-white/60 bg-white/5 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-white/40" />
          <p className="text-sm">
            {detection.no_patterns_note || 'Nessun pattern rilevato per questo deal.'}
          </p>
        </div>
      )}

      {/* Top 3 patterns with gold border */}
      {topPatterns.length > 0 && (
        <div className="space-y-3">
          {topPatterns.map((pattern) => (
            <PatternRow key={pattern.code} pattern={pattern} highlighted />
          ))}
        </div>
      )}

      {/* Remaining patterns in collapsible section */}
      {remainingPatterns.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-sm text-white/50 hover:text-white/70 transition-colors py-2 select-none">
            Mostra altri {remainingPatterns.length} pattern
          </summary>
          <div className="space-y-3 mt-2">
            {remainingPatterns.map((pattern) => (
              <PatternRow key={pattern.code} pattern={pattern} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

interface PatternRowProps {
  pattern: PatternDetection['detected_patterns'][number]
  highlighted?: boolean
}

function PatternRow({ pattern, highlighted = false }: PatternRowProps) {
  const scoreColor =
    pattern.score >= 80
      ? 'text-emerald-400'
      : pattern.score >= 65
        ? 'text-[#D4AF37]'
        : 'text-amber-400'

  const scoreBarColor =
    pattern.score >= 80
      ? 'bg-emerald-400'
      : pattern.score >= 65
        ? 'bg-[#D4AF37]'
        : 'bg-amber-400'

  const confidenceBadge = {
    high: 'bg-emerald-500/20 text-emerald-400',
    medium: 'bg-[#D4AF37]/20 text-[#D4AF37]',
    low: 'bg-amber-500/20 text-amber-400',
  }[pattern.confidence]

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        highlighted
          ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5'
          : 'border-white/10 bg-white/[0.02]'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-xs font-mono text-white/60 bg-white/10 px-1.5 py-0.5 rounded">
              {pattern.code}
            </code>
            <span className="text-sm font-medium text-white truncate">
              {pattern.name}
            </span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                confidenceBadge
              )}
            >
              {pattern.confidence}
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed mt-1">
            {pattern.evidence}
          </p>
          {pattern.suggested_action && (
            <p className="text-xs text-[#D4AF37]/80 mt-2 flex items-start gap-1.5">
              <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{pattern.suggested_action}</span>
            </p>
          )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={cn('text-lg font-bold tabular-nums', scoreColor)}>
            {pattern.score}
          </span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', scoreBarColor)}
              style={{ width: `${pattern.score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
