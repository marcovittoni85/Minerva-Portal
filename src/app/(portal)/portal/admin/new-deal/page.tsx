'use client';

import { useState } from 'react';
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';

export default function NewDealPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const dealData = {
      title: formData.get('title'),
      sector: formData.get('sector'),
      description: formData.get('description'),
      deal_size: Number(formData.get('deal_size')),
      minimum_ticket: Number(formData.get('minimum_ticket')),
      target_return: Number(formData.get('target_return')),
      timeline: formData.get('timeline'),
      status: 'pending'
    };

    const { error } = await supabase.from('deals').insert(dealData);

    if (!error) {
      alert("Opportunità caricata in stato PENDING");
      router.push('/portal/deals');
    } else {
      alert("Errore: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Nuova Opportunità</h1>
      
      <form onSubmit={handleSubmit} className="bg-white border rounded-[2.5rem] p-10 shadow-sm space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Titolo del Deal</label>
            <input name="title" required className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] outline-none" placeholder="es: Sviluppo Immobiliare Milano" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Settore</label>
            <select name="sector" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] uppercase font-bold text-sm outline-none">
              <option>Immobiliare</option>
              <option>Tecnologia</option>
              <option>Energia</option>
              <option>Healthcare</option>
              <option>Finance</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-400">Descrizione dell'opportunità</label>
          <textarea name="description" rows={4} className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] outline-none" placeholder="Descrivi il deal..." />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Size (€)</label>
            <input name="deal_size" type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Ticket Minimo (€)</label>
            <input name="minimum_ticket" type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Target ROI (%)</label>
            <input name="target_return" type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-[#D4AF37] outline-none" />
          </div>
        </div>

        <button disabled={loading} className="w-full bg-[#001220] text-[#D4AF37] py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
          {loading ? 'CARICAMENTO IN CORSO...' : 'CARICA OPPORTUNITÀ IN PENDING'}
        </button>
      </form>
    </div>
  );
}