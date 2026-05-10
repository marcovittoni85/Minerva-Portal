'use client';

import { Contact, STRENGTH_CONFIG, RELATIONSHIP_TYPE_CONFIG } from '@/types/relationship';
import { timeAgo, getInitials } from '@/lib/format';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export default function ContactCard({ contact, onClick }: ContactCardProps) {
  const strength = STRENGTH_CONFIG[contact.strength];
  const relType = RELATIONSHIP_TYPE_CONFIG[contact.relationship_type];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[#001220] flex items-center justify-center flex-shrink-0">
        {contact.avatar_url ? (
          <img src={contact.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-[#D4AF37]">{getInitials(contact.full_name)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">{contact.full_name}</p>
        {contact.company && (
          <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{contact.company}</p>
        )}
      </div>

      {/* Score bar mini */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${contact.score}%`,
              background: contact.score > 60 ? '#D4AF37' : contact.score > 30 ? '#94A3B8' : '#CBD5E1',
            }}
          />
        </div>
        <span className="text-[10px] font-bold text-slate-400">{contact.score}</span>
      </div>

      {/* Strength badge */}
      <span className={`text-xs flex-shrink-0 ${strength.color}`}>
        {strength.emoji}
      </span>

      {/* Time */}
      <span className="text-[10px] text-slate-400 flex-shrink-0">
        {timeAgo(contact.last_interaction_at)}
      </span>
    </div>
  );
}
