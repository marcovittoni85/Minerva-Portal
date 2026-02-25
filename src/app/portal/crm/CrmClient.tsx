"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Users,
  Mail,
  Phone,
  Linkedin,
  Tag,
  Briefcase,
} from "lucide-react";

interface Contact {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  sector: string | null;
  category: string | null;
  status: string | null;
  referred_by: string | null;
  first_contact_date: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
}

interface LinkedDeal {
  deal_id: string;
  deals: { code: string; title: string } | null;
}

const categoryOptions = ["prospect", "client", "partner", "other"];
const categoryLabels: Record<string, string> = {
  prospect: "Prospect",
  client: "Cliente",
  partner: "Partner",
  other: "Altro",
};
const statusOptions = ["attivo", "inattivo"];
const statusLabels: Record<string, string> = {
  attivo: "Attivo",
  inattivo: "Inattivo",
};

const sectorOptions = [
  "Real estate & hospitality",
  "Healthcare",
  "Macchinari industriali",
  "Utility e rinnovabili",
  "Servizi finanziari",
  "Chimica",
  "Sports goods",
  "Petrolio e gas",
  "Tecnologia",
  "Food & Beverage",
  "Trasporti e logistica",
  "Media e intrattenimento",
];

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors";
const selectCls =
  "bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors";

function CategoryBadge({ cat }: { cat: string | null }) {
  if (!cat) return null;
  const colors: Record<string, string> = {
    prospect: "text-blue-600",
    client: "text-emerald-600",
    partner: "text-[#D4AF37]",
    other: "text-slate-500",
  };
  return (
    <span className={"text-[10px] font-bold uppercase tracking-wider " + (colors[cat] || "text-slate-500")}>
      {categoryLabels[cat] || cat}
    </span>
  );
}

function StatusDot({ status }: { status: string | null }) {
  const active = status === "attivo";
  return (
    <span className="flex items-center gap-1.5">
      <span className={"w-1.5 h-1.5 rounded-full " + (active ? "bg-emerald-500" : "bg-slate-300")} />
      <span className="text-xs text-slate-600">{statusLabels[status || ""] || status || "—"}</span>
    </span>
  );
}

export default function CrmClient() {
  const supabase = createClient();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [linkedDeals, setLinkedDeals] = useState<Record<string, LinkedDeal[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    full_name: "",
    company: "",
    role: "",
    sector: "",
    email: "",
    phone: "",
    linkedin: "",
    category: "prospect",
    notes: "",
  });

  const loadContacts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("crm_contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterCat) query = query.eq("category", filterCat);
    if (filterStatus) query = query.eq("status", filterStatus);

    const { data } = await query;
    setContacts(data ?? []);
    setLoading(false);
  }, [supabase, filterCat, filterStatus]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);

    if (!linkedDeals[id]) {
      const { data } = await supabase
        .from("crm_contact_deals")
        .select("deal_id, deals(code, title)")
        .eq("contact_id", id);
      setLinkedDeals((prev) => ({ ...prev, [id]: (data as LinkedDeal[] | null) ?? [] }));
    }
  };

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) return;
    setSaving(true);

    const payload: Record<string, any> = {
      full_name: form.full_name.trim(),
      category: form.category || "prospect",
      status: "attivo",
    };
    if (form.company.trim()) payload.company = form.company.trim();
    if (form.role.trim()) payload.role = form.role.trim();
    if (form.sector) payload.sector = form.sector;
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.linkedin.trim()) payload.linkedin = form.linkedin.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();

    await supabase.from("crm_contacts").insert(payload);

    setForm({ full_name: "", company: "", role: "", sector: "", email: "", phone: "", linkedin: "", category: "prospect", notes: "" });
    setShowModal(false);
    setSaving(false);
    loadContacts();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">
          Minerva Partners
        </p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">CRM</h1>
            <p className="text-slate-500 text-sm mt-2">
              Gestione contatti e relazioni
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#D4AF37] text-white px-5 py-3 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Aggiungi Contatto
          </button>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome, azienda o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className={selectCls}
        >
          <option value="">Tutte le categorie</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={selectCls}
        >
          <option value="">Tutti gli stati</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Contacts count */}
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">
        {filtered.length} contatt{filtered.length === 1 ? "o" : "i"}
      </p>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nessun contatto trovato</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_1fr_120px_100px_100px_120px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Nome</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Azienda</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Settore</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Categoria</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Stato</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Primo contatto</p>
            </div>

            {/* Rows */}
            {filtered.map((c) => {
              const isOpen = expandedId === c.id;
              const deals = linkedDeals[c.id];

              return (
                <div key={c.id} className="border-b border-slate-50 last:border-0">
                  {/* Main row */}
                  <div
                    onClick={() => toggleExpand(c.id)}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_100px_100px_120px] gap-2 md:gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors items-center"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900">{c.full_name}</p>
                        {c.role && <p className="text-[10px] text-slate-400">{c.role}</p>}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{c.company || "—"}</p>
                    <p className="text-xs text-slate-500 truncate">{c.sector || "—"}</p>
                    <CategoryBadge cat={c.category} />
                    <StatusDot status={c.status} />
                    <p className="text-xs text-slate-500">
                      {c.first_contact_date
                        ? new Date(c.first_contact_date).toLocaleDateString("it-IT", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/30 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Contact info */}
                        <div className="space-y-3">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Contatti</p>
                          {c.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={"mailto:" + c.email} className="text-sm text-slate-700 hover:text-[#D4AF37] transition-colors">
                                {c.email}
                              </a>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={"tel:" + c.phone} className="text-sm text-slate-700 hover:text-[#D4AF37] transition-colors">
                                {c.phone}
                              </a>
                            </div>
                          )}
                          {c.linkedin && (
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                              <a
                                href={c.linkedin.startsWith("http") ? c.linkedin : "https://" + c.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-slate-700 hover:text-[#D4AF37] transition-colors truncate"
                              >
                                {c.linkedin}
                              </a>
                            </div>
                          )}
                          {c.referred_by && (
                            <div className="mt-3">
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Referente</p>
                              <p className="text-sm text-slate-700">{c.referred_by}</p>
                            </div>
                          )}
                          {!c.email && !c.phone && !c.linkedin && (
                            <p className="text-xs text-slate-400 italic">Nessun contatto disponibile</p>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Note</p>
                          {c.notes ? (
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{c.notes}</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">Nessuna nota</p>
                          )}
                          {c.tags && c.tags.length > 0 && (
                            <div className="mt-3">
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Tags</p>
                              <div className="flex flex-wrap gap-1.5">
                                {c.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Linked deals */}
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Deal Collegati</p>
                          {!deals ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                          ) : deals.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Nessun deal collegato</p>
                          ) : (
                            <div className="space-y-2">
                              {deals.map((ld) => (
                                <div
                                  key={ld.deal_id}
                                  className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2"
                                >
                                  <Briefcase className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                      {ld.deals?.code || "—"}
                                    </p>
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {ld.deals?.title || "Deal"}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Nuovo Contatto
                </h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className={inputCls}
                      placeholder="es. Mario Rossi"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Azienda
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Ruolo
                    </label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={inputCls}
                      placeholder="es. CEO"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Settore
                    </label>
                    <select
                      value={form.sector}
                      onChange={(e) => setForm({ ...form, sector: e.target.value })}
                      className={inputCls}
                    >
                      <option value="">Seleziona...</option>
                      {sectorOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className={inputCls}
                    >
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>{categoryLabels[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      className={inputCls}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5">
                      Note
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Salva
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
