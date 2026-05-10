'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Bell, Check, Inbox, FileText, AlertCircle, Key, Users, ArrowRightLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

interface Props { userId: string }

export function NotificationCenter({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initial load
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setNotifications(data ?? [])
        setUnreadCount((data ?? []).filter(n => !n.is_read).length)
      })
  }, [userId])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notif_center:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
          setUnreadCount(c => c + 1)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Auto mark read after 2s open
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => markAllRead(), 2000)
    return () => clearTimeout(timer)
  }, [open])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)

    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const grouped = groupByDay(notifications)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Bell className={cn('w-5 h-5', unreadCount > 0 ? 'text-[#D4AF37]' : 'text-slate-400')}
          style={unreadCount > 0 ? { animation: 'bell-ring 0.8s ease-in-out 2', transformOrigin: 'top center' } : undefined}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[600px] flex flex-col z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Notifiche</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider hover:underline"
                >
                  Segna tutte lette
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nessuna notifica</p>
                </div>
              ) : (
                <div className="py-1">
                  {Object.entries(grouped).map(([day, items]) => (
                    <div key={day}>
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {day}
                      </div>
                      {items.map(n => (
                        <NotificationItem key={n.id} notification={n} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100">
              <Link
                href="/portal/notifications"
                onClick={() => setOpen(false)}
                className="block text-center text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline"
              >
                Vedi tutte le notifiche
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NotificationItem({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const Icon = getNotificationIcon(notification.type)

  return (
    <Link
      href={notification.link ?? '#'}
      onClick={onClose}
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
        !notification.is_read && 'bg-[#D4AF37]/5 border-l-2 border-[#D4AF37]'
      )}
    >
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${!notification.is_read ? 'bg-[#D4AF37]/10' : 'bg-slate-50'}`}>
        <Icon className={`w-3 h-3 ${!notification.is_read ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-slate-900 truncate">{notification.title}</div>
        <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notification.body}</div>
        <div className="text-[10px] text-slate-400 mt-1">{timeAgo(notification.created_at)}</div>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 bg-[#D4AF37] rounded-full flex-shrink-0 mt-2" />
      )}
    </Link>
  )
}

function getNotificationIcon(type: string) {
  if (type.includes('access') || type.includes('l1') || type.includes('l2')) return Key
  if (type.includes('workgroup')) return Users
  if (type.includes('stage') || type.includes('deal')) return ArrowRightLeft
  if (type.includes('document') || type.includes('mandate')) return FileText
  if (type.includes('alert') || type.includes('warning')) return AlertCircle
  return Bell
}

function groupByDay(notifications: Notification[]): Record<string, Notification[]> {
  const result: Record<string, Notification[]> = {}
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000

  for (const n of notifications) {
    const created = new Date(n.created_at).getTime()
    let key: string
    if (created >= todayStart) key = 'Oggi'
    else if (created >= yesterdayStart) key = 'Ieri'
    else key = 'Precedenti'

    if (!result[key]) result[key] = []
    result[key].push(n)
  }

  return result
}
