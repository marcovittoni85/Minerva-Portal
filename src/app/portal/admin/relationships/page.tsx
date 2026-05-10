import ContactList from '@/components/relationships/ContactList';
import { NetworkGraph } from '@/components/network/NetworkGraph';

export default function RelationshipsPage() {
  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8">
      {/* Network Graph */}
      <div className="p-4 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Network <span className="text-[#D4AF37]">Minerva</span></h2>
        <p className="text-slate-500 text-sm mb-6">Visualizzazione interattiva dei membri dell&apos;ecosistema</p>
        <NetworkGraph />
      </div>

      {/* Contact List */}
      <ContactList />
    </div>
  );
}
