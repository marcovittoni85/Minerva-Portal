'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertTriangle, Plus, Linkedin } from 'lucide-react';
import { RELATIONSHIP_TYPE_CONFIG } from '@/types/relationship';

type ImportSource = 'linkedin' | 'apollo' | 'generic' | null;
type Step = 1 | 2 | 3;

interface ParsedPreview {
  headers: string[];
  rows: Record<string, string>[];
  source: ImportSource;
  totalRows: number;
  mappedFields: { label: string; csvField: string | null; found: boolean }[];
}

const REQUIRED_FIELDS = [
  { label: 'Nome', key: 'first_name' },
  { label: 'Cognome', key: 'last_name' },
  { label: 'Email', key: 'email' },
  { label: 'Azienda', key: 'company' },
  { label: 'Ruolo', key: 'job_title' },
  { label: 'LinkedIn', key: 'linkedin_url' },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  apollo: { label: 'Apollo.io', color: '#6366F1' },
  generic: { label: 'CSV Generico', color: '#64748B' },
};

// Client-side CSV parser to preview data
function parseCSVClient(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] as Record<string, string>[] };

  const firstLine = lines[0];
  const separator = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === separator && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
      else { current += char; }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  }

  const headers = parseLine(firstLine);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  }).filter(row => Object.values(row).some(v => v));

  return { headers, rows };
}

function detectSourceClient(headers: string[]): ImportSource {
  const set = new Set(headers.map(h => h.toLowerCase()));
  if (set.has('connected on') || (set.has('url') && set.has('position'))) return 'linkedin';
  if (set.has('organization name') || set.has('person linkedin url')) return 'apollo';
  return 'generic';
}

// Field mapping detection for preview
const FIELD_KEYS: Record<string, string[]> = {
  first_name: ['First Name', 'first_name', 'nome'],
  last_name: ['Last Name', 'last_name', 'cognome'],
  email: ['Email', 'Email Address', 'email', 'email_address'],
  company: ['Company', 'Organization Name', 'company', 'organization_name', 'azienda', 'società'],
  job_title: ['Position', 'Title', 'title', 'position', 'job_title', 'ruolo', 'posizione'],
  linkedin_url: ['URL', 'Person Linkedin Url', 'linkedin_url', 'linkedin'],
};

function findMappedColumn(headers: string[], fieldKey: string): string | null {
  const candidates = FIELD_KEYS[fieldKey] || [];
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  // Fuzzy
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;
  }
  return null;
}

