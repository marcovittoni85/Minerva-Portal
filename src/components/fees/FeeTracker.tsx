// ============================================================
// components/fees/FeeTracker.tsx
// Tracker fee streams per deal — pannello completo
// Mostra: summary cards, fee streams, pagamenti, distribuzioni
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Trophy, Briefcase, Plus, Download as DownloadIcon,
  ChevronDown, ChevronUp, CreditCard, Users, ArrowRight,
  Loader2, AlertCircle, FileText, TrendingUp, BarChart3,
  Receipt, CircleDollarSign, PieChart, Check, Clock, X,
} from 'lucide-react';
import type {
  FeeStream, FeePayment, FeeDistribution, FeeDashboardSummary,
  FeeStreamType, FeeStreamStatus, FeePaymentStatus,
} from '@/types/fee-stream';
import {
  FEE_TYPE_CONFIG, FEE_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, DISTRIBUTION_ROLES,
} from '@/types/fee-stream';

// ── Props ────────────────────────────────────────────────────
interface FeeTrackerProps {
  dealId: string;
  dealTitle?: string;
  mandateId?: string;      // Per importare fee da mandato
}

// ── Styling ──────────────────────────────────────────────────
const NAVY = '#001220';
const GOLD = '#D4AF37';

const cardClass = 'bg-white rounded-2xl border border-slate-100 shadow-sm';
const inputClass = `
  w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm
  text-slate-800 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]
  transition-all
`.trim();
const labelClass = 'block text-xs font-medium text-slate-500 mb-1';
const btnPrimary = `
  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
  bg-[#001220] text-white hover:bg-[#001220]/90 transition-all
  disabled:opacity-50 disabled:cursor-not-allowed
`.trim();
const btnGold = `
  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
  bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white
  hover:shadow-md hover:shadow-[#D4AF37]/20 transition-all
  disabled:opacity-50
`.trim();
const btnSecondary = `
  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
  border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all
`.trim();

function formatEuro(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatEuroFull(amount: number | null | undefined): string {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR',
  }).format(amount);
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Main Component ───────────────────────────────────────────

