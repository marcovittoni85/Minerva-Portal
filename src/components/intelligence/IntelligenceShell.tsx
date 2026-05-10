import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { IntelligenceTabs, type TabItem } from './IntelligenceTabs'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface ActionItem {
  label: string
  href?: string
  onClick?: never
  variant?: 'primary' | 'secondary'
}

interface IntelligenceShellProps {
  title: string
  subtitle?: string
  breadcrumb?: BreadcrumbItem[]
  tabs?: TabItem[]
  activeTab?: string
  children: ReactNode
  sidebarContent?: ReactNode
  actions?: ActionItem[]
  className?: string
}

export function IntelligenceShell({
  title,
  subtitle,
  breadcrumb,
  tabs,
  activeTab,
  children,
  sidebarContent,
  actions,
  className,
}: IntelligenceShellProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-[#001220] text-white font-[\'DM_Sans\',sans-serif]',
        className
      )}
    >
      {/* Header */}
      <header className="border-b border-[#D4AF37]/20 bg-[#001220]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav
              aria-label="Breadcrumb"
              className="mb-4 text-xs text-gray-400"
            >
              <ol className="flex flex-wrap items-center gap-1.5">
                {breadcrumb.map((item, idx) => {
                  const isLast = idx === breadcrumb.length - 1
                  return (
                    <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                      {item.href && !isLast ? (
                        <Link
                          href={item.href}
                          className="hover:text-gray-200 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span
                          className={cn(
                            isLast ? 'text-[#D4AF37]' : 'text-gray-400'
                          )}
                        >
                          {item.label}
                        </span>
                      )}
                      {!isLast ? (
                        <span aria-hidden="true" className="text-gray-600">
                          /
                        </span>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            </nav>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1
                className={cn(
                  "font-['Cormorant_Garamond',serif] text-4xl md:text-5xl text-[#D4AF37]",
                  'leading-tight tracking-tight'
                )}
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 italic text-gray-300 max-w-2xl">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions && actions.length > 0 ? (
              <div className="flex flex-wrap gap-2 md:flex-nowrap md:items-center">
                {actions.map((action, idx) => {
                  const isPrimary = (action.variant ?? 'primary') === 'primary'
                  const classes = cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isPrimary
                      ? 'bg-[#D4AF37] text-[#001220] hover:bg-[#D4AF37]/90'
                      : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                  )
                  if (action.href) {
                    return (
                      <Link
                        key={`${action.label}-${idx}`}
                        href={action.href}
                        className={classes}
                      >
                        {action.label}
                      </Link>
                    )
                  }
                  return (
                    <span
                      key={`${action.label}-${idx}`}
                      className={classes}
                    >
                      {action.label}
                    </span>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab bar */}
        {tabs && tabs.length > 0 ? (
          <IntelligenceTabs tabs={tabs} activeTab={activeTab} />
        ) : null}
      </header>

      {/* Main + sidebar */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div
          className={cn(
            'flex flex-col gap-8',
            sidebarContent ? 'lg:flex-row' : ''
          )}
        >
          <div className="flex-1 min-w-0">{children}</div>

          {sidebarContent ? (
            <aside
              className={cn(
                'w-full lg:w-80 lg:flex-shrink-0',
                'lg:sticky lg:top-24 lg:self-start',
                'rounded-xl border border-[#D4AF37]/20 bg-[#000a14] p-5'
              )}
            >
              {sidebarContent}
            </aside>
          ) : null}
        </div>

        <footer className="mt-16 text-center text-xs text-gray-500">
          Powered by Minerva Intelligence
        </footer>
      </main>
    </div>
  )
}
