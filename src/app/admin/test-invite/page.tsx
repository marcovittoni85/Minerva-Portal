'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, User } from 'lucide-react';
import Image from 'next/image';

export default function TestInvite() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch { setStatus('error'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#001220] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-[#001c30] p-10 rounded-2xl border border-[#D4AF37]/20 shadow-2xl">
        <div className="text-center mb-10 text-[#D4AF37] uppercase tracking-[0.3em]">
          <Image 
            src="/icon.webp" 
            alt="Logo" 
            width={80} 
            height={80} 
            unoptimized
            className="mx-auto mb-6" 
          />
          <h2 className="text-xl font-light">Console Onboarding</h2>
        </div>
        <form onSubmit={handleSend} className="space-y-4">
          <input 
            type="text" 
            placeholder="NOME PARTNER" 
            className="w-full bg-[#001220] border border-slate-800 p-4 text-[10px] tracking-widest uppercase outline-none focus:border-[#D4AF37]" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <input 
            type="email" 
            placeholder="EMAIL" 
            className="w-full bg-[#001220] border border-slate-800 p-4 text-[10px] tracking-widest uppercase outline-none focus:border-[#D4AF37]" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <button className="w-full bg-[#D4AF37] text-[#001220] font-bold py-4 tracking-widest uppercase hover:bg-[#FBE8A6]">
            {loading ? 'INVIO...' : 'INVIA ACCESSO'}
          </button>
        </form>
        {status === 'success' && <p className="mt-4 text-[#D4AF37] text-center uppercase tracking-widest text-[10px]">Invito inviato</p>}
        {status === 'error' && <p className="mt-4 text-red-500 text-center uppercase tracking-widest text-[10px]">Errore nell'invio</p>}
      </div>
    </div>
  );
}