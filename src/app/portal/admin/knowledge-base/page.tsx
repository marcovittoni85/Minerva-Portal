import KnowledgeBaseList from '@/components/knowledge-base/KnowledgeBaseList';
import Link from 'next/link';
import { MessageCircle, ArrowRight } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div />
        <Link
          href="/portal/knowledge-base"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#001220] text-[#D4AF37] text-xs font-bold uppercase tracking-wider hover:bg-[#001220]/90 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Chiedi a Minerva
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <KnowledgeBaseList />
    </div>
  );
}
