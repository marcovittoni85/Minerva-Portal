// ============================================================
// components/mandates/MandateList.tsx
// Lista mandati admin con gestione status e download
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import {
  FileText, Download, Eye, Clock, Check, Send,
  PenLine, XCircle, MoreHorizontal, Filter,
} from 'lucide-react';
import { MANDATE_STATUS_CONFIG, type MandateStatus } from '@/types/mandate';

interface MandateListItem {
  id: string;
  deal_id: string;
  status: MandateStatus;
  client_company_name: string;
  client_legal_form: string;
  client_short_name: string;
  fee_type: string;
  retainer_amount: number | null;
  success_fee_percentage: number | null;
  expiry_date: string;
  document_url: string | null;
  document_version: number;
  created_at: string;
  updated_at: string;
  deal?: { id: string; title: string; category: string };
  creator?: { id: string; full_name: string };
}

interface MandateListProps {
  dealId?: string;           // Se specifico per un deal
  onEdit?: (id: string) => void;
  onNew?: (dealId: string) => void;
}

const STATUS_ACTIONS: Record<MandateStatus, { next: MandateStatus[]; icon: React.ElementType }[]> = {
  draft:    [{ next: ['pending'], icon: Send }],
  pending:  [{ next: ['approved'], icon: Check }, { next: ['draft'], icon: PenLine }],
  approved: [{ next: ['sent'], icon: Send }],
  sent:     [{ next: ['signed'], icon: Check }],
  signed:   [],
  expired:  [],
  revoked:  [],
};

export default function MandateList({ dealId, onEdit, onNew }: MandateListProps) {
  const [mandates, setMandates] = useState<MandateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<MandateStatus | 'all'>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchMandates();
  }, [dealId]);

  const fetchMandates = async () => {
    try {
      const url = dealId
        ? `/api/mandates?deal_id=${dealId}`
        : '/api/mandates';
      const res = await fetch(url);
      const data = await res.json();
      setMandates(data.mandates || []);
    } catch (err) {
      console.error('Error fetching mandates:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (mandateId: string, newStatus: MandateStatus) => {
    try {
      const res = await fetch('/api/mandates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandate_id: mandateId, status: newStatus }),
      });

      if (res.ok) {
        setMandates(prev =>
          prev.map(m => m.id === mandateId ? { ...m, status: newStatus } : m)
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
    setActionMenuId(null);
  };

  const filtered = filterStatus === 'all'
    ? mandates
    : mandates.filter(m => m.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <div className="flex gap-2">
            <FilterPill
              active={filterStatus === 'all'}
              onClick={() => setFilterStatus('all')}
              label="Tutti"
              count={mandates.length}
            />
            {(['draft', 'pending', 'approved', 'sent', 'signed'] as MandateStatus[]).map(s => {
              const count = mandates.filter(m => m.status === s).length;
              if (count === 0) return null;
              return (
                <FilterPill
                  key={s}
                  active={filterStatus === s}
                  onClick={() => setFilterStatus(s)}
                  label={MANDATE_STATUS_CONFIG[s].label}
                  count={count}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Mandate cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>Nessun mandato trovato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(mandate => {
            const statusConf = MANDATE_STATUS_CONFIG[mandate.status];
            return (
              <div
                key={mandate.id}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[#001220]">
                        {mandate.client_short_name || mandate.client_company_name} {mandate.client_legal_form}
                      </h3>
                      <span className={`
                        px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${statusConf.bgColor} ${statusConf.color}
                      `}>
                        {statusConf.label}
                      </span>
                      <span className="text-xs text-slate-300">
                        v{mandate.document_version}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {mandate.deal && (
                        <span>Deal: {mandate.deal.title}</span>
                      )}
                      {mandate.retainer_amount && (
                        <span>Retainer: € {mandate.retainer_amount.toLocaleString()}</span>
                      )}
                      {mandate.success_fee_percentage && (
                        <span>SF: {mandate.success_fee_percentage}%</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Scad. {new Date(mandate.expiry_date).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {mandate.document_url && (
                      <a
                        href={mandate.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#D4AF37] transition-colors"
                        title="Scarica DOCX"
                      >
                        <Download size={18} />
                      </a>
                    )}

                    {onEdit && (
                      <button
                        onClick={() => onEdit(mandate.id)}
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-[#001220] transition-colors"
                        title="Modifica"
                      >
                        <PenLine size={18} />
                      </button>
                    )}

                    {/* Status actions */}
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(
                          actionMenuId === mandate.id ? null : mandate.id
                        )}
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {actionMenuId === mandate.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 min-w-[180px]">
                          {getNextStatuses(mandate.status).map(nextStatus => {
                            const conf = MANDATE_STATUS_CONFIG[nextStatus];
                            return (
                              <button
                                key={nextStatus}
                                onClick={() => updateStatus(mandate.id, nextStatus)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 text-left"
                              >
                                <span className={`w-2 h-2 rounded-full ${conf.bgColor}`} />
                                Segna come: {conf.label}
                              </button>
                            );
                          })}
                          {mandate.status !== 'revoked' && mandate.status !== 'signed' && (
                            <button
                              onClick={() => updateStatus(mandate.id, 'revoked')}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-500 text-left border-t border-slate-50"
                            >
                              <XCircle size={14} /> Revoca Mandato
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function getNextStatuses(current: MandateStatus): MandateStatus[] {
  const transitions: Record<MandateStatus, MandateStatus[]> = {
    draft:    ['pending'],
    pending:  ['approved', 'draft'],
    approved: ['sent'],
    sent:     ['signed'],
    signed:   [],
    expired:  [],
    revoked:  [],
  };
  return transitions[current] || [];
}

function FilterPill({
  active, onClick, label, count,
}: {
  active: boolean; onClick: () => void; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium transition-all
        ${active
          ? 'bg-[#001220] text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
      `}
    >
      {label} ({count})
    </button>
  );
}
