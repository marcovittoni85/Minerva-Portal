'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { GeometricBackground } from "@/components/GeometricBackground";
import { ArrowRight, Shield, Diamond, Users } from "lucide-react";

// Definiamo le animazioni standard per riutilizzarle
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans">
      {/* Sfondo Geometrico Attivo */}
      <GeometricBackground />

      <main className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 text-center">
        
        {/* Sezione Hero Animata */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-12"
        >
          {/* Logo con effetto "respiro" */}
          <motion.div variants={fadeInUp} className="flex justify-center relative">
            <motion.div
              animate={{ scale: [1, 1.02, 1], filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
                 {/* Bagliore dietro al logo */}
                <div className="absolute inset-0 bg-[#D4AF37] blur-[50px] opacity-20 rounded-full z-0"></div>
                <Image
                src="/icon.webp"
                alt="Minerva Partners Logo"
                width={220}
                height={220}
                priority
                className="drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] relative z-10"
                />
            </motion.div>
          </motion.div>

          {/* Testi con tipografia Luxury */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <h1 className="text-[#D4AF37] text-4xl md:text-6xl tracking-[0.25em] font-extralight uppercase leading-tight">
              Minerva <br/><span className="font-light">Partners</span>
            </h1>
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto"></div>
            <p className="text-[#C0C0C0] text-sm md:text-base tracking-[0.4em] uppercase font-medium opacity-80 max-w-lg mx-auto leading-relaxed">
              L'esclusivo Private Marketplace per la Confederazione del Valore
            </p>
          </motion.div>

          {/* Bottone d'ingresso con effetto magnetico e bagliore al passaggio */}
          <motion.div variants={fadeInUp} className="pt-8">
            <Link href="/login" className="group relative inline-flex items-center justify-center px-16 py-5 overflow-hidden tracking-[0.3em] font-bold text-[11px] text-[#001220] uppercase bg-[#D4AF37] rounded-sm transition-all duration-300 hover:bg-[#FBE8A6] hover:shadow-[0_0_40px_rgba(212,175,55,0.5)]">
                {/* Effetto luce che scorre sul bottone */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                <span className="relative z-10 flex items-center">
                    Accedi al Portale <ArrowRight className="ml-4 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </span>
            </Link>
          </motion.div>
        </motion.div>

        {/* Sezione "Valori" a comparsa (Scroll) */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4"
        >
            <FeatureCard icon={Shield} title="Esclusività" description="Accesso riservato ai soli membri approvati dal Board." />
            <FeatureCard icon={Diamond} title="Eccellenza" description="Solo opportunità di alto profilo e partner selezionati." />
            <FeatureCard icon={Users} title="Network" description="Connessioni dirette con i leader della Confederazione." />
        </motion.div>

      </main>

      <footer className="fixed bottom-6 w-full text-center z-20 mix-blend-overlay pointer-events-none">
        <p className="text-[#D4AF37] text-[8px] uppercase tracking-[0.6em] opacity-40">
          Minerva Partners • Private & Confidential
        </p>
      </footer>
    </div>
  );
}

// Componente per le Card "Valori" con effetto hover sofisticato
function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
      <motion.div 
        whileHover={{ y: -5 }}
        className="group relative p-8 bg-[#001c30]/40 backdrop-blur-md border border-[#D4AF37]/10 rounded-xl text-left overflow-hidden transition-all duration-500 hover:border-[#D4AF37]/40 hover:bg-[#001c30]/60"
      >
        {/* Bagliore geometrico all'hover */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative z-10">
            <Icon className="w-10 h-10 text-[#D4AF37] mb-6 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1} />
            <h3 className="text-[#D4AF37] text-lg tracking-[0.2em] uppercase font-light mb-3">{title}</h3>
            <div className="h-[1px] w-12 bg-[#D4AF37]/30 mb-4 group-hover:w-full transition-all duration-700"></div>
            <p className="text-slate-400 text-xs tracking-wider leading-relaxed uppercase opacity-70">{description}</p>
        </div>
      </motion.div>
    );
  }