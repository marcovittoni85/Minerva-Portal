import { cn } from '@/lib/utils'

/* CSS classes condivise per form Minerva */

export const inputClass = cn(
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm',
  'text-slate-800 placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]',
  'disabled:bg-slate-50 disabled:cursor-not-allowed',
  'transition-all'
)

export const textareaClass = cn(
  inputClass,
  'min-h-[100px] resize-y'
)

export const selectClass = cn(
  inputClass,
  'cursor-pointer'
)

export const labelClass = 'block text-xs font-medium text-slate-500 mb-1'

export const helpTextClass = 'mt-1 text-xs text-slate-400'

export const errorTextClass = 'mt-1 text-xs text-red-700'

export const cardClass = 'bg-white rounded-2xl border border-slate-100 shadow-sm'

export const buttonPrimary = cn(
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
  'bg-[#001220] text-white hover:bg-[#001220]/90 transition-all',
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

export const buttonGold = cn(
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
  'bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white',
  'hover:shadow-md hover:shadow-[#D4AF37]/20 transition-all',
  'disabled:opacity-50'
)

export const buttonSecondary = cn(
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
  'border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all'
)

export const buttonDanger = cn(
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
  'bg-red-700 hover:bg-red-800 text-white transition-all'
)

export const buttonGhost = cn(
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
  'text-slate-600 hover:bg-slate-50 transition-all'
)
