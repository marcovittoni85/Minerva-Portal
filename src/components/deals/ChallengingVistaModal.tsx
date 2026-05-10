'use client'
import { useState, useEffect } from 'react'
import { X, Sparkles, Briefcase, Calculator, User, AlertTriangle, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Loader } from '@/components/ui/Loader'
import { buttonPrimary } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import type { ChallengingVista } from '@/lib/claude/schemas/challenging-vista'

interface Props {
  dealId: string
  open: boolean
  onClose: () => void
}

export function ChallengingVistaModal({ dealId, open, onClose }: Props) {
  const [vista, setVista] = useState<ChallengingVista | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) loadOrGenerate()
  }, [open, dealId])

  const loadOrGenerate = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('intelligence_outputs')
        .select('content')
        .eq('deal_id', dealId)
        .eq('output_type', 'challenging_vista')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setVista(data.content as ChallengingVista)
      } else {
        handleGenerate()
      }
    } catch {
      // Table may not exist, generate fresh
      handleGenerate()
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/challenging-vista`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setVista(data.vista)
    } catch (e) {
      console.error('Challenging Vista error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#001220]/95 backdrop-blur overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="container mx-auto px-6 py-12 max-w-7xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-2">Challenging Vista</h1>
              <p className="text-[#D4AF37]/70">3 letture parallele · esclusivo Minerva</p>
              {vista && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={cn(buttonPrimary, 'mt-4 !bg-[#D4AF37] !text-[#001220]')}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Rigenera
                </button>
              )}
            </div>

            {loading && !vista && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader size="xl" />
                <p className="mt-6 text-[#D4AF37]/70 italic">Sto generando le 3 letture parallele...</p>
                <p className="text-sm text-[#D4AF37]/50 mt-2">Tempo stimato: 30-60s</p>
              </div>
            )}

            {vista && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <ViewColumn icon={Briefcase} title="Marco Vittoni" subtitle="Lens M&A Boutique" color="gold" view={vista.marco_view} />
                  <ViewColumn icon={Calculator} title="Enrico Viganò" subtitle="Lens Tax/Governance" color="emerald" view={vista.enrico_view} />
                  <ViewColumn icon={User} title="Cliente Imprenditore" subtitle="Lens Personale/Famiglia" color="amber" view={vista.cliente_view} />
                </div>

                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-6">
                  <h3 className="text-2xl font-[family-name:var(--font-cormorant)] text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Tensioni esplicitate
                  </h3>
                  <ul className="space-y-2">
                    {vista.consolidated_tensions.map((t, i) => (
                      <li key={i} className="text-white/80 flex items-start gap-2">
                        <span className="text-red-400 flex-shrink-0">&#x27F7;</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37]/40 rounded-xl p-6">
                  <h3 className="text-2xl font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recommendation finale
                  </h3>
                  <p className="text-white/90 leading-relaxed whitespace-pre-line">{vista.recommendation}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ViewColumnProps {
  icon: typeof Briefcase
  title: string
  subtitle: string
  color: 'gold' | 'emerald' | 'amber'
  view: ChallengingVista['marco_view']
}

function ViewColumn({ icon: Icon, title, subtitle, color, view }: ViewColumnProps) {
  const colorClass = {
    gold: 'border-[#D4AF37]/30 bg-[#D4AF37]/5',
    emerald: 'border-emerald-500/30 bg-emerald-900/10',
    amber: 'border-amber-500/30 bg-amber-900/10',
  }[color]

  const iconColor = {
    gold: 'text-[#D4AF37]',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }[color]

  return (
    <div className={cn('rounded-xl border-2 p-5', colorClass)}>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <Icon className={cn('w-6 h-6', iconColor)} />
        <div>
          <h3 className="text-xl font-[family-name:var(--font-cormorant)] text-white">{title}</h3>
          <p className="text-xs text-white/60">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <h4 className="text-white/50 uppercase text-xs tracking-wider mb-2">Lettura</h4>
          <p className="text-white/80 leading-relaxed">{view.reading}</p>
        </div>

        <div>
          <h4 className="text-white/50 uppercase text-xs tracking-wider mb-2">Soluzioni proposte</h4>
          <div className="space-y-2">
            {view.proposed_solutions.map((s, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded p-2">
                <div className="text-white font-medium text-sm">{s.title}</div>
                <p className="text-white/60 text-xs mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {view.tensions_with_others.length > 0 && (
          <div>
            <h4 className="text-white/50 uppercase text-xs tracking-wider mb-2">Tensioni con altri</h4>
            <ul className="space-y-1 text-xs text-white/70">
              {view.tensions_with_others.map((t, i) => (
                <li key={i}>· {t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
