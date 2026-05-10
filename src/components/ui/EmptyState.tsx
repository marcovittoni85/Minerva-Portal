'use client'
import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonPrimary, buttonSecondary } from './form'

interface Action {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

interface Props {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: Action
  secondaryAction?: Action
  className?: string
}

export function EmptyState({ icon: Icon, title, description, primaryAction, secondaryAction, className }: Props) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      className
    )}>
      <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-[#D4AF37]/60" />
      </div>

      <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">{description}</p>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap gap-3 justify-center">
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="secondary" />}
        </div>
      )}
    </div>
  )
}

function ActionButton({ action, variant }: { action: Action; variant: 'primary' | 'secondary' }) {
  const className = variant === 'primary' ? buttonPrimary : buttonSecondary

  if (action.href) {
    return <Link href={action.href} className={className}>{action.label}</Link>
  }
  return <button onClick={action.onClick} className={className}>{action.label}</button>
}
