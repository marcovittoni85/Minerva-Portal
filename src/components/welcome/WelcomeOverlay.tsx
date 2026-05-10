'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'minerva_welcome_shown'
const FRASI = [
  'L\'eccellenza senza compromessi',
  'Skin in the game',
  'Tutto parte dalla fiducia reciproca',
  'L\'ecosistema confederato del valore',
  'Un sistema, una promessa',
  'Il tempo è il vero capitale',
  'Hub & Spoke. Insieme oltre il limite.',
]

interface Props {
  userName?: string
  forceShow?: boolean
}

export function WelcomeOverlay({ userName, forceShow }: Props) {
  const [show, setShow] = useState(false)
  const [randomFrase] = useState(() =>
    FRASI[Math.floor(Math.random() * FRASI.length)]
  )

  useEffect(() => {
    if (window.innerWidth < 768) return

    if (forceShow) {
      setShow(true)
    } else {
      const lastShown = localStorage.getItem(STORAGE_KEY)
      const today = new Date().toISOString().split('T')[0]

      if (lastShown !== today) {
        setShow(true)
        localStorage.setItem(STORAGE_KEY, today)
      }
    }
  }, [forceShow])

  useEffect(() => {
    if (!show) return
    const timer = setTimeout(() => setShow(false), 3500)
    return () => clearTimeout(timer)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-[#001220] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: [0.95, 1.05, 1], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="absolute border-2 border-[#D4AF37]/30 rounded-full"
            style={{ width: '600px', height: '600px' }}
          />

          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl md:text-7xl font-[family-name:var(--font-cormorant)] text-[#D4AF37] tracking-wider mb-3"
            >
              MINERVA
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-sm md:text-base text-[#D4AF37]/60 font-[family-name:var(--font-cormorant)] tracking-widest uppercase mb-12"
            >
              Multiclient Family Office
            </motion.div>

            {userName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="text-xl md:text-2xl font-[family-name:var(--font-cormorant)] text-[#D4AF37]/80 mb-6"
              >
                Bentornato, {userName}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="text-base md:text-lg text-[#D4AF37]/70 italic font-[family-name:var(--font-cormorant)] tracking-wide max-w-md mx-auto"
            >
              &ldquo;{randomFrase}&rdquo;
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={() => setShow(false)}
              className="mt-12 text-sm text-[#D4AF37]/50 hover:text-[#D4AF37] underline transition-colors"
            >
              Entra
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
