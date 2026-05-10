'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  greeting?: string
  className?: string
}

const FRASI_MINERVA = [
  'L\'eccellenza senza compromessi',
  'Skin in the game',
  'Tutto parte dalla fiducia reciproca',
  'L\'ecosistema confederato del valore',
  'Hub & Spoke. Insieme oltre il limite.',
  'Il tempo è il vero capitale',
  'Un sistema, una promessa',
]

export function HeroOrb({ greeting = 'Bentornato in Minerva', className }: Props) {
  const [isVisible, setIsVisible] = useState(true)
  const [randomFrase] = useState(() =>
    FRASI_MINERVA[Math.floor(Math.random() * FRASI_MINERVA.length)]
  )

  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden)
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return (
    <div className={cn(
      'relative h-64 flex items-center justify-center overflow-hidden rounded-2xl',
      'bg-gradient-to-b from-[#001220] via-[#001220]/95 to-[#001220]/80',
      className
    )}>
      {/* Orb container */}
      <div className={cn(
        'relative w-48 h-48',
        isVisible && 'animate-pulse-slow'
      )}>
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        {/* Main orb */}
        <div className="absolute inset-4 rounded-full bg-gradient-radial from-[#D4AF37] via-[#D4AF37]/60 to-[#001220] shadow-2xl" />
        {/* Inner core */}
        <div className="absolute inset-12 rounded-full bg-gradient-radial from-yellow-100 via-[#D4AF37] to-transparent" />
        {/* Orbiting particles */}
        {isVisible && Array.from({ length: 6 }).map((_, i) => (
          <Particle key={i} index={i} totalParticles={6} />
        ))}
      </div>

      {/* Text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <h2 className="text-2xl font-[family-name:var(--font-cormorant)] text-[#D4AF37] tracking-wide">{greeting}</h2>
        <p className="text-sm text-[#D4AF37]/70 italic font-[family-name:var(--font-cormorant)] tracking-widest uppercase mt-1">
          {randomFrase}
        </p>
      </div>
    </div>
  )
}

function Particle({ index, totalParticles }: { index: number; totalParticles: number }) {
  const delay = (index / totalParticles) * 8
  const duration = 8 + (index % 3)

  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2"
      style={{
        animation: `orbit ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="w-2 h-2 rounded-full bg-[#D4AF37]/80 shadow-[0_0_8px_rgba(212,175,55,0.8)]"
        style={{ transform: 'translateX(120px)' }}
      />
    </div>
  )
}
