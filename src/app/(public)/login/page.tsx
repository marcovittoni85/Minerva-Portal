'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/portal');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#001220] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#001c30] p-10 rounded-xl border border-slate-800 shadow-2xl">
        
        {/* LOGO E TESTI PERSONALIZZATI */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Image 
              src="/icon.png" 
              alt="Minerva Partners Logo" 
              width={140} 
              height={140}
              priority
              className="drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-[#D4AF37] text-sm tracking-[0.3em] font-light uppercase">
              User
            </h2>
            <p className="text-[#C0C0C0] text-xs tracking-widest font-medium uppercase opacity-80">
              Confederazione del Valore
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-200 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-slate-700 bg-[#001220] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none relative block w-full px-3 py-3 border border-slate-700 bg-[#001220] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-[#001220] bg-[#D4AF37] hover:bg-[#b8962d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] transition-all duration-200"
            >
              {loading ? 'ACCESSO IN CORSO...' : 'ACCEDI AL PORTALE'}
            </button>
          </div>
        </form>
      </div>
      
      <p className="mt-8 text-slate-500 text-xs">
        © 2026 Minerva Partners Board. All rights reserved.
      </p>
    </div>
  );
}