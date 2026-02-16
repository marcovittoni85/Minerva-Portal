'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Globe, Lock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#001220] text-white overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-8 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <Image 
            src="/icon.webp" 
            alt="Minerva Logo" 
            width={40} 
            height={40} 
            className="drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
            unoptimized
          />
          <span className="text-[#D4AF37] tracking-[0.3em] uppercase text-[10px] font-light">Minerva Partners</span>
        </div>
        <Link 
          href="/login" 
          className="border border-[#D4AF37]/30 px-6 py-2 text-[10px] tracking-[0.2em] uppercase hover:bg-[#D4AF37] hover:text-[#001220] transition-all"
        >
          Accesso Partner
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[#D4AF37] text-[12px] tracking-[0.5em] uppercase mb-6 block">Private Marketplace</h2>
          <h1 className="text-5xl lg:text-7xl font-light leading-tight mb-8 tracking-tight">
            Investimenti <br />
            <span className="italic font-serif"> d'élite </span> per <br />
            Partner Selezionati.
          </h1>
          <p className="text-slate-400 text-lg max-w-md mb-12 leading-relaxed font-light">
            L'esclusivo portale riservato per la gestione e il monitoraggio dei deal di Minerva Partners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6">
            <Link 
              href="/login" 
              className="bg-[#D4AF37] text-[#001220] px-10 py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-[#FBE8A6] transition-all flex items-center justify-center group"
            >
              Entra nel Portale <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative hidden lg:block"
        >
          <div className="relative z-10 border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-2 rounded-3xl backdrop-blur-sm">
            <Image 
              src="/icon.webp" 
              alt="Minerva Hero" 
              width={600} 
              height={600} 
              className="rounded-2xl opacity-80"
              unoptimized
            />
          </div>
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-[#D4AF37]/10 blur-[100px] rounded-full z-0"></div>
        </motion.div>
      </main>

      {/* Footer Info */}
      <div className="relative z-10 border-t border-white/5 bg-[#001c30]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex items-start space-x-4">
            <Shield className="w-5 h-5 text-[#D4AF37] mt-1" />
            <div>
              <h4 className="text-[10px] tracking-[0.2em] uppercase mb-2">Sicurezza Totale</h4>
              <p className="text-slate-500 text-[10px] leading-relaxed">Accesso protetto tramite Magic Link cifrato e monitoraggio costante.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Globe className="w-5 h-5 text-[#D4AF37] mt-1" />
            <div>
              <h4 className="text-[10px] tracking-[0.2em] uppercase mb-2">Deal Internazionali</h4>
              <p className="text-slate-500 text-[10px] leading-relaxed">Opportunità di investimento nei mercati globali più esclusivi.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Lock className="w-5 h-5 text-[#D4AF37] mt-1" />
            <div>
              <h4 className="text-[10px] tracking-[0.2em] uppercase mb-2">Riservatezza</h4>
              <p className="text-slate-500 text-[10px] leading-relaxed">Ogni transazione e documento è protetto da vincoli di confidenzialità.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}