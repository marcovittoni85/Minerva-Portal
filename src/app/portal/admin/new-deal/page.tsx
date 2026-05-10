'use client';

import { useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { Upload, Sparkles, AlertCircle } from 'lucide-react';

export default function NewDealPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoBlindFiles, setAutoBlindFiles] = useState<File[]>([]);
  const [generating, setGenerating] = useState(false);
  const [blindData, setBlindData] = useState<any>(null);
  const [missingFields, setMissingFields] = useState<any[]>([]);

  const handleAutoBlind = async () => {
    if (autoBlindFiles.length === 0) return;
    setGenerating(true);

    const formData = new FormData();
    autoBlindFiles.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/deals/auto-blind', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        alert('Errore generazione Blind: ' + await res.text());
        setGenerating(false);
        return;
      }

      const { blind } = await res.json();
      setBlindData(blind);
      setMissingFields(blind.campi_mancanti ?? []);
    } catch (e: any) {
      alert('Errore: ' + e.message);
    }
    setGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const dealData = {
      title: blindData?.blind_title || formData.get('title'),
      sector: blindData?.settore || formData.get('sector'),
      description: formData.get('description'),
      blind_description: blindData?.blind_description || undefined,
      geography: blindData?.area_geografica || undefined,
      ev_range: blindData?.range_fatturato || undefined,
      deal_size: Number(formData.get('deal_size')) || undefined,
      minimum_ticket: Number(formData.get('minimum_ticket')) || undefined,
      target_return: Number(formData.get('target_return')) || undefined,
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

      {/* Auto-Blind Section */}
      <div className="bg-white border border-[#D4AF37]/30 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Genera Blind da documenti</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Carica IM, teaser, bilanci, presentazioni. L'AI estrae dati e pre-popola il deal anonimizzato.
        </p>

        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mb-4 hover:border-[#D4AF37]/40 transition-colors">
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.xlsx"
            onChange={e => setAutoBlindFiles(Array.from(e.target.files ?? []))}
            className="hidden"
            id="auto-blind-upload"
          />
          <label htmlFor="auto-blind-upload" className="cursor-pointer text-sm text-[#D4AF37] hover:underline font-medium">
            Seleziona files (PDF, DOCX, PPT, XLSX)
          </label>
          {autoBlindFiles.length > 0 && (
            <div className="mt-3 text-xs text-slate-500">
              {autoBlindFiles.length} file selezionati: {autoBlindFiles.map(f => f.name).join(', ')}
            </div>
          )}
        </div>

        <button
          onClick={handleAutoBlind}
          disabled={autoBlindFiles.length === 0 || generating}
          className="w-full bg-[#D4AF37] text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50"
        >
          {generating ? 'Estrazione in corso...' : 'Estrai dati e genera Blind'}
        </button>
      </div>

      {/* AI Extracted Data */}
      {blindData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-3">Dati estratti dall'AI</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-emerald-600">Settore:</span> <span className="font-medium">{blindData.settore}</span></div>
            <div><span className="text-emerald-600">Area:</span> <span className="font-medium">{blindData.area_geografica}</span></div>
            <div><span className="text-emerald-600">Fatturato:</span> <span className="font-medium">{blindData.range_fatturato}</span></div>
            <div><span className="text-emerald-600">EBITDA:</span> <span className="font-medium">{blindData.range_ebitda}</span></div>
            <div><span className="text-emerald-600">Operazione:</span> <span className="font-medium">{blindData.tipo_operazione}</span></div>
          </div>
          <div className="mt-3 text-sm">
            <p className="text-emerald-600 font-medium">Titolo blind:</p>
            <p className="text-slate-700">{blindData.blind_title}</p>
          </div>
          <div className="mt-2 text-sm">
            <p className="text-emerald-600 font-medium">Descrizione blind:</p>
            <p className="text-slate-700">{blindData.blind_description}</p>
          </div>
          <p className="text-[10px] text-emerald-500 mt-3">Questi dati saranno pre-popolati nel form sottostante. Puoi modificarli prima del salvataggio.</p>
        </div>
      )}

      {/* Missing Fields Warning */}
      {missingFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <h3 className="text-sm font-bold text-amber-700">Documenti suggeriti mancanti</h3>
          </div>
          <ul className="space-y-1 text-sm text-amber-600">
            {missingFields.map((f: any, i: number) => (
              <li key={i}>
                <strong>{f.campo}</strong>: {f.motivo} &rarr; {f.documento_suggerito}
              </li>
            ))}
          </ul>
        </div>
      )}
      
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