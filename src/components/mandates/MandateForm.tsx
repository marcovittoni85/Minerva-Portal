// ============================================================
// components/mandates/MandateForm.tsx
// Form multi-step per generazione mandato
// Design: luxury-minimal navy/gold del portale Minerva
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import {
  Building2, FileText, Coins, Scale, ClipboardList, Eye,
  ChevronRight, ChevronLeft, Plus, Trash2, Download, Loader2,
  Check, AlertCircle,
} from 'lucide-react';
import type { MandateData, MandateFeeType, ScopeSection } from '@/types/mandate';
import {
  MANDATE_FORM_STEPS, FEE_TYPE_LABELS, DEFAULT_MANDATE,
} from '@/types/mandate';

// ── Props ────────────────────────────────────────────────────
interface MandateFormProps {
  dealId: string;
  dealTitle?: string;
  initialData?: Partial<MandateData>;
  mandateId?: string;
  onSuccess?: (mandate: MandateData) => void;
}

// ── Icon map ─────────────────────────────────────────────────
const ICONS: Record<string, React.ElementType> = {
  Building2, FileText, Coins, Scale, ClipboardList, Eye,
};

// ── Styling constants ────────────────────────────────────────
const NAVY = '#001220';
const GOLD = '#D4AF37';

const inputClass = `
  w-full px-4 py-3 rounded-lg border border-slate-200
  bg-white text-slate-800 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37]
  transition-all duration-200
`.trim();

const labelClass = 'block text-sm font-medium text-slate-600 mb-1.5';

const buttonPrimary = `
  inline-flex items-center gap-2 px-6 py-3 rounded-lg
  bg-[#001220] text-white font-medium
  hover:bg-[#001220]/90 transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`.trim();

const buttonSecondary = `
  inline-flex items-center gap-2 px-6 py-3 rounded-lg
  border border-slate-200 text-slate-600 font-medium
  hover:bg-slate-50 transition-all duration-200
`.trim();

const buttonGold = `
  inline-flex items-center gap-2 px-8 py-3.5 rounded-lg
  bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white font-semibold
  hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`.trim();

// ── Component ────────────────────────────────────────────────

