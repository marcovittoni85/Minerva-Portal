'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/portal');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#001220] flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-[#001c30] p-10 rounded-2xl border border-[#D4AF37]/20 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <Image src="/icon.webp" alt="Minerva Partners" width={100} height={100} priority unoptimized />
        </div>
        <h1
          className="text-[#D4AF37] text-4xl font-light mb-2"
          style={{ fontFamily: 'var(--font-cormorant), serif' }}
        >
          Minerva Partners
        </h1>
        <p className="text-slate-400 text-[10px] tracking-[0.3em] uppercase mb-8">Private Marketplace</p>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-400 text-[10px] uppercase tracking-widest bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}
          <input
            type="email"
            required
            className="w-full bg-[#001220] border border-slate-800 p-4 text-[11px] tracking-widest uppercase outline-none focus:border-[#D4AF37] text-white placeholder:text-slate-500 rounded-lg"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full bg-[#001220] border border-slate-800 p-4 text-[11px] tracking-widest uppercase outline-none focus:border-[#D4AF37] text-white placeholder:text-slate-500 rounded-lg"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-[#001220] font-bold py-4 tracking-[0.3em] uppercase text-xs hover:bg-[#FBE8A6] transition-colors disabled:opacity-50 rounded-lg"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6">
          <Link
            href="/forgot-password"
            className="text-[10px] text-slate-400 hover:text-[#D4AF37] uppercase tracking-[0.2em] transition-colors"
          >
            Password dimenticata?
          </Link>
        </div>

        <div className="pt-8 mt-8 border-t border-[#D4AF37]/10">
          <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em]">
            Minerva Partners • Private &amp; Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
