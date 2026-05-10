'use client'
import { getInitials } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Props {
  user: { full_name?: string; avatar_url?: string } | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
}

export function MinervaAvatar({ user, size = 'md' }: Props) {
  const initials = getInitials(user?.full_name)

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name ?? ''}
        className={cn('rounded-full object-cover', sizeMap[size])}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full bg-[#001220] text-[#D4AF37] font-bold flex items-center justify-center flex-shrink-0',
      sizeMap[size]
    )}>
      {initials}
    </div>
  )
}