export default function MandateForm({
  dealId,
  dealTitle,
  initialData,
  mandateId,
  onSuccess,
}: MandateFormProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const [data, setData] = useState<MandateData>({
    ...DEFAULT_MANDATE,
    deal_id: dealId,
    ...initialData,
  } as MandateData);

  // ── Field update helper ──────────────────────────────────
  const updateField = useCallback(<K extends keyof MandateData>(
    field: K,
    value: MandateData[K]
  ) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── SOW helpers ──────────────────────────────────────────
  const updateScopeSection = (index: number, field: keyof ScopeSection, value: string | string[]) => {
    const newScope = [...data.scope_of_work];
    newScope[index] = { ...newScope[index], [field]: value };
    updateField('scope_of_work', newScope);
  };

  const addScopeSection = () => {
    updateField('scope_of_work', [...data.scope_of_work, { title: '', items: [''] }]);
  };

  const removeScopeSection = (index: number) => {
    updateField('scope_of_work', data.scope_of_work.filter((_, i) => i !== index));
  };

  const addScopeItem = (sectionIndex: number) => {
    const newScope = [...data.scope_of_work];
    newScope[sectionIndex].items.push('');
    updateField('scope_of_work', newScope);
  };

  const updateScopeItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const newScope = [...data.scope_of_work];
    newScope[sectionIndex].items[itemIndex] = value;
    updateField('scope_of_work', newScope);
  };

  const removeScopeItem = (sectionIndex: number, itemIndex: number) => {
    const newScope = [...data.scope_of_work];
    newScope[sectionIndex].items = newScope[sectionIndex].items.filter((_, i) => i !== itemIndex);
    updateField('scope_of_work', newScope);
  };

  // ── Generate mandate ─────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mandates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mandate_id: mandateId,
          mandate_data: data,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setGeneratedUrl(result.document_url);
      onSuccess?.(result.mandate);
    } catch (err: any) {
      setError(err.message || 'Errore nella generazione');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigation ───────────────────────────────────────────
  const canGoNext = step < MANDATE_FORM_STEPS.length - 1;
  const canGoPrev = step > 0;
  const isReview = step === MANDATE_FORM_STEPS.length - 1;

  // ── Step renderers ───────────────────────────────────────

  const renderStepClient = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Ragione Sociale *</label>
          <input
            className={inputClass}
            value={data.client_company_name}
            onChange={e => updateField('client_company_name', e.target.value)}
            placeholder="es. Pastificio Gentile"
          />
        </div>
        <div>
          <label className={labelClass}>Forma Giuridica</label>
          <select
            className={inputClass}
            value={data.client_legal_form}
            onChange={e => updateField('client_legal_form', e.target.value)}
          >
            <option value="Srl">Srl</option>
            <option value="SpA">SpA</option>
            <option value="Sas">Sas</option>
            <option value="Snc">Snc</option>
            <option value="Sapa">Sapa</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Nome Breve (per il contratto)</label>
        <input
          className={inputClass}
          value={data.client_short_name}
          onChange={e => updateField('client_short_name', e.target.value)}
          placeholder='es. "Pastificio Gentile" — usato come riferimento nel testo'
        />
      </div>

      <div>
        <label className={labelClass}>Sede Legale *</label>
        <input
          className={inputClass}
          value={data.client_registered_office}
          onChange={e => updateField('client_registered_office', e.target.value)}
          placeholder="es. Via Castello, 12 cap 80054, Gragnano (NA)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Codice Fiscale</label>
          <input
            className={inputClass}
            value={data.client_cf}
            onChange={e => updateField('client_cf', e.target.value)}
            placeholder="06069361217"
          />
        </div>
        <div>
          <label className={labelClass}>Partita IVA</label>
          <input
            className={inputClass}
            value={data.client_piva}
            onChange={e => updateField('client_piva', e.target.value)}
            placeholder="06069361217"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Registro Imprese di</label>
          <input
            className={inputClass}
            value={data.client_registry_office}
            onChange={e => updateField('client_registry_office', e.target.value)}
            placeholder="es. Napoli"
          />
        </div>
        <div>
          <label className={labelClass}>Numero Iscrizione</label>
          <input
            className={inputClass}
            value={data.client_registry_number}
            onChange={e => updateField('client_registry_number', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Rappresentante Legale *</label>
          <input
            className={inputClass}
            value={data.client_legal_rep_name}
            onChange={e => updateField('client_legal_rep_name', e.target.value)}
            placeholder="Nome e Cognome"
          />
        </div>
        <div>
          <label className={labelClass}>Ruolo del Rappresentante</label>
          <input
            className={inputClass}
            value={data.client_legal_rep_role}
            onChange={e => updateField('client_legal_rep_role', e.target.value)}
            placeholder="legale rappresentante"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>PEC</label>
        <input
          className={inputClass}
          type="email"
          value={data.client_pec}
          onChange={e => updateField('client_pec', e.target.value)}
          placeholder="societa@legalmail.it"
        />
      </div>
    </div>
  );

  const renderStepOperation = () => (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>Descrizione Attività Cliente *</label>
        <textarea
          className={`${inputClass} min-h-[100px]`}
          value={data.client_description}
          onChange={e => updateField('client_description', e.target.value)}
          placeholder="es. opera nel settore della produzione di pasta di alta qualità e rappresenta un'eccellenza del comparto agroalimentare italiano."
        />
        <p className="mt-1 text-xs text-slate-400">
          Questo testo appare nell&apos;Art. 1 dopo il nome del cliente.
        </p>
      </div>

      <div>
        <label className={labelClass}>Descrizione Operazione *</label>
        <textarea
          className={`${inputClass} min-h-[120px]`}
          value={data.operation_description}
          onChange={e => updateField('operation_description', e.target.value)}
          placeholder="es. intraprendere un'operazione di assistenza, consulenza e reperimento di fondi..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Importo Min (€)</label>
          <input
            className={inputClass}
            type="number"
            value={data.operation_amount_min || ''}
            onChange={e => updateField('operation_amount_min', e.target.value ? Number(e.target.value) : null)}
            placeholder="1800000"
          />
        </div>
        <div>
          <label className={labelClass}>Importo Max (€)</label>
          <input
            className={inputClass}
            type="number"
            value={data.operation_amount_max || ''}
            onChange={e => updateField('operation_amount_max', e.target.value ? Number(e.target.value) : null)}
            placeholder="2000000"
          />
        </div>
        <div>
          <label className={labelClass}>Tipo Operazione</label>
          <select
            className={inputClass}
            value={data.operation_type}
            onChange={e => updateField('operation_type', e.target.value)}
          >
            <option value="">Seleziona...</option>
            <option value="M&A">M&A</option>
            <option value="Capital Raise">Capital Raise</option>
            <option value="Debt Advisory">Debt Advisory</option>
            <option value="Equity Sale">Equity Sale</option>
            <option value="Restructuring">Restructuring</option>
            <option value="Mixed">Operazione Mista</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Scope Minerva (Premesse Art. 1.2) *</label>
        <textarea
          className={`${inputClass} min-h-[120px]`}
          value={data.minerva_scope_summary}
          onChange={e => updateField('minerva_scope_summary', e.target.value)}
          placeholder="es. (i) fornire un'approfondita attività di analisi della situazione economica e finanziaria della Società, (ii) supportare la Società nell'individuazione della migliore strategia..."
        />
        <p className="mt-1 text-xs text-slate-400">
          Descrive le competenze e attività di Minerva nelle premesse.
        </p>
      </div>
    </div>
  );

  const renderStepFees = () => (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>Struttura Compensi</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(FEE_TYPE_LABELS) as [MandateFeeType, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => updateField('fee_type', key)}
              className={`
                px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all
                ${data.fee_type === key
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#001220]'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(data.fee_type === 'retainer_success' || data.fee_type === 'flat_fee') && (
        <>
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
            <h4 className="font-semibold text-slate-700">
              {data.fee_type === 'flat_fee' ? 'Compenso Fisso' : 'Retainer Fee'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Importo (€) *</label>
                <input
                  className={inputClass}
                  type="number"
                  value={data.retainer_amount || ''}
                  onChange={e => updateField('retainer_amount', e.target.value ? Number(e.target.value) : null)}
                  placeholder="15000"
                />
              </div>
              <div>
                <label className={labelClass}>Descrizione</label>
                <input
                  className={inputClass}
                  value={data.retainer_description}
                  onChange={e => updateField('retainer_description', e.target.value)}
                  placeholder="es. Supporto Propedeutico e Valutazione"
                />
              </div>
            </div>
            {data.fee_type === 'retainer_success' && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.retainer_deductible}
                  onChange={e => updateField('retainer_deductible', e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-slate-600">
                  Retainer detraibile dalla Success Fee
                </span>
              </label>
            )}
          </div>
        </>
      )}

      {(data.fee_type === 'retainer_success' || data.fee_type === 'success_only') && (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
          <h4 className="font-semibold text-slate-700">Success Fee</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Percentuale (%) *</label>
              <input
                className={inputClass}
                type="number"
                step="0.1"
                value={data.success_fee_percentage || ''}
                onChange={e => updateField('success_fee_percentage', e.target.value ? Number(e.target.value) : null)}
                placeholder="5"
              />
            </div>
            <div>
              <label className={labelClass}>Base di Calcolo</label>
              <select
                className={inputClass}
                value={data.success_fee_base}
                onChange={e => updateField('success_fee_base', e.target.value)}
              >
                <option value="Enterprise Value">Enterprise Value (EV)</option>
                <option value="Equity Value">Equity Value</option>
                <option value="Deal Value">Deal Value (valore transazione)</option>
                <option value="Amount Raised">Amount Raised (capitale raccolto)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Condizioni Success Fee</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={data.success_fee_description}
              onChange={e => updateField('success_fee_description', e.target.value)}
              placeholder="es. La commissione maturerà in caso di effettivo perfezionamento dell'ingresso di capitale..."
            />
          </div>
        </div>
      )}

      {data.fee_type === 'custom' && (
        <div>
          <label className={labelClass}>Testo Compensi Personalizzato *</label>
          <textarea
            className={`${inputClass} min-h-[200px]`}
            value={data.custom_fee_text}
            onChange={e => updateField('custom_fee_text', e.target.value)}
            placeholder="Inserisci il testo completo della sezione compensi..."
          />
        </div>
      )}
    </div>
  );

  const renderStepTerms = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Data Inizio</label>
          <input
            className={inputClass}
            type="date"
            value={data.start_date}
            onChange={e => updateField('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Data Scadenza *</label>
          <input
            className={inputClass}
            type="date"
            value={data.expiry_date}
            onChange={e => updateField('expiry_date', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Preavviso Recesso (giorni)</label>
        <input
          className={inputClass}
          type="number"
          value={data.notice_period_days}
          onChange={e => updateField('notice_period_days', Number(e.target.value))}
        />
      </div>

      <div>
        <label className={labelClass}>Foro Competente</label>
        <input
          className={inputClass}
          value={data.jurisdiction}
          onChange={e => updateField('jurisdiction', e.target.value)}
          placeholder="Bergamo"
        />
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h4 className="font-semibold text-slate-700 mb-4">Comunicazioni (Art. 12)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Indirizzo per Comunicazioni</label>
            <input
              className={inputClass}
              value={data.client_comm_address}
              onChange={e => updateField('client_comm_address', e.target.value)}
              placeholder="Se diverso dalla sede legale"
            />
          </div>
          <div>
            <label className={labelClass}>PEC per Comunicazioni</label>
            <input
              className={inputClass}
              value={data.client_comm_pec}
              onChange={e => updateField('client_comm_pec', e.target.value)}
              placeholder="Se diversa dalla PEC societaria"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepScope = () => (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Definisci le sezioni dell&apos;allegato tecnico (Scope of Work).
        Ogni sezione ha un titolo e un elenco di attività.
      </p>

      {data.scope_of_work.map((section, si) => (
        <div
          key={si}
          className="p-5 rounded-xl border border-slate-200 bg-white space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#D4AF37]">
              Sezione {si + 1}
            </span>
            {data.scope_of_work.length > 1 && (
              <button
                type="button"
                onClick={() => removeScopeSection(si)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div>
            <label className={labelClass}>Titolo Sezione *</label>
            <input
              className={inputClass}
              value={section.title}
              onChange={e => updateScopeSection(si, 'title', e.target.value)}
              placeholder='es. Strutturazione operazioni di Liquidità (€ 1.8M - € 2.0M)'
            />
          </div>

          <div className="space-y-3">
            <label className={labelClass}>Attività</label>
            {section.items.map((item, ii) => (
              <div key={ii} className="flex items-start gap-2">
                <span className="mt-3 text-[#D4AF37]">•</span>
                <textarea
                  className={`${inputClass} min-h-[60px] flex-1`}
                  value={item}
                  onChange={e => updateScopeItem(si, ii, e.target.value)}
                  placeholder="Descrizione attività..."
                />
                {section.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScopeItem(si, ii)}
                    className="mt-3 text-red-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addScopeItem(si)}
              className="flex items-center gap-1.5 text-sm text-[#D4AF37] hover:text-[#b8962d] font-medium"
            >
              <Plus size={14} /> Aggiungi attività
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addScopeSection}
        className={`${buttonSecondary} w-full justify-center`}
      >
        <Plus size={18} /> Aggiungi Sezione SOW
      </button>

      <div>
        <label className={labelClass}>Note Aggiuntive (opzionale)</label>
        <textarea
          className={`${inputClass} min-h-[80px]`}
          value={data.scope_notes}
          onChange={e => updateField('scope_notes', e.target.value)}
          placeholder="Note in calce all'allegato..."
        />
      </div>
    </div>
  );

  const renderStepReview = () => (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewCard title="Cliente" items={[
          ['Società', `${data.client_company_name} ${data.client_legal_form}`],
          ['Rappresentante', data.client_legal_rep_name],
          ['Sede', data.client_registered_office],
          ['CF/PIVA', data.client_cf || data.client_piva || '—'],
        ]} />
        <ReviewCard title="Operazione" items={[
          ['Tipo', data.operation_type || '—'],
          ['Importo', data.operation_amount_min && data.operation_amount_max
            ? `€ ${data.operation_amount_min.toLocaleString()} - € ${data.operation_amount_max.toLocaleString()}`
            : '—'],
        ]} />
        <ReviewCard title="Compensi" items={[
          ['Struttura', FEE_TYPE_LABELS[data.fee_type]],
          ['Retainer', data.retainer_amount ? `€ ${data.retainer_amount.toLocaleString()}` : '—'],
          ['Success Fee', data.success_fee_percentage ? `${data.success_fee_percentage}%` : '—'],
          ['Base calcolo', data.success_fee_base || '—'],
        ]} />
        <ReviewCard title="Termini" items={[
          ['Scadenza', data.expiry_date ? new Date(data.expiry_date).toLocaleDateString('it-IT') : '—'],
          ['Preavviso', `${data.notice_period_days} giorni`],
          ['Foro', data.jurisdiction],
        ]} />
      </div>

      <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-3">Allegato — Scope of Work</h4>
        {data.scope_of_work.map((section, i) => (
          <div key={i} className="mb-3">
            <p className="font-medium text-slate-600">{i + 1}. {section.title}</p>
            <ul className="ml-4 text-sm text-slate-500">
              {section.items.filter(Boolean).map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-[#D4AF37]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {generatedUrl && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 text-emerald-700">
          <Check size={20} />
          <span>Mandato generato con successo!</span>
          <a
            href={generatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 font-medium hover:underline"
          >
            <Download size={16} /> Scarica DOCX
          </a>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className={buttonGold}
        >
          {loading ? (
            <><Loader2 size={20} className="animate-spin" /> Generazione in corso...</>
          ) : generatedUrl ? (
            <><Download size={20} /> Rigenera Mandato</>
          ) : (
            <><FileText size={20} /> Genera Mandato DOCX</>
          )}
        </button>
      </div>
    </div>
  );

  // ── Step renderer map ────────────────────────────────────
  const stepRenderers = [
    renderStepClient,
    renderStepOperation,
    renderStepFees,
    renderStepTerms,
    renderStepScope,
    renderStepReview,
  ];

  // ── Main render ──────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
          {mandateId ? 'Modifica Mandato' : 'Nuovo Mandato'}
        </h1>
        {dealTitle && (
          <p className="text-slate-500 mt-1">Deal: {dealTitle}</p>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {MANDATE_FORM_STEPS.map((s, i) => {
          const Icon = ICONS[s.icon] || FileText;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                whitespace-nowrap transition-all duration-200
                ${isActive
                  ? 'bg-[#001220] text-white shadow-lg'
                  : isDone
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
              `}
            >
              {isDone ? <Check size={16} /> : <Icon size={16} />}
              <span className="hidden md:inline">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step content card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
            {MANDATE_FORM_STEPS[step].title}
          </h2>
          <p className="text-sm text-slate-400">
            {MANDATE_FORM_STEPS[step].subtitle}
          </p>
        </div>

        {stepRenderers[step]()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={!canGoPrev}
          className={buttonSecondary}
          style={{ visibility: canGoPrev ? 'visible' : 'hidden' }}
        >
          <ChevronLeft size={18} /> Indietro
        </button>
        {canGoNext && (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            className={buttonPrimary}
          >
            Avanti <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Review card sub-component ────────────────────────────────

function ReviewCard({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
      <h4 className="text-sm font-semibold text-[#D4AF37] mb-2">{title}</h4>
      <div className="space-y-1">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-700 font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