interface ContactImporterProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ContactImporter({ open, onClose, onImported }: ContactImporterProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [dragOver, setDragOver] = useState(false);

  // Step 1
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ParsedPreview | null>(null);

  // Step 2
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [relationshipType, setRelationshipType] = useState('prospect');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Step 3
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  function reset() {
    setStep(1);
    setFile(null);
    setCsvText('');
    setPreview(null);
    setTags([]);
    setNewTag('');
    setRelationshipType('prospect');
    setSkipDuplicates(true);
    setImporting(false);
    setResult(null);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelect(f: File) {
    setFile(f);
    const text = await f.text();
    setCsvText(text);

    const { headers, rows } = parseCSVClient(text);
    const source = detectSourceClient(headers);

    const mappedFields = REQUIRED_FIELDS.map(rf => {
      const csvField = findMappedColumn(headers, rf.key);
      return { label: rf.label, csvField, found: !!csvField };
    });

    setPreview({
      headers,
      rows,
      source,
      totalRows: rows.length,
      mappedFields,
    });

    setStep(2);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv' || f.type === 'text/plain')) {
      handleFileSelect(f);
    }
  }

  function addTag() {
    const t = newTag.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setNewTag('');
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError('');
    setStep(3);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify({
        tags,
        relationship_type: relationshipType,
        skip_duplicates: skipDuplicates,
      }));

      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Errore durante l\'importazione');
      } else {
        setResult(data);
        onImported();
      }
    } catch {
      setError('Errore di connessione');
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  const sourceInfo = preview?.source ? SOURCE_LABELS[preview.source] : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Importa Contatti</h3>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="px-6 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2">
              {[
                { n: 1, label: 'Upload' },
                { n: 2, label: 'Configurazione' },
                { n: 3, label: 'Risultato' },
              ].map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors " + (
                    step >= n
                      ? 'bg-[#D4AF37] text-white'
                      : 'bg-slate-100 text-slate-400'
                  )}>
                    {step > n ? <Check size={14} /> : n}
                  </div>
                  <span className={"text-[10px] font-bold uppercase tracking-widest " + (step >= n ? 'text-slate-900' : 'text-slate-400')}>
                    {label}
                  </span>
                  {i < 2 && <div className={"flex-1 h-px " + (step > n ? 'bg-[#D4AF37]' : 'bg-slate-100')} />}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* STEP 1: Upload */}
            {step === 1 && (
              <div className="space-y-6">
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={"border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all " + (
                    dragOver ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <Upload size={40} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-700">Carica un export CSV</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Supporta export da LinkedIn, Apollo.io o un CSV generico
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Trascina qui o clicca per selezionare</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />

                {/* Source icons */}
                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Linkedin size={16} className="text-[#0A66C2]" />
                    <span>LinkedIn Export</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <div className="w-4 h-4 bg-indigo-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-[8px] font-black">A</span>
                    </div>
                    <span>Apollo.io</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <FileText size={16} className="text-slate-400" />
                    <span>CSV Generico</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Configuration */}
            {step === 2 && preview && (
              <div className="space-y-6">
                {/* File info */}
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
                  <FileText size={20} className="text-[#D4AF37] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{file?.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                      <span>{file ? `${(file.size / 1024).toFixed(0)} KB` : ''}</span>
                      <span>{preview.totalRows} righe</span>
                    </div>
                  </div>
                  {sourceInfo && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ color: sourceInfo.color, backgroundColor: sourceInfo.color + '12' }}
                    >
                      {sourceInfo.label}
                    </span>
                  )}
                </div>

                {/* Mapped fields */}
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Campi Rilevati</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {preview.mappedFields.map(mf => (
                      <div
                        key={mf.label}
                        className={"flex items-center gap-2 px-3 py-2 rounded-lg border " + (
                          mf.found ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'
                        )}
                      >
                        {mf.found ? (
                          <Check size={13} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-700">{mf.label}</span>
                        {mf.csvField && (
                          <span className="text-[10px] text-slate-400 ml-auto truncate max-w-[120px]">← {mf.csvField}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview table */}
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Anteprima (prime {Math.min(5, preview.rows.length)} righe)
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          {preview.mappedFields.filter(f => f.found).map(f => (
                            <th key={f.label} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-slate-500">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            {preview.mappedFields.filter(f => f.found).map(f => (
                              <td key={f.label} className="px-3 py-2 text-slate-700 truncate max-w-[150px]">
                                {f.csvField ? row[f.csvField] || '—' : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tag da Applicare</h4>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-medium">
                        {tag}
                        <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-slate-400 hover:text-red-500"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Es. LinkedIn Import Mar 2026"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
                    />
                    <button onClick={addTag} disabled={!newTag.trim()} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Relationship type */}
                <div>
                  <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tipo Relazione</h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Object.entries(RELATIONSHIP_TYPE_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setRelationshipType(key)}
                        className={"px-3 py-2 rounded-xl text-[10px] font-bold transition-all border " + (
                          relationshipType === key
                            ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-slate-900'
                            : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        )}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skip duplicates toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Salta duplicati</p>
                    <p className="text-[10px] text-slate-400">Ignora contatti con email o LinkedIn già esistenti</p>
                  </div>
                  <button
                    onClick={() => setSkipDuplicates(!skipDuplicates)}
                    className={"w-11 h-6 rounded-full transition-colors relative " + (skipDuplicates ? "bg-[#D4AF37]" : "bg-slate-200")}
                  >
                    <div className={"w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform " + (skipDuplicates ? "translate-x-[22px]" : "translate-x-0.5")} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Result */}
            {step === 3 && (
              <div className="space-y-6 text-center">
                {importing ? (
                  <div className="py-12">
                    <div className="w-12 h-12 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-700">Importazione in corso...</p>
                    <p className="text-xs text-slate-400 mt-1">Elaborazione di {preview?.totalRows} righe</p>
                  </div>
                ) : error ? (
                  <div className="py-12">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={28} className="text-red-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">Errore</p>
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                    <button
                      onClick={() => { setStep(2); setError(''); }}
                      className="mt-6 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
                    >
                      Torna Indietro
                    </button>
                  </div>
                ) : result ? (
                  <div className="py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <Check size={28} className="text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">Importazione Completata</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm mx-auto">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-2xl font-black text-[#D4AF37]">{result.imported}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Importati</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-2xl font-black text-slate-400">{result.skipped_duplicates}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Duplicati</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-2xl font-black text-slate-700">{result.total_rows}</p>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Totale Righe</p>
                      </div>
                    </div>

                    {sourceInfo && (
                      <p className="text-[10px] text-slate-400 mt-4">
                        Formato rilevato: <span className="font-bold" style={{ color: sourceInfo.color }}>{sourceInfo.label}</span>
                      </p>
                    )}

                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left max-w-sm mx-auto">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600 mb-1">Avvisi</p>
                        {result.errors.map((err: string, i: number) => (
                          <p key={i} className="text-xs text-amber-700">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            {step === 1 && (
              <button onClick={handleClose} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
                Annulla
              </button>
            )}
            {step === 2 && (
              <>
                <button
                  onClick={() => { setStep(1); setFile(null); setCsvText(''); setPreview(null); }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Indietro
                </button>
                <button
                  onClick={handleImport}
                  className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors flex items-center gap-2"
                >
                  <Upload size={14} /> Importa {preview?.totalRows} Contatti
                </button>
              </>
            )}
            {step === 3 && !importing && (
              <button
                onClick={handleClose}
                className="ml-auto bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors"
              >
                Chiudi
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
