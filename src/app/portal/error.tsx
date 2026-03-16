'use client';

import { useEffect } from 'react';

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Portal error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Qualcosa è andato storto</h2>
          <p className="text-sm text-slate-500 mt-2">Si è verificato un errore nel caricamento della pagina.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#b8962d] transition-colors"
          >
            Riprova
          </button>
          <a
            href="/portal"
            className="px-6 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
