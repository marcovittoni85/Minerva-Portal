import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/** Base skeleton block with shimmer effect */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded relative overflow-hidden bg-slate-100',
        'before:absolute before:inset-0',
        'before:-translate-x-full',
        'before:animate-[shimmer_1.5s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-[#D4AF37]/10 before:to-transparent',
        className
      )}
    />
  )
}

/** Deal card skeleton */
export function DealCardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <Skeleton className="w-full h-32" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

/** Contact row skeleton for CRM lists */
export function ContactRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  )
}

/** Dashboard widget skeleton */
export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-12 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-8 w-full rounded" />
    </div>
  )
}

/** Pipeline kanban column skeleton */
export function PipelineColumnSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div className="flex-shrink-0 w-72 bg-slate-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      {Array.from({ length: cardCount }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="w-6 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Info Memo skeleton during AI generation */
export function InfoMemoSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-8 space-y-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/** Pattern Detection widget skeleton */
export function PatternDetectionSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-5 w-40" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-slate-50 border border-slate-100 rounded p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
      ))}
    </div>
  )
}
