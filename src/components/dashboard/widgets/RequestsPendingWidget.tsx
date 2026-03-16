'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import { createClient } from '@/utils/supabase/client';

interface Props { config: WidgetConfig; }

export default function RequestsPendingWidget({ config }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      try {
        const { data } = await supabase
          .from('access_requests')
          .select('id, created_at, profiles!user_id(full_name), deals(title)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(config.limit || 5);
        setRequests(data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={requests.length === 0} emptyMessage="Nessuna richiesta pendente">
      <div className="divide-y divide-slate-50">
        {requests.map(req => (
          <div key={req.id} className="px-5 py-3">
            <p className="text-sm font-medium text-slate-900">{(req.profiles as any)?.full_name || 'Utente'}</p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              <span>{(req.deals as any)?.title || 'Deal'}</span>
              <span>{new Date(req.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
