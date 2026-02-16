'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
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
    <div className="min-h-screen bg-[#001220] flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full space-y-8 bg-[#001c30] p-10 rounded-xl border border-slate-800 shadow-2xl text-center">
        <div className="flex justify-center mb-6">
          <Image src="/icon.webp" alt="Minerva Partners" width={120} height={120} priority />
        </div>
        <h2 className="text-[#D4AF37] text-sm tracking-[0.3em] font-light uppercase">
          Private Marketplace
        </h2>
        <p className="text-[#C0C0C0] text-xs tracking-widest uppercase opacity-80">
          Minerva Partners
        </p>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800">
              {error}
            </div>
          )}
          <input
            type="email"
            required
            className="w-full px-3 py-3 bg-[#001220] border border-slate-700 rounded-lg outline-none focus:border-[#D4AF37] transition-colors"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="w-full px-3 py-3 bg-[#001220] border border-slate-700 rounded-lg outline-none focus:border-[#D4AF37] transition-colors"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4AF37] text-[#001220] font-bold rounded-lg hover:bg-[#b8962d] transition-colors disabled:opacity-50"
          >
            {loading ? 'ACCESSO...' : 'ACCEDI'}
          </button>
        </form>
        <div className="pt-6 border-t border-white/5">
          <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em]">
            Minerva Partners • Private & Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
