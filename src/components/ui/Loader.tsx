import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  size?: Size
  className?: string
  label?: string
}

const sizeMap: Record<Size, { box: string; ring: string; inner: string }> = {
  sm: { box: 'w-4 h-4', ring: 'border-2', inner: 'border-2' },
  md: { box: 'w-8 h-8', ring: 'border-2', inner: 'border-2' },
  lg: { box: 'w-12 h-12', ring: 'border-3', inner: 'border-3' },
  xl: { box: 'w-20 h-20', ring: 'border-4', inner: 'border-4' },
}

export function Loader({ size = 'md', className, label }: Props) {
  const config = sizeMap[size]

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className={cn('relative', config.box)}>
        {/* Outer ring gold */}
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            config.ring,
            'border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin'
          )}
          style={{ animationDuration: '1.5s' }}
        />
        {/* Inner ring navy counter-rotation */}
        <div
          className={cn(
            'absolute inset-1 rounded-full',
            config.inner,
            'border-[#001220]/20 border-b-[#001220] animate-spin'
          )}
          style={{ animationDuration: '1s', animationDirection: 'reverse' }}
        />
      </div>
      {label && (
        <span className="text-xs text-slate-400 italic">{label}</span>
      )}
    </div>
  )
}

/**
 * Page-level loader (full screen)
 */
export function PageLoader({ label = 'Caricamento...' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur flex items-center justify-center">
      <div className="text-center">
        <Loader size="xl" />
        <p className="mt-4 text-slate-500 font-[family-name:var(--font-cormorant)] text-lg">{label}</p>
      </div>
    </div>
  )
}

/**
 * Inline loader for buttons / inline state
 */
export function InlineLoader({ className }: { className?: string }) {
  return <Loader size="sm" className={className} />
}
