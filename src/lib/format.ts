/**
 * Formato data relativo in italiano
 * @example timeAgo(new Date('2026-05-08')) → "5 minuti fa"
 */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return 'Mai'
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)

  if (seconds < 60) return `${seconds}s fa`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m fa`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h fa`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}g fa`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} mesi fa`
  return `${Math.floor(seconds / 31536000)} anni fa`
}

/**
 * Estrae le iniziali da un nome completo
 * @example getInitials("Marco Vittoni") → "MV"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Format currency in formato italiano
 * @example formatCurrency(1234567) → "€ 1.234.567"
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR'
): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format currency con decimali completi
 */
export function formatCurrencyFull(
  amount: number | null | undefined,
  currency: 'EUR' | 'USD' | 'GBP' = 'EUR'
): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format file size leggibile
 * @example formatFileSize(1536000) → "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
}

/**
 * Tronca testo con ellipsis
 */
export function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '\u2026'
}

/**
 * Format date italiano
 * @example formatDateIT(new Date()) → "10/05/2026"
 */
export function formatDateIT(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(d)
}

/**
 * Format date con mese abbreviato
 * @example formatDateShort("2026-05-10") → "10 mag 2026"
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Format datetime italiano
 */
export function formatDateTimeIT(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d)
}
