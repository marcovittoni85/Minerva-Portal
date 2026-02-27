// ============================================================
// app/portal/mandates/page.tsx
// Pagina admin per gestione mandati
// ============================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, ArrowLeft } from 'lucide-react';
import MandateForm from '@/components/mandates/MandateForm';
import MandateList from '@/components/mandates/MandateList';

type View = 'list' | 'new' | 'edit';

function MandatesContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>('list');
  const [editMandateId, setEditMandateId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [dealTitle, setDealTitle] = useState<string>('');

  // Handle URL params: ?deal_id=xxx&deal_title=xxx
  useEffect(() => {
    const dealId = searchParams.get('deal_id');
    const title = searchParams.get('deal_title');
    if (dealId) {
      setSelectedDealId(dealId);
      if (title) setDealTitle(title);
      setView('new');
    }
  }, [searchParams]);

  const handleEdit = (id: string) => {
    setEditMandateId(id);
    setView('edit');
  };

  const handleNew = () => {
    setEditMandateId(null);
    setView('new');
  };

  const handleBack = () => {
    setView('list');
    setEditMandateId(null);
    setSelectedDealId('');
    setDealTitle('');
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {view === 'list' ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-[#001220]">Mandati</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Genera e gestisci i contratti di consulenza
                </p>
              </div>
              <button
                onClick={handleNew}
                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                  bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white font-medium
                  hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all
                "
              >
                <Plus size={18} /> Nuovo Mandato
              </button>
            </div>

            <MandateList
              onEdit={handleEdit}
              onNew={(dealId) => {
                setSelectedDealId(dealId);
                handleNew();
              }}
            />
          </>
        ) : (
          <>
            {/* Back button */}
            <button
              onClick={handleBack}
              className="
                flex items-center gap-2 text-sm text-slate-400
                hover:text-[#001220] transition-colors mb-6
              "
            >
              <ArrowLeft size={16} /> Torna alla lista
            </button>

            {/* Form */}
            <MandateForm
              dealId={selectedDealId || editMandateId || ''}
              dealTitle={dealTitle || undefined}
              mandateId={editMandateId || undefined}
              onSuccess={() => {
                // Resta sulla form per scaricare
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function MandatesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    }>
      <MandatesContent />
    </Suspense>
  );
}
