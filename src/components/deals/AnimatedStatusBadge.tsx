'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/client'

interface Props {
  status: string
  dealId: string
  enableRealtimeUpdate?: boolean
}

const SIGNIFICANT_UPGRADES = new Set([
  'l1_richiesta-l1_approvata',
  'l1_approvata-l2_richiesta',
  'l2_in_verifica_admin-l2_approvata',
  'in_trattativa-closed_won',
])

export function AnimatedStatusBadge({ status, dealId, enableRealtimeUpdate = true }: Props) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (status !== currentStatus) {
      setPreviousStatus(currentStatus)
      setCurrentStatus(status)
    }
  }, [status, currentStatus])

  useEffect(() => {
    if (!enableRealtimeUpdate) return

    const supabase = createClient()
    const channel = supabase
      .channel(`deal:${dealId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${dealId}` },
        (payload: { new: { status?: string } }) => {
          const newStatus = payload.new.status
          if (newStatus && newStatus !== currentStatus) {
            setPreviousStatus(currentStatus)
            setCurrentStatus(newStatus)

            const transition = `${currentStatus}-${newStatus}`
            if (SIGNIFICANT_UPGRADES.has(transition) && containerRef.current) {
              triggerParticleEffect(containerRef.current)
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dealId, currentStatus, enableRealtimeUpdate])

  return (
    <span ref={containerRef} className="relative inline-block">
      <AnimatePresence mode="wait">
        <motion.span
          key={currentStatus}
          initial={previousStatus ? { scale: 0.95, opacity: 0 } : { opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <StatusBadge status={currentStatus} />
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function triggerParticleEffect(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 4,
    angle: 90,
    spread: 30,
    startVelocity: 25,
    decay: 0.9,
    gravity: 1.2,
    ticks: 60,
    origin: { x, y },
    colors: ['#D4AF37', '#FFD700', '#B8860B'],
    scalar: 0.6,
    drift: 0,
  })
}
