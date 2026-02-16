'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { createClient } from "@/utils/supabase/client";
import Link from 'next/link';

export default function ImportPartnersPage() {
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{msg: string, type: 'success' | 'error'}[]>([]);
  const supabase = createClient();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        const rows = parseResults.data as any[];
        const newResults: any[] = [];

        for (const row of rows) {
          try {
            if (!row.email || !row.email.includes('@')) {
              newResults.push({ msg: `⚠️ Saltato: riga senza email valida`, type: 'error' });
              continue;
            }

            const email = row.email.toLowerCase().trim();
            const fullName = row.full_name || 'Partner';
            const phone = row.phone ? String(row.phone).replace(/\s+/g, '') : '';
            const role = row.role?.toLowerCase().trim() || 'partner';

            const { error } = await supabase
              .from('profiles')
              .upsert({
                email: email,
                full_name: fullName,
                phone: phone,
                role: role,
                updated_at: new Date().toISOString(),
              }, { 
                onConflict: 'email' 
              });

            if (error) throw error;
            newResults.push({ msg: `✅ Importato: ${fullName} (${email})`, type: 'success' });
          } catch (err: any) {
            newResults.push({ msg: `❌ Errore su ${row.email || 'riga'}: ${err.message}`, type: 'error' });
          }
        }
        setResults(newResults);
        setImporting(false);
      },
      error: (error) => {
        setResults([{ msg: `❌ Errore lettura file: ${error.message}`, type: 'error' }]);
        setImporting(false);
      }
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Importazione Partner</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Carica il file CSV con le colonne: <span className="text-blue-600 font-mono">email, full_name, phone, role</span>
        </p>
      </div>

      <div className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-20 text-center hover:border-[#D4AF37] transition-colors group">
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          disabled={importing} 
          className="hidden" 
          id="csv-upload" 
        />
        <label 
          htmlFor="csv-upload" 
          className="cursor-pointer bg-[#001220] text-[#D4AF37] px-12 py-6 rounded-2xl font-bold text-lg hover:bg-black transition-all inline-block shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {importing ? 'IMPORTAZIONE IN CORSO...' : 'SELEZIONA FILE CSV'}
        </label>
        <p className="mt-6 text-slate-400 font-medium group-hover:text-slate-600 transition-colors">
          Trascina qui il file o clicca per sfogliare
        </p>
      </div>

      {results.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Log Operazioni</h2>
          <div className="max-h-96 overflow-y-auto pr-4 space-y-3">
            {results.map((res, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl text-sm font-bold border ${
                  res.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                }`}
              >
                {res.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}