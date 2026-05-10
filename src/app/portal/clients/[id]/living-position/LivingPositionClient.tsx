'use client'
import { useState } from 'react'
import { Building2, Users, Heart, Sparkles, Home, Receipt, AlertCircle, Calendar, Brain, Mail, Phone } from 'lucide-react'
import { formatDateIT, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Building2, Users, Heart, Sparkles, Home, Receipt,
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Props { client: any }

const TABS = [
  { id: 'sfere', label: '6 SFERE' },
  { id: 'alerts', label: 'Alert' },
  { id: 'decisioni', label: 'Decisioni' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'knowledge', label: 'Casi simili' },
] as const

export function LivingPositionClient({ client }: Props) {
  const [activeTab, setActiveTab] = useState<string>('sfere')

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-bold mb-1">Living Position</p>
        <h1 className="text-3xl font-[family-name:var(--font-cormorant)] text-slate-900 mb-1">{client.family_name}</h1>
        <p className="text-sm text-slate-500">{client.primary_member} · {client.status.replace(/_/g, ' ')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-100 overflow-x-auto">
        {TABS.map(tab => {
          const badge = tab.id === 'alerts' ? client.alert_attivi.length
            : tab.id === 'decisioni' ? client.decisioni_pendenti.length
            : null
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-[#D4AF37] text-[#D4AF37]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              )}
            >
              {tab.label}
              {badge !== null && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[#D4AF37]/10 text-[#D4AF37]">{badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'sfere' && <SfereSection sfere={client.sfere} />}
      {activeTab === 'alerts' && <AlertsSection alerts={client.alert_attivi} />}
      {activeTab === 'decisioni' && <DecisioniSection decisioni={client.decisioni_pendenti} />}
      {activeTab === 'timeline' && <TimelineSection touches={client.timeline_tocchi} />}
      {activeTab === 'knowledge' && <KnowledgeSection cases={client.knowledge_casi_simili} />}
    </div>
  )
}

function SfereSection({ sfere }: { sfere: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sfere.map(sfera => {
        const Icon = ICONS[sfera.icon] || Building2
        return (
          <div key={sfera.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-6 h-6 text-[#D4AF37]" />
              <span className={cn(
                'text-xs font-bold',
                sfera.coverage_pct >= 70 ? 'text-emerald-600' :
                sfera.coverage_pct >= 50 ? 'text-[#D4AF37]' : 'text-amber-500'
              )}>
                {sfera.coverage_pct}%
              </span>
            </div>

            <h3 className="text-xl font-[family-name:var(--font-cormorant)] text-slate-800 mb-2">{sfera.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{sfera.summary}</p>

            {/* Coverage bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  sfera.coverage_pct >= 70 ? 'bg-emerald-500' :
                  sfera.coverage_pct >= 50 ? 'bg-[#D4AF37]' : 'bg-amber-400'
                )}
                style={{ width: `${sfera.coverage_pct}%` }}
              />
            </div>

            <ul className="text-xs text-slate-500 space-y-1">
              {sfera.details.map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-[#D4AF37] mt-0.5">·</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function AlertsSection({ alerts }: { alerts: any[] }) {
  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={cn(
            'border-l-4 rounded-xl p-4 bg-white',
            alert.level === 'high' && 'border-red-500',
            alert.level === 'medium' && 'border-amber-500',
            alert.level === 'low' && 'border-blue-500',
          )}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className={cn(
              'w-5 h-5 flex-shrink-0 mt-0.5',
              alert.level === 'high' && 'text-red-500',
              alert.level === 'medium' && 'text-amber-500',
              alert.level === 'low' && 'text-blue-500',
            )} />
            <div className="flex-1">
              <h4 className="text-slate-800 font-medium">{alert.title}</h4>
              <p className="text-sm text-slate-500 mt-1">{alert.description}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-400">{alert.source}</span>
                {alert.action && <span className="text-[#D4AF37] italic font-medium">{alert.action}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DecisioniSection({ decisioni }: { decisioni: any[] }) {
  return (
    <div className="space-y-3">
      {decisioni.map(d => (
        <div key={d.id} className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-slate-800 font-medium">{d.title}</h4>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              d.priority === 'high' && 'bg-red-50 text-red-600',
              d.priority === 'medium' && 'bg-amber-50 text-amber-600',
            )}>
              {d.priority}
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-2">{d.description}</p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Calendar className="w-3 h-3" />
            Entro {formatDateIT(d.due_date)}
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineSection({ touches }: { touches: any[] }) {
  const iconMap: Record<string, LucideIcon> = { meeting: Users, email: Mail, call: Phone, event: Calendar }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-100" />

      <div className="space-y-4">
        {touches.map((t, i) => {
          const Icon = iconMap[t.type] || Calendar
          return (
            <div key={i} className="relative">
              <div className="absolute -left-[26px] top-3 w-3 h-3 rounded-full bg-[#D4AF37] ring-4 ring-white" />
              <div className="bg-white border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-800 font-medium text-sm">{t.actor}</span>
                  <span className="text-xs text-slate-400 ml-auto">
                    {timeAgo(t.date)} · {formatDateIT(t.date)}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{t.summary}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KnowledgeSection({ cases }: { cases: any[] }) {
  return (
    <div className="space-y-3">
      {cases.map(c => (
        <div key={c.id} className="bg-white border border-slate-100 rounded-xl p-4 hover:border-[#D4AF37]/30 cursor-pointer transition-colors">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-[#D4AF37] mt-1" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h4 className="text-slate-800 font-medium">{c.title}</h4>
                <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full font-medium">
                  {c.similarity_pct}% simile
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{c.summary}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
