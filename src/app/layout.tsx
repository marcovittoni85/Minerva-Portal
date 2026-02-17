'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setShowTagline(true), 800);
    const t2 = setTimeout(() => setShowLines(true), 1400);
    const t3 = setTimeout(() => setShowCta(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center px-6">

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Gold accent lines */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-[#D4AF37] to-transparent transition-all duration-[2000ms] ease-out ${showLines ? 'h-32 opacity-100' : 'h-0 opacity-0'}`} />
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-t from-[#D4AF37] to-transparent transition-all duration-[2000ms] ease-out ${showLines ? 'h-32 opacity-100' : 'h-0 opacity-0'}`} />
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-[#D4AF37] to-transparent transition-all duration-[2000ms] ease-out ${showLines ? 'w-24 opacity-100' : 'w-0 opacity-0'}`} />
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-l from-[#D4AF37] to-transparent transition-all duration-[2000ms] ease-out ${showLines ? 'w-24 opacity-100' : 'w-0 opacity-0'}`} />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl">

        {/* Logo with entrance animation */}
        <div className={`transition-all duration-[1200ms] ease-out ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative inline-block">
            <div className={`absolute -inset-8 bg-[#D4AF37]/5 rounded-full blur-2xl transition-opacity duration-[2000ms] ${showTagline ? 'opacity-100' : 'opacity-0'}`} />
            <Image
              src="/icon.webp"
              alt="Minerva Partners"
              width={100}
              height={100}
              priority
              className="relative"
            />
          </div>
        </div>

        {/* Title */}
        <div className={`mt-10 transition-all duration-[1000ms] ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '300ms' }}>
          <h1 className="text-slate-900 text-4xl md:text-5xl font-bold tracking-tight">
            Minerva <span className="text-[#D4AF37]">Partners</span>
          </h1>
        </div>

        {/* Divider */}
        <div className={`mx-auto mt-6 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-all duration-[1500ms] ${showTagline ? 'w-48 opacity-100' : 'w-0 opacity-0'}`} />

        {/* Tagline */}
        <div className={`mt-6 transition-all duration-[1000ms] ease-out ${showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400 font-medium">Private Investment Marketplace</p>
        </div>

        {/* Description lines */}
        <div className={`mt-8 space-y-2 transition-all duration-[1000ms] ease-out ${showLines ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
            Accesso esclusivo a operazioni riservate di M&A, Real Estate, Capital Markets e Private Debt per investitori qualificati.
          </p>
        </div>

        {/* CTA */}
        <div className={`mt-12 transition-all duration-[800ms] ease-out ${showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => router.push('/login')}
            className="group relative inline-flex items-center gap-3 bg-white border border-[#D4AF37]/30 text-slate-900 px-8 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.25em] hover:border-[#D4AF37] hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300"
          >
            <span>Accedi al Portale</span>
            <svg className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        {/* Trust badges */}
        <div className={`mt-16 flex items-center justify-center gap-8 transition-all duration-[800ms] ease-out ${showCta ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '400ms' }}>
          <div className="text-center">
            <p className="text-[#D4AF37] text-lg font-bold">NDA</p>
            <p className="text-slate-400 text-[8px] uppercase tracking-widest mt-1">Protected</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <p className="text-[#D4AF37] text-lg font-bold">AES-256</p>
            <p className="text-slate-400 text-[8px] uppercase tracking-widest mt-1">Encrypted</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <p className="text-[#D4AF37] text-lg font-bold">GDPR</p>
            <p className="text-slate-400 text-[8px] uppercase tracking-widest mt-1">Compliant</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`absolute bottom-6 text-center transition-all duration-[800ms] ${showCta ? 'opacity-100' : 'opacity-0'}`}
        style={{ transitionDelay: '600ms' }}>
        <p className="text-slate-300 text-[8px] uppercase tracking-[0.4em]">© 2025 Minerva Partners • Private & Confidential</p>
      </div>
    </div>
  );
}
