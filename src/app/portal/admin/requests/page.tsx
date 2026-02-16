'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Check, X, Loader2, Shield } from 'lucide-react';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser();

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('deal_access_requests')
      .select('*, deals(title, code), profiles(full_name, email)')
      .eq('status', 'pending');
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (requestId: string, userId: string, dealId: string, action: 'approved' | 'rejected') => {
    if (action === 'approved') {
      // 1. Crea l'accesso effettivo
      await supabase.from('deal_access').insert({
        user_id: userId,
        deal_id: dealId,
        access_level: 'full'
      });
    }

    // 2. Aggiorna lo stato della richiesta
    await supabase
      .from('deal_access_requests')
      .update({ status: action })
      .eq('id', requestId);

    loadRequests();
  };

  return (
    <div className="min-h-screen bg-[#001220] p-8">
      <header className="max-w-5xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-[#D4AF37] text-xl tracking-[0.3em] uppercase font-light text-white">Gestione Richieste</h1>
          <p className="text-slate-500 text-[9px] tracking-[0.2em] uppercase mt-2">Pannello di Controllo Admin</p>
        </div>
        <Shield className="text-[#D4AF37] opacity-20 w-8 h-8" />
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        {loading ? <Loader2 className="animate-spin text-[#D4AF37] mx-auto" /> : 
         requests.length === 0 ? <p className="text-slate-500 text-center text-xs uppercase tracking-widest py-20 border border-white/5 rounded-xl">Nessuna richiesta pendente</p> :
         requests.map((req) => (
          <div key={req.id} className="bg-[#001c30] border border-white/5 p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest mb-1">{req.profiles?.full_name || 'Partner'}</p>
              <p className="text-white text-xs mb-3 font-light">{req.profiles?.email}</p>
              <p className="text-slate-500 text-[9px] uppercase tracking-tighter italic">
                Richiede accesso a: <span className="text-slate-300">[{req.deals?.code}] {req.deals?.title}</span>
              </p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => handleAction(req.id, req.user_id, req.deal_id, 'rejected')} className="p-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                <X className="w-4 h-4" />
              </button>
              <button onClick={() => handleAction(req.id, req.user_id, req.deal_id, 'approved')} className="p-3 bg-[#D4AF37] text-[#001220] hover:bg-[#FBE8A6] rounded-lg transition-all">
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}