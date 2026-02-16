'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // FIX DEFINITIVO PER TYPESCRIPT
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
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
      <div className="max-w-md w-full space-y-8 bg-[#001c30] p-10 rounded-xl border border-slate-800 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Image src="/icon.webp" alt="Logo" width={140} height={140} priority />
          </div>
          <h2 className="text-[#D4AF37] text-sm tracking-[0.3em] font-light uppercase">User</h2>
          <p className="text-[#C0C0C0] text-xs tracking-widest font-medium uppercase opacity-80">Confederazione del Valore</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="bg-red-900/20 border border-red-500 text-red-200 p-3 rounded text-sm text-center">{error}</div>}
          <div className="space-y-4">
            <input
              type="email"
              required
              className="w-full px-3 py-3 bg-[#001220] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full px-3 py-3 bg-[#001220] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4AF37] text-[#001220] font-bold rounded-lg hover:bg-[#b8962d] transition-all"
          >
            {loading ? 'ACCESSO...' : 'ACCEDI AL PORTALE'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Forza nuovo commit ID per Vercel
