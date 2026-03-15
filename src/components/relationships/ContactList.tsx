'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Contact,
  ContactRelationshipType,
  RelationshipStrength,
  STRENGTH_CONFIG,
  RELATIONSHIP_TYPE_CONFIG,
  INTERACTION_TYPE_CONFIG,
  InteractionType,
} from '@/types/relationship';
import AddInteractionForm from './AddInteractionForm';
import {
  Search, Plus, ArrowUpDown, X, Filter, ChevronDown,
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal, Tag,
} from 'lucide-react';

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Mai';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g fa`;
  const months = Math.floor(days / 30);
  return `${months} mesi fa`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal,
};

export default function ContactList() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [strengthFilter, setStrengthFilter] = useState<RelationshipStrength | ''>('');
  const [typeFilter, setTypeFilter] = useState<ContactRelationshipType | ''>('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'last_interaction'>('score');

  // Modals
  const [showNewContact, setShowNewContact] = useState(false);
  const [interactionContactId, setInteractionContactId] = useState<string | null>(null);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);

  // New contact form
  const [newContact, setNewContact] = useState({
    first_name: '', last_name: '', email: '', phone: '', company: '',
    job_title: '', linkedin_url: '', relationship_type: 'prospect' as ContactRelationshipType,
    tags: '' as string, notes: '',
  });
  const [savingContact, setSavingContact] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (strengthFilter) params.set('strength', strengthFilter);
    if (typeFilter) params.set('type', typeFilter);
    if (tagFilter) params.set('tag', tagFilter);
    params.set('sort', sortBy);
    params.set('limit', '100');

    try {
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      setContacts(data.contacts || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, strengthFilter, typeFilter, tagFilter, sortBy]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Load deals for interaction form
  useEffect(() => {
    fetch('/api/fees?limit=0')
      .then(r => r.json())
      .then(() => {
        // Try loading deals from a simpler endpoint
        fetch('/api/contacts?limit=0').catch(() => {});
      })
      .catch(() => {});
  }, []);

  async function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    setSavingContact(true);
    try {
      const body = {
        ...newContact,
        tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowNewContact(false);
        setNewContact({ first_name: '', last_name: '', email: '', phone: '', company: '', job_title: '', linkedin_url: '', relationship_type: 'prospect', tags: '', notes: '' });
        fetchContacts();
      }
    } finally {
      setSavingContact(false);
    }
  }

  async function handleSaveInteraction(data: any) {
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setInteractionContactId(null);
      fetchContacts();
    }
  }

  function cycleSortBy() {
    const order: typeof sortBy[] = ['score', 'name', 'last_interaction'];
    const idx = order.indexOf(sortBy);
    setSortBy(order[(idx + 1) % order.length]);
  }

  const sortLabels = { score: 'Score', name: 'Nome', last_interaction: 'Ultima Interazione' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Relationship <span className="text-[#D4AF37]">Intelligence</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total} contatti</p>
        </div>
        <button
          onClick={() => setShowNewContact(true)}
          className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-6 py-3 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={16} /> Nuovo Contatto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca contatto, azienda, email..."
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Strength filter */}
          <select
            value={strengthFilter}
            onChange={e => setStrengthFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white"
          >
            <option value="">Tutti i livelli</option>
            {Object.entries(STRENGTH_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors bg-white"
          >
            <option value="">Tutti i tipi</option>
            {Object.entries(RELATIONSHIP_TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          {/* Tag filter */}
          <div className="relative min-w-[150px]">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              placeholder="Tag..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Sort */}
          <button
            onClick={cycleSortBy}
            className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:border-slate-300 transition-colors"
          >
            <ArrowUpDown size={14} />
            {sortLabels[sortBy]}
          </button>
        </div>
      </div>

      {/* New Contact Modal */}
      {showNewContact && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNewContact(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Nuovo Contatto</h2>
              <button onClick={() => setShowNewContact(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Nome *</label>
                  <input type="text" required value={newContact.first_name} onChange={e => setNewContact({ ...newContact, first_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Cognome *</label>
                  <input type="text" required value={newContact.last_name} onChange={e => setNewContact({ ...newContact, last_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Email</label>
                <input type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Telefono</label>
                  <input type="tel" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">LinkedIn</label>
                  <input type="url" value={newContact.linkedin_url} onChange={e => setNewContact({ ...newContact, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Azienda</label>
                  <input type="text" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Ruolo</label>
                  <input type="text" value={newContact.job_title} onChange={e => setNewContact({ ...newContact, job_title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tipo Relazione</label>
                <select value={newContact.relationship_type} onChange={e => setNewContact({ ...newContact, relationship_type: e.target.value as ContactRelationshipType })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] bg-white">
                  {Object.entries(RELATIONSHIP_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tags (separati da virgola)</label>
                <input type="text" value={newContact.tags} onChange={e => setNewContact({ ...newContact, tags: e.target.value })}
                  placeholder="real estate, lombardia, food..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Note</label>
                <textarea value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
              </div>
              <button type="submit" disabled={savingContact}
                className="w-full bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-xs uppercase tracking-widest">
                {savingContact ? 'Salvataggio...' : 'Crea Contatto'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Contact List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Users size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-sm">Nessun contatto trovato</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
          {contacts.map(contact => {
            const strength = STRENGTH_CONFIG[contact.strength];
            const relType = RELATIONSHIP_TYPE_CONFIG[contact.relationship_type];

            return (
              <div key={contact.id}>
                <div
                  className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/portal/admin/relationships/${contact.id}`)}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-[#001220] flex items-center justify-center flex-shrink-0">
                    {contact.avatar_url ? (
                      <img src={contact.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#D4AF37]">{getInitials(contact.full_name)}</span>
                    )}
                  </div>

                  {/* Name + Company */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 truncate">{contact.full_name}</span>
                      <span className={`text-[10px] font-bold ${strength.color}`}>{strength.emoji} {strength.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.company && (
                        <span className="text-[11px] text-slate-500 truncate">{contact.company}</span>
                      )}
                      {contact.job_title && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-400 truncate">{contact.job_title}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Relationship type badge */}
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ color: relType.color, backgroundColor: relType.color + '15' }}
                  >
                    {relType.label}
                  </span>

                  {/* Score bar */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-28">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${contact.score}%`,
                          background: `linear-gradient(90deg, ${
                            contact.score >= 60 ? '#D4AF37' : contact.score >= 30 ? '#94A3B8' : '#CBD5E1'
                          }, ${
                            contact.score >= 80 ? '#F5A623' : contact.score >= 60 ? '#D4AF37' : contact.score >= 30 ? '#94A3B8' : '#CBD5E1'
                          })`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-6 text-right">{contact.score}</span>
                  </div>

                  {/* Last interaction */}
                  <span className="text-[10px] text-slate-400 flex-shrink-0 w-16 text-right">
                    {timeAgo(contact.last_interaction_at)}
                  </span>

                  {/* Add interaction button */}
                  <button
                    onClick={e => { e.stopPropagation(); setInteractionContactId(interactionContactId === contact.id ? null : contact.id); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#D4AF37] transition-all flex-shrink-0"
                    title="Aggiungi Interazione"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Inline interaction form */}
                {interactionContactId === contact.id && (
                  <div className="px-5 pb-5">
                    <AddInteractionForm
                      contactId={contact.id}
                      deals={deals}
                      onSave={handleSaveInteraction}
                      onCancel={() => setInteractionContactId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
