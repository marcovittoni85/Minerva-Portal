"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, Send, FileText, MapPin, TrendingUp, Users, Clock, Shield } from "lucide-react";

interface Comment {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
}

export default function DealDetailClient({
  deal, comments: initialComments, commenterMap, originatorName, isAdmin, isOriginator, userId,
}: {
  deal: any;
  comments: Comment[];
  commenterMap: Record<string, { name: string; role: string }>;
  originatorName: string;
  isAdmin: boolean;
  isOriginator: boolean;
  userId: string;
}) {
  const supabase = createClient();
  const [comments, setComments] = useState(initialComments);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const sendComment = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    const { data, error } = await supabase.from("deal_comments").insert({
      deal_id: deal.id,
      user_id: userId,
      message: newMsg.trim(),
    }).select().single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewMsg("");
    }
    setSending(false);
  };

  const sectorColors: Record<string, string> = {
    "Real estate & hospitality": "bg-emerald-50 text-emerald-700",
    "Healthcare": "bg-rose-50 text-rose-700",
    "Macchinari industriali": "bg-blue-50 text-blue-700",
    "Utility e rinnovabili": "bg-amber-50 text-amber-700",
    "Servizi finanziari": "bg-purple-50 text-purple-700",
    "Chimica": "bg-cyan-50 text-cyan-700",
    "Sports goods": "bg-orange-50 text-orange-700",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/portal/my-deals" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna ai Miei Deal
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{deal.code}</span>
          <span className={"text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded " + (sectorColors[deal.sector] || "bg-slate-50 text-slate-600")}>{deal.sector}</span>
          {deal.sub_sector && <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{deal.sub_sector}</span>}
          {deal.deal_stage && deal.deal_stage !== "board" && (
            <span className="text-[10px] font-bold text-white bg-[#D4AF37] px-2 py-0.5 rounded capitalize">{deal.deal_stage.replace("_", " ")}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">{deal.title}</h1>

        {isAdmin && originatorName && (
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-3 h-3 text-[#D4AF37]" />
            <p className="text-sm text-[#D4AF37] font-bold">Originator: {originatorName}</p>
          </div>
        )}

        <p className="text-slate-600 text-sm mb-6 leading-relaxed">{deal.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">EV Range</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.ev_range || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tipo</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.deal_type || deal.side || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Geografia</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.geography || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mandato</p>
            <p className="text-sm font-bold text-slate-900">{deal.mandate_type || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Thematic</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.thematic_area || "N/A"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents — left column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Documenti</h2>
            <p className="text-slate-500 text-xs mb-4">Accedi al dossier completo dell'operazione.</p>
            <div className="space-y-3">
              {deal.dropbox_link && (
                <a href={deal.dropbox_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 hover:border-[#D4AF37] transition-colors">
                  <FileText className="w-4 h-4 text-[#D4AF37]" /> Cartella Dropbox
                </a>
              )}
              {deal.vdr_link && (
                <a href={deal.vdr_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 hover:border-[#D4AF37] transition-colors">
                  <FileText className="w-4 h-4 text-[#D4AF37]" /> Virtual Data Room
                </a>
              )}
              {!deal.dropbox_link && !deal.vdr_link && (
                <p className="text-slate-400 text-xs">Nessun documento caricato.</p>
              )}
            </div>
          </div>

          {/* Deal info for admin */}
          {isAdmin && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Info Admin</h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Stage</span>
                  <span className="font-bold text-slate-900 capitalize">{deal.deal_stage || "board"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Confidentiality</span>
                  <span className="font-bold text-slate-900">{deal.confidentiality || "Blind"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="font-bold text-slate-900">{deal.status || "active"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat — right column */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "600px" }}>
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Commenti</h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">Comunica con l'originator e i membri approvati.</p>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-3">
            {comments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12">Nessun commento. Inizia la conversazione.</p>
            ) : (
              comments.map((c) => {
                const isMe = c.user_id === userId;
                const commenter = commenterMap[c.user_id];
                return (
                  <div key={c.id} className={"flex " + (isMe ? "justify-end" : "justify-start")}>
                    <div className={"max-w-sm rounded-2xl px-4 py-3 " + (isMe ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20" : "bg-slate-50 border border-slate-100")}>
                      <p className={"text-[10px] font-bold mb-1 " + (isMe ? "text-[#D4AF37]" : "text-slate-500")}>
                        {isMe ? "Tu" : (commenter?.name || "Utente")}
                        {commenter?.role === "admin" && !isMe && <span className="ml-1 text-[9px] text-slate-400">(Admin)</span>}
                      </p>
                      <p className="text-sm text-slate-900">{c.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(c.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 flex gap-3">
            <input
              type="text"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendComment()}
              placeholder="Scrivi un commento..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
            />
            <button onClick={sendComment} disabled={sending || !newMsg.trim()} className="bg-[#D4AF37] text-white px-4 py-3 rounded-xl disabled:opacity-50 hover:bg-[#b8962d] transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}