export default function FeeTracker({ dealId, dealTitle, mandateId }: FeeTrackerProps) {
  const [feeStreams, setFeeStreams] = useState<FeeStream[]>([]);
  const [summary, setSummary] = useState<FeeDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedStream, setExpandedStream] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/fees?deal_id=${dealId}`);
      const data = await res.json();
      setFeeStreams(data.fee_streams || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Import da mandato
  const handleImportFromMandate = async () => {
    if (!mandateId) return;
    setImporting(true);
    try {
      const res = await fetch('/api/fees/import-from-mandate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandate_id: mandateId }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  // Calcolo progress
  const totalProjected = summary?.total_projected || 0;
  const totalCollected = summary?.total_collected || 0;
  const collectionRate = totalProjected > 0 ? (totalCollected / totalProjected) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: NAVY }}>Fee Streams</h2>
          {dealTitle && <p className="text-sm text-slate-400 mt-0.5">{dealTitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {mandateId && feeStreams.length === 0 && (
            <button onClick={handleImportFromMandate} disabled={importing} className={btnGold}>
              {importing ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Importa da Mandato
            </button>
          )}
          <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
            <Plus size={16} /> Aggiungi Fee
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            icon={<TrendingUp size={20} />}
            label="Previste"
            value={formatEuro(summary.total_projected)}
            color="text-slate-600"
            bgIcon="bg-slate-100"
          />
          <SummaryCard
            icon={<BarChart3 size={20} />}
            label="Maturate"
            value={formatEuro(summary.total_accrued)}
            color="text-blue-600"
            bgIcon="bg-blue-50"
          />
          <SummaryCard
            icon={<Receipt size={20} />}
            label="Fatturate"
            value={formatEuro(summary.total_invoiced)}
            color="text-purple-600"
            bgIcon="bg-purple-50"
          />
          <SummaryCard
            icon={<CircleDollarSign size={20} />}
            label="Incassate"
            value={formatEuro(summary.total_collected)}
            color="text-emerald-600"
            bgIcon="bg-emerald-50"
            extra={
              totalProjected > 0 ? (
                <div className="mt-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(collectionRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {collectionRate.toFixed(0)}% incassato
                  </span>
                </div>
              ) : null
            }
          />
        </div>
      )}

      {/* Fee Streams List */}
      {feeStreams.length === 0 ? (
        <div className={`${cardClass} p-12 text-center`}>
          <PieChart size={48} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 mb-2">Nessuna fee registrata per questo deal</p>
          <p className="text-xs text-slate-300">
            {mandateId
              ? 'Clicca "Importa da Mandato" per creare automaticamente le fee dal contratto.'
              : 'Clicca "Aggiungi Fee" per registrare la prima fee.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feeStreams.map(stream => (
            <FeeStreamCard
              key={stream.id}
              stream={stream}
              isExpanded={expandedStream === stream.id}
              onToggle={() => setExpandedStream(
                expandedStream === stream.id ? null : stream.id
              )}
              onUpdate={fetchData}
            />
          ))}
        </div>
      )}

      {/* Add Fee Form Modal */}
      {showAddForm && (
        <AddFeeStreamModal
          dealId={dealId}
          onClose={() => setShowAddForm(false)}
          onCreated={() => { setShowAddForm(false); fetchData(); }}
        />
      )}
    </div>
  );
}

// ── Summary Card ────────────────────────────────────────────

function SummaryCard({
  icon, label, value, color, bgIcon, extra,
}: {
  icon: React.ReactNode; label: string; value: string;
  color: string; bgIcon: string; extra?: React.ReactNode;
}) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`${bgIcon} p-2 rounded-lg ${color}`}>{icon}</div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {extra}
    </div>
  );
}

// ── Fee Stream Card ─────────────────────────────────────────

function FeeStreamCard({
  stream, isExpanded, onToggle, onUpdate,
}: {
  stream: FeeStream; isExpanded: boolean;
  onToggle: () => void; onUpdate: () => void;
}) {
  const typeConf = FEE_TYPE_CONFIG[stream.fee_type];
  const statusConf = FEE_STATUS_CONFIG[stream.status];
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDistribForm, setShowDistribForm] = useState(false);
  const [editingBase, setEditingBase] = useState(false);
  const [baseAmount, setBaseAmount] = useState(stream.base_amount?.toString() || '');

  // Calcola progress bar
  const target = stream.accrued_amount || stream.projected_amount || 0;
  const collected = stream.collected_amount || 0;
  const progress = target > 0 ? (collected / target) * 100 : 0;

  // Aggiorna base amount (per success fee)
  const handleUpdateBase = async () => {
    const numBase = parseFloat(baseAmount);
    if (isNaN(numBase)) return;

    const accrued = stream.percentage
      ? Math.round(numBase * (stream.percentage / 100) * 100) / 100
      : null;

    await fetch('/api/fees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: stream.id,
        base_amount: numBase,
        accrued_amount: accrued,
        status: 'accrued',
        accrual_date: new Date().toISOString().split('T')[0],
      }),
    });
    setEditingBase(false);
    onUpdate();
  };

  return (
    <div className={`${cardClass} overflow-hidden`}>
      {/* Header row */}
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Type icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${typeConf.color}15`, color: typeConf.color }}
          >
            {stream.fee_type === 'retainer' && <Wallet size={20} />}
            {stream.fee_type === 'success' && <Trophy size={20} />}
            {stream.fee_type === 'advisory' && <Briefcase size={20} />}
            {!['retainer', 'success', 'advisory'].includes(stream.fee_type) && <CreditCard size={20} />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-[#001220] truncate">{stream.label}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                ${statusConf.bgColor} ${statusConf.color}
              `}>
                {statusConf.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {stream.percentage && (
                <span>{stream.percentage}% su {stream.calculation_base}</span>
              )}
              {stream.deduction_amount > 0 && (
                <span className="text-amber-500">
                  Deduzione: {formatEuro(stream.deduction_amount)}
                </span>
              )}
            </div>
          </div>

          {/* Amounts */}
          <div className="text-right mr-4">
            <p className="text-lg font-bold" style={{ color: NAVY }}>
              {formatEuro(stream.accrued_amount || stream.projected_amount)}
            </p>
            {stream.collected_amount > 0 && (
              <p className="text-xs text-emerald-600">
                Incassato: {formatEuro(stream.collected_amount)}
              </p>
            )}
          </div>

          {/* Progress mini */}
          <div className="w-20 hidden md:block">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progress >= 100 ? '#10B981' : GOLD,
                }}
              />
            </div>
          </div>

          {isExpanded ? <ChevronUp size={18} className="text-slate-300" /> : <ChevronDown size={18} className="text-slate-300" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-slate-50 p-5 bg-slate-50/30 space-y-5">
          {/* Success Fee: calcolo base */}
          {stream.fee_type === 'success' && stream.percentage && (
            <div className="p-4 rounded-xl bg-white border border-slate-100">
              <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                <BarChart3 size={14} /> Calcolo Success Fee
              </h4>
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className={labelClass}>{stream.calculation_base} (€)</label>
                  {editingBase ? (
                    <input
                      className={inputClass}
                      type="number"
                      value={baseAmount}
                      onChange={e => setBaseAmount(e.target.value)}
                      placeholder="es. 10000000"
                      autoFocus
                    />
                  ) : (
                    <p className="text-lg font-semibold text-[#001220]">
                      {stream.base_amount ? formatEuro(stream.base_amount) : 'Da definire'}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-2xl text-slate-300">×</span>
                  <p className="text-lg font-semibold text-[#D4AF37]">{stream.percentage}%</p>
                </div>
                <div>
                  <label className={labelClass}>Fee Maturata</label>
                  <p className="text-lg font-bold text-emerald-600">
                    {stream.accrued_amount ? formatEuroFull(stream.accrued_amount) : '—'}
                  </p>
                  {stream.deduction_amount > 0 && (
                    <p className="text-xs text-amber-500">
                      - {formatEuro(stream.deduction_amount)} (retainer dedotto)
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                {editingBase ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingBase(false)} className={btnSecondary}>
                      <X size={14} /> Annulla
                    </button>
                    <button onClick={handleUpdateBase} className={btnGold}>
                      <Check size={14} /> Calcola e Salva
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingBase(true)} className={btnSecondary}>
                    Inserisci {stream.calculation_base}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payments section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Receipt size={14} /> Pagamenti ({stream.payments?.length || 0})
              </h4>
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="text-xs text-[#D4AF37] hover:text-[#b8962d] font-medium flex items-center gap-1"
              >
                <Plus size={12} /> Registra Pagamento
              </button>
            </div>

            {stream.payments && stream.payments.length > 0 ? (
              <div className="space-y-2">
                {stream.payments.map(payment => (
                  <PaymentRow key={payment.id} payment={payment} onUpdate={onUpdate} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300 py-2">Nessun pagamento registrato</p>
            )}

            {showPaymentForm && (
              <PaymentForm
                feeStreamId={stream.id}
                vatRate={stream.vat_rate}
                onClose={() => setShowPaymentForm(false)}
                onCreated={() => { setShowPaymentForm(false); onUpdate(); }}
              />
            )}
          </div>

          {/* Distributions section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Users size={14} /> Distribuzione Waterfall ({stream.distributions?.length || 0})
              </h4>
              <button
                onClick={() => setShowDistribForm(!showDistribForm)}
                className="text-xs text-[#D4AF37] hover:text-[#b8962d] font-medium flex items-center gap-1"
              >
                <Plus size={12} /> Aggiungi Quota
              </button>
            </div>

            {stream.distributions && stream.distributions.length > 0 ? (
              <div className="space-y-2">
                {stream.distributions.map(dist => (
                  <DistributionRow key={dist.id} distribution={dist} />
                ))}
                {/* Total check */}
                <div className="flex justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">Totale allocato</span>
                  <span className={`font-semibold ${
                    stream.distributions.reduce((s, d) => s + d.percentage, 0) === 100
                      ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {stream.distributions.reduce((s, d) => s + d.percentage, 0)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 py-2">Nessuna distribuzione configurata</p>
            )}

            {showDistribForm && (
              <DistributionForm
                feeStreamId={stream.id}
                onClose={() => setShowDistribForm(false)}
                onCreated={() => { setShowDistribForm(false); onUpdate(); }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payment Row ─────────────────────────────────────────────

function PaymentRow({ payment, onUpdate }: { payment: FeePayment; onUpdate: () => void }) {
  const statusConf = PAYMENT_STATUS_CONFIG[payment.status];

  const markAsPaid = async () => {
    await fetch('/api/fees/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payment.id,
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
      }),
    });
    onUpdate();
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 text-sm">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusConf.bgColor} ${statusConf.color}`}>
          {statusConf.label}
        </span>
        {payment.invoice_number && (
          <span className="text-slate-500">Fatt. {payment.invoice_number}</span>
        )}
        <span className="text-slate-400">{formatDate(payment.invoice_date || payment.created_at)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[#001220]">{formatEuroFull(payment.total_amount)}</span>
        {payment.status === 'pending' && (
          <button
            onClick={markAsPaid}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <Check size={12} /> Incassato
          </button>
        )}
      </div>
    </div>
  );
}

// ── Distribution Row ────────────────────────────────────────

function DistributionRow({ distribution }: { distribution: FeeDistribution }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-100 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
          {distribution.recipient_name.charAt(0)}
        </div>
        <div>
          <span className="font-medium text-slate-700">{distribution.recipient_name}</span>
          {distribution.recipient_role && (
            <span className="text-xs text-slate-400 ml-2">{distribution.recipient_role}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <span className="text-[#D4AF37] font-semibold">{distribution.percentage}%</span>
        <span className="text-slate-600 font-medium min-w-[80px]">
          {formatEuro(distribution.calculated_amount)}
        </span>
        {distribution.is_paid ? (
          <span className="text-emerald-500 text-xs flex items-center gap-1">
            <Check size={12} /> Pagato
          </span>
        ) : (
          <span className="text-slate-300 text-xs flex items-center gap-1">
            <Clock size={12} /> Pending
          </span>
        )}
      </div>
    </div>
  );
}

// ── Payment Form ────────────────────────────────────────────

function PaymentForm({
  feeStreamId, vatRate, onClose, onCreated,
}: {
  feeStreamId: string; vatRate: number;
  onClose: () => void; onCreated: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const vatAmount = Math.round(numAmount * (vatRate / 100) * 100) / 100;
  const totalAmount = numAmount + vatAmount;

  const handleSubmit = async () => {
    if (!numAmount) return;
    setSaving(true);
    try {
      await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee_stream_id: feeStreamId,
          amount: numAmount,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          invoice_number: invoiceNumber || null,
          invoice_date: invoiceDate || null,
          due_date: dueDate || null,
          status: 'pending',
        }),
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-[#D4AF37]/20 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={labelClass}>Importo netto (€) *</label>
          <input className={inputClass} type="number" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="15000" autoFocus />
        </div>
        <div>
          <label className={labelClass}>IVA ({vatRate}%)</label>
          <input className={inputClass} type="text" value={formatEuroFull(vatAmount)} disabled />
        </div>
        <div>
          <label className={labelClass}>Totale</label>
          <input className={`${inputClass} font-semibold`} type="text" value={formatEuroFull(totalAmount)} disabled />
        </div>
        <div>
          <label className={labelClass}>N. Fattura</label>
          <input className={inputClass} value={invoiceNumber}
            onChange={e => setInvoiceNumber(e.target.value)} placeholder="2024/001" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Data Fattura</label>
          <input className={inputClass} type="date" value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Scadenza Pagamento</label>
          <input className={inputClass} type="date" value={dueDate}
            onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>Annulla</button>
        <button onClick={handleSubmit} disabled={saving || !numAmount} className={btnGold}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
          Registra
        </button>
      </div>
    </div>
  );
}

// ── Distribution Form ───────────────────────────────────────

function DistributionForm({
  feeStreamId, onClose, onCreated,
}: {
  feeStreamId: string; onClose: () => void; onCreated: () => void;
}) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('Originator');
  const [percentage, setPercentage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!recipientName || !percentage) return;
    setSaving(true);
    try {
      await fetch('/api/fees/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee_stream_id: feeStreamId,
          recipient_name: recipientName,
          recipient_role: recipientRole,
          percentage: parseFloat(percentage),
        }),
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-4 rounded-xl bg-white border border-[#D4AF37]/20 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Nome Beneficiario *</label>
          <input className={inputClass} value={recipientName}
            onChange={e => setRecipientName(e.target.value)} placeholder="Nome e Cognome" autoFocus />
        </div>
        <div>
          <label className={labelClass}>Ruolo</label>
          <select className={inputClass} value={recipientRole}
            onChange={e => setRecipientRole(e.target.value)}>
            {DISTRIBUTION_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Quota (%)</label>
          <input className={inputClass} type="number" step="0.5" value={percentage}
            onChange={e => setPercentage(e.target.value)} placeholder="25" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className={btnSecondary}>Annulla</button>
        <button onClick={handleSubmit} disabled={saving || !recipientName || !percentage} className={btnGold}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
          Aggiungi
        </button>
      </div>
    </div>
  );
}

// ── Add Fee Stream Modal ────────────────────────────────────

function AddFeeStreamModal({
  dealId, onClose, onCreated,
}: {
  dealId: string; onClose: () => void; onCreated: () => void;
}) {
  const [feeType, setFeeType] = useState<FeeStreamType>('retainer');
  const [label, setLabel] = useState('');
  const [projectedAmount, setProjectedAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [calcBase, setCalcBase] = useState('Enterprise Value');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: dealId,
          fee_type: feeType,
          label: label || FEE_TYPE_CONFIG[feeType].label,
          projected_amount: projectedAmount ? parseFloat(projectedAmount) : null,
          percentage: percentage ? parseFloat(percentage) : null,
          calculation_base: feeType === 'success' ? calcBase : null,
          vat_rate: 22.00,
          status: 'projected',
        }),
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: NAVY }}>Nuova Fee</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Fee type selection */}
        <div>
          <label className={labelClass}>Tipo Fee</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(FEE_TYPE_CONFIG) as [FeeStreamType, typeof FEE_TYPE_CONFIG[FeeStreamType]][])
              .slice(0, 6)
              .map(([key, conf]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setFeeType(key);
                    if (!label) setLabel(conf.label);
                  }}
                  className={`
                    px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all text-center
                    ${feeType === key
                      ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'}
                  `}
                >
                  {conf.label}
                </button>
              ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Etichetta</label>
          <input className={inputClass} value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={FEE_TYPE_CONFIG[feeType].label} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Importo Previsto (€)</label>
            <input className={inputClass} type="number" value={projectedAmount}
              onChange={e => setProjectedAmount(e.target.value)} placeholder="15000" />
          </div>
          {(feeType === 'success') && (
            <>
              <div>
                <label className={labelClass}>Percentuale (%)</label>
                <input className={inputClass} type="number" step="0.1" value={percentage}
                  onChange={e => setPercentage(e.target.value)} placeholder="5" />
              </div>
            </>
          )}
        </div>

        {feeType === 'success' && (
          <div>
            <label className={labelClass}>Base di Calcolo</label>
            <select className={inputClass} value={calcBase}
              onChange={e => setCalcBase(e.target.value)}>
              <option>Enterprise Value</option>
              <option>Equity Value</option>
              <option>Deal Value</option>
              <option>Amount Raised</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className={btnSecondary}>Annulla</button>
          <button onClick={handleSubmit} disabled={saving} className={btnGold}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Crea Fee Stream
          </button>
        </div>
      </div>
    </div>
  );
}
