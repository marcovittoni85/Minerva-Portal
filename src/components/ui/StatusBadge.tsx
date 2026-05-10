'use client'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

type DealStatus =
  | 'bozza'
  | 'in_review'
  | 'l1_richiesta'
  | 'l1_approvata'
  | 'l1_declinata'
  | 'l2_richiesta'
  | 'l2_in_verifica_admin'
  | 'l2_approvata'
  | 'l2_declinata'
  | 'in_trattativa'
  | 'closed_won'
  | 'closed_lost'
  | 'sospeso'
  // Existing DB values
  | 'pending'
  | 'approved'
  | 'declined'
  | 'pending_admin'
  | 'pending_originator'
  | 'pending_docs'
  | 'not_requested'

const STATUS_CONFIG: Record<string, {
  label: string
  bgClass: string
  textClass: string
  borderClass?: string
  pulse?: boolean
  tooltip: string
}> = {
  bozza: {
    label: 'Bozza',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-500',
    tooltip: 'Deal in fase di creazione, non ancora pubblicato',
  },
  in_review: {
    label: 'In review',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    tooltip: 'Deal in revisione interna prima di pubblicazione',
  },
  l1_richiesta: {
    label: 'L1 richiesta',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    pulse: true,
    tooltip: 'Richiesta interesse L1 in attesa di decisione originator',
  },
  pending: {
    label: 'In attesa',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    pulse: true,
    tooltip: 'Richiesta in attesa di decisione',
  },
  l1_approvata: {
    label: 'L1 approvata',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    tooltip: 'L1 approvata, accesso a dati Full',
  },
  approved: {
    label: 'Approvata',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    tooltip: 'Richiesta approvata',
  },
  l1_declinata: {
    label: 'L1 declinata',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    tooltip: "L1 declinata dall'originator",
  },
  declined: {
    label: 'Declinata',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    tooltip: 'Richiesta declinata',
  },
  l2_richiesta: {
    label: 'L2 richiesta',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
    pulse: true,
    tooltip: 'Richiesta L2 con docs in attesa di verifica admin',
  },
  pending_admin: {
    label: 'Verifica admin',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    pulse: true,
    tooltip: 'Documenti L2 in verifica da Hub Minerva',
  },
  l2_in_verifica_admin: {
    label: 'L2 in verifica',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    pulse: true,
    tooltip: 'Documenti L2 in verifica da Hub Minerva',
  },
  pending_originator: {
    label: 'Attesa originator',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-600',
    pulse: true,
    tooltip: 'L2 verificata, in attesa decisione originator',
  },
  pending_docs: {
    label: 'Docs richiesti',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-600',
    tooltip: 'Documentazione aggiuntiva richiesta',
  },
  l2_approvata: {
    label: 'L2 approvata',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    tooltip: 'L2 approvata, accesso completo dati cliente',
  },
  l2_declinata: {
    label: 'L2 declinata',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    tooltip: 'L2 declinata',
  },
  not_requested: {
    label: 'Non richiesta',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-400',
    tooltip: 'L2 non ancora richiesta',
  },
  in_trattativa: {
    label: 'In trattativa',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    tooltip: 'Deal in negoziazione attiva',
  },
  closed_won: {
    label: 'Closed won',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    tooltip: 'Deal chiuso con successo',
  },
  closed_lost: {
    label: 'Closed lost',
    bgClass: 'bg-red-50',
    textClass: 'text-red-600',
    tooltip: 'Deal non concluso',
  },
  sospeso: {
    label: 'Sospeso',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-600',
    tooltip: 'Deal temporaneamente sospeso',
  },
}

interface Props {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const config = STATUS_CONFIG[status]
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-transparent">
        {status}
      </span>
    )
  }

  const sizeClass = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  }[size]

  return (
    <Tooltip content={config.tooltip}>
      <span className={cn(
        'inline-flex items-center rounded-full font-medium border',
        sizeClass,
        config.bgClass,
        config.textClass,
        config.borderClass ?? 'border-transparent',
        config.pulse && 'animate-pulse'
      )}>
        {config.label}
      </span>
    </Tooltip>
  )
}
