'use client';

import { motion } from "framer-motion";

export const GeometricBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. Il colore di fondo base */}
      <div className="absolute inset-0 bg-[#001220]"></div>

      {/* 2. Bagliori diffusi (Luxury Glow) */}
      <motion.div 
        animate={{ opacity: [0.03, 0.06, 0.03], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#D4AF37] blur-[150px] rounded-full opacity-5"
      />
      <motion.div 
        animate={{ opacity: [0.02, 0.05, 0.02], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-[#D4AF37] blur-[180px] rounded-full opacity-5"
      />

      {/* 3. Il Pattern Geometrico Rotante (Ispirato al logo) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-50%] opacity-[0.03] bg-[url('/grid.svg')] bg-center"
        style={{
            // Questo crea un pattern complesso sovrapponendo due griglie
            backgroundImage: `radial-gradient(circle at center, transparent 30%, #001220 100%), repeating-linear-gradient(45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 50px), repeating-linear-gradient(-45deg, #D4AF37 0px, #D4AF37 1px, transparent 1px, transparent 50px)`
        }}
      >
      </motion.div>

      {/* 4. Vignettatura per concentrare l'attenzione al centro */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#001220_90%)]"></div>
    </div>
  );
};