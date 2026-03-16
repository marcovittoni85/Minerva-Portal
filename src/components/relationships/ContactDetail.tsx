'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Contact, Interaction, ContactDeal,
  STRENGTH_CONFIG, RELATIONSHIP_TYPE_CONFIG,
  INTERACTION_TYPE_CONFIG, SENTIMENT_CONFIG,
  InteractionType,
} from '@/types/relationship';
import AddInteractionForm from './AddInteractionForm';
import AddTaskModal from '@/components/cockpit/AddTaskModal';
import EventForm from '@/components/calendar/EventForm';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import {
  ArrowLeft, Mail, Phone, Linkedin, MapPin, ExternalLink,
  Users, Video, Send, StickyNote, UserPlus, Calendar as CalendarIcon,
  Briefcase, FileText, Clock, MoreHorizontal, Star, Check,
  ChevronDown, Plus, Tag, CheckSquare, Bell,
} from 'lucide-react';

const EVENT_ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar: CalendarIcon, Clock, Bell };

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar: CalendarIcon, Briefcase, FileText, Clock, MoreHorizontal,
};

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface ContactDetailProps {
  contactId: string;
}

export default function ContactDetail({ contactId }: ContactDetailProps) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [linkedDeals, setLinkedDeals] = useState<ContactDeal[]>([]);
  const [pendingFollowups, setPendingFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [contactEvents, setContactEvents] = useState<CalendarEvent[]>([]);

  async function fetchContactEvents() {
    try {
      const res = await fetch(`/api/calendar?contact_id=${contactId}`);
      const data = await res.json();
      setContactEvents(data.events || []);
    } catch { /* silent */ }
  }

  async function fetchContact() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      const data = await res.json();
      setContact(data.contact);
      setInteractions(data.interactions || []);
      setLinkedDeals(data.linked_deals || []);
      setPendingFollowups(data.pending_followups || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContact();
    fetchContactEvents();
  }, [contactId]);

  async function handleSaveInteraction(data: any) {
    const res = await fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowInteractionForm(false);
      fetchContact();
    }
  }

  async function markFollowUpDone(interactionId: string) {
    await fetch('/api/interactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: interactionId, follow_up_done: true }),
    });
    fetchContact();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Contatto non trovato</p>
      </div>
    );
  }

  const strength = STRENGTH_CONFIG[contact.strength];
  const relType = RELATIONSHIP_TYPE_CONFIG[contact.relationship_type];

  // Calculate avg interaction frequency
  const avgFrequency = interactions.length > 1
    ? Math.round((Date.now() - new Date(interactions[interactions.length - 1].interaction_date).getTime()) / (interactions.length * 86400000))
    : null;

  // Ring chart SVG for score
  const circumference = 2 * Math.PI * 40;
  const scoreOffset = circumference - (contact.score / 100) * circumference;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/portal/admin/relationships')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setShowTaskModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <CheckSquare size={14} /> Crea Task
        </button>
        <button
          onClick={() => setShowEventForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <CalendarIcon size={14} /> Evento
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#001220] flex items-center justify-center flex-shrink-0">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#D4AF37]">{getInitials(contact.full_name)}</span>
            )}
          </div>

          {/* Name + Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900">{contact.full_name}</h1>
              <span className={`text-sm font-bold ${strength.color} ${strength.bgColor} px-3 py-1 rounded-full`}>
                {strength.emoji} {strength.label}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ color: relType.color, backgroundColor: relType.color + '15' }}
              >
                {relType.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 flex-wrap">
              {contact.company && <span className="font-medium">{contact.company}</span>}
              {contact.job_title && <span className="text-slate-400">{contact.job_title}</span>}
              {contact.location && (
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin size={13} /> {contact.location}
                </span>
              )}
            </div>

            {/* Contact links */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                  <Mail size={14} /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 transition-colors">
                  <Phone size={14} /> {contact.phone}
                </a>
              )}
              {contact.linkedin_url && (
                <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors">
                  <Linkedin size={14} /> LinkedIn <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Tags */}
            {contact.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Tag size={12} className="text-slate-400" />
                {contact.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Score ring */}
          <div className="flex-shrink-0 text-center">
            <svg width="100" height="100" className="-rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={contact.score >= 60 ? '#D4AF37' : contact.score >= 30 ? '#94A3B8' : '#CBD5E1'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <p className="text-2xl font-black text-slate-900 -mt-16">{contact.score}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">score</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Interazioni', value: contact.interaction_count.toString() },
          { label: 'Frequenza Media', value: avgFrequency ? `${avgFrequency}g` : '—' },
          { label: 'Ultimo Contatto', value: timeAgo(contact.last_interaction_at) },
          { label: 'Deal Coinvolti', value: contact.deals_involved.toString() },
        ].map(m => (
          <div key={m.label} className="bg-white border border-slate-100 rounded-2xl p-5 text-center">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">{m.label}</p>
            <p className="text-xl font-black text-slate-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Deals + Follow-ups */}
        <div className="space-y-6">
          {/* Linked deals */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Deal Collegati</h3>
            </div>
            {linkedDeals.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Nessun deal collegato</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {linkedDeals.map(ld => (
                  <div key={ld.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{ld.deal?.title || 'Deal'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ld.role && <span className="text-[10px] text-slate-500 uppercase tracking-widest">{ld.role}</span>}
                          {ld.deal?.category && (
                            <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest">
                              {ld.deal.category}
                            </span>
                          )}
                        </div>
                      </div>
                      {ld.deal?.estimated_ev && (
                        <span className="text-xs font-bold text-slate-600">{ld.deal.estimated_ev}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending follow-ups */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Follow-up Pendenti</h3>
            </div>
            {pendingFollowups.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Nessun follow-up pendente</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingFollowups.map((fu: any) => (
                  <div key={fu.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        {formatDate(fu.follow_up_date)}
                      </p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{fu.title}</p>
                      {fu.follow_up_notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{fu.follow_up_notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => markFollowUpDone(fu.id)}
                      className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white flex items-center justify-center transition-all"
                      title="Segna come fatto"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Timeline Interazioni</h3>
              <button
                onClick={() => setShowInteractionForm(!showInteractionForm)}
                className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#b8962d] text-xs font-bold uppercase tracking-widest transition-colors"
              >
                <Plus size={14} /> Nuova
              </button>
            </div>

            {/* Inline interaction form */}
            {showInteractionForm && (
              <div className="p-5 border-b border-slate-100">
                <AddInteractionForm
                  contactId={contactId}
                  onSave={handleSaveInteraction}
                  onCancel={() => setShowInteractionForm(false)}
                />
              </div>
            )}

            {interactions.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">Nessuna interazione registrata</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {interactions.map(interaction => {
                  const cfg = INTERACTION_TYPE_CONFIG[interaction.interaction_type];
                  const Icon = ICON_MAP[cfg.icon] || MoreHorizontal;

                  return (
                    <div key={interaction.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: cfg.color + '15' }}
                        >
                          <Icon size={16} style={{ color: cfg.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{interaction.title}</span>
                            {interaction.is_important && (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                Importante
                              </span>
                            )}
                            {interaction.sentiment && (
                              <span className="text-sm">{SENTIMENT_CONFIG[interaction.sentiment]?.icon}</span>
                            )}
                          </div>

                          {interaction.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{interaction.description}</p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 uppercase tracking-widest">
                            <span>{cfg.label}</span>
                            <span>{formatDate(interaction.interaction_date)}</span>
                            {interaction.duration_minutes && <span>{interaction.duration_minutes} min</span>}
                            {interaction.deal && (
                              <span className="text-blue-600 font-medium">{interaction.deal.title}</span>
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
        </div>
      </div>

      {/* Eventi collegati */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Eventi</h3>
          <button
            onClick={() => setShowEventForm(true)}
            className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#b8962d] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            <Plus size={14} /> Nuovo
          </button>
        </div>
        {contactEvents.length === 0 ? (
          <p className="p-5 text-sm text-slate-400">Nessun evento collegato</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {contactEvents.map(ev => {
              const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
              const Icon = EVENT_ICON_MAP[cfg.icon] || CalendarIcon;
              const c = ev.color || cfg.defaultColor;
              const startTime = new Date(ev.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const startDate = new Date(ev.start_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
              const isPast = new Date(ev.start_at) < new Date();

              return (
                <div key={ev.id} className={"p-4 flex items-center gap-3 " + (isPast ? "opacity-60" : "")}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: c + '15' }}
                  >
                    <Icon size={14} style={{ color: c }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-500">{startDate} · {startTime}</span>
                      {ev.deal_title && <span className="text-[10px] text-slate-400">· {ev.deal_title}</span>}
                    </div>
                  </div>
                  {ev.outcome && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Esito
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <AddTaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSaved={() => {}}
        prefillContactId={contactId}
        prefillContactName={contact.full_name}
      />

      {/* Event Modal */}
      <EventForm
        open={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSaved={() => { setShowEventForm(false); fetchContactEvents(); }}
        prefillContactId={contactId}
        prefillContactName={contact.full_name}
      />
    </div>
  );
}
