'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  href: string
  icon?: ReactNode
  badge?: string | number
}

interface Props {
  tabs: TabItem[]
  activeTab?: string
  className?: string
}

export function IntelligenceTabs({ tabs, activeTab, className }: Props) {
  return (
    <nav
      className={cn(
        'w-full border-b border-[#D4AF37]/20 bg-[#001220]',
        className
      )}
      aria-label="Intelligence sections"
    >
      <div className="max-w-7xl mx-auto px-6">
        <ul className="flex flex-row items-stretch gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <li key={tab.id} className="flex-shrink-0">
                <Link
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium tracking-wide transition-colors',
                    'border-b-2',
                    isActive
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  {tab.icon ? (
                    <span className="inline-flex items-center" aria-hidden="true">
                      {tab.icon}
                    </span>
                  ) : null}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge !== null && tab.badge !== '' ? (
                    <span
                      className={cn(
                        'ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full',
                        'text-[10px] font-semibold leading-none',
                        'bg-[#D4AF37] text-[#001220]'
                      )}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
