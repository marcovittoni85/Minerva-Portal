"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Loader2, Send, Shield, User } from "lucide-react";

interface L2Request {
  id: string;
  anonymous_code: string;
  interest_message: string;
  l1_status: string;
  l2_status: string;
  l2_requested_at: string | null;
  l2_client_name: string | null;
  l2_client_surname: string | null;
  l2_client_company: string | null;
  l2_client_email: string | null;
  l2_fee_from_client: string | null;
  l2_fee_from_minerva: string | null;
  l2_mandate_type: string | null;
  l2_mandate_file_url: string | null;
  l2_nda_file_url: string | null;
  l2_admin_verified: boolean;
  l2_admin_notes: string | null;
  l2_decline_reason: string | null;
  l2_decline_forwarded: boolean;
  created_at: string;
  // Admin-only
  requester_name?: string;
  requester_email?: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  not_requested: { label: "Non richiesta", color: "text-slate-400 bg-slate-50" },
  pending_docs: { label: "Documenti mancanti", color: "text-amber-700 bg-amber-50" },
  pending_admin: { label: "Verifica Admin", color: "text-blue-700 bg-blue-50" },
  pending_originator: { label: "Da Valutare", color: "text-[#D4AF37] bg-[#D4AF37]/10" },
  approved: { label: "Approvata", color: "text-emerald-700 bg-emerald-50" },
  declined: { label: "Declinata", color: "text-red-600 bg-red-50" },
};

export default function L2ReviewClient({
  dealId, dealTitle, dealCode, isAdmin, isOriginator,
}: {
  dealId: string;
  dealTitle: string;
  dealCode: string;
  isAdmin: boolean;
  isOriginator: boolean;
}) {
  const [requests, setRequests] = useState<L2Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [adminVerifyModal, setAdminVerifyModal] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [forwardModal, setForwardModal] = useState<{ id: string; reason: string } | null>(null);
  const [forwardText, setForwardText] = useState("");

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`/api/deal-interest?dealId=${dealId}`);
    if (res.ok) {
      const data = await res.json();
      // Only show requests that have L2 activity or are L1-approved
      setRequests(data.requests.filter((r: L2Request) => r.l1_status === "approved"));
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Admin verify L2 docs
  const handleAdminVerify = async (decision: "approved" | "rejected" | "clarification") => {
    if (!adminVerifyModal) return;
    setActing(adminVerifyModal);
    await fetch("/api/deal-interest/admin-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: adminVerifyModal, decision, notes: adminNotes.trim() || undefined }),
    });
    setAdminVerifyModal(null);
    setAdminNotes("");
    await fetchRequests();
    setActing(null);
  };

  // Originator decide on L2
  const handleOriginatorDecide = async (requestId: string, decision: "approved" | "declined") => {
    if (decision === "declined") { setDeclineModal(requestId); return; }
    setActing(requestId);
    await fetch("/api/deal-interest/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, level: "l2", decision }),
    });
    await fetchRequests();
    setActing(null);
  };

  const submitDecline = async () => {
    if (!declineModal || declineReason.trim().length < 20) return;
    setActing(declineModal);
    await fetch("/api/deal-interest/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: declineModal, level: "l2", decision: "declined", declineReason: declineReason.trim() }),
    });
    setDeclineModal(null);
    setDeclineReason("");
    await fetchRequests();
    setActing(null);
  };

  const submitForward = async () => {
    if (!forwardModal) return;
    await fetch("/api/deal-interest/forward-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: forwardModal.id, level: "l2", forwardedText: forwardText.trim() || undefined }),
    });
    setForwardModal(null);
    setForwardText("");
    await fetchRequests();
  };

  const pendingAdmin = requests.filter(r => r.l2_status === "pending_admin");
  const pendingOriginator = requests.filter(r => r.l2_status === "pending_originator");
  const others = requests.filter(r => !["pending_admin", "pending_originator"].includes(r.l2_status));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href={`/portal/deals/${dealId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{dealCode}</p>
        <h1 className="text-2xl font-bold text-slate-900">Richieste — <span className="text-[#D4AF37]">Livello 2</span></h1>
        <p className="text-slate-500 text-sm mt-1">{dealTitle}</p>
      </header>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Nessuna richiesta L2 per questo deal.
        </div>
      ) : (
        <>
          {/* Admin: pending verification */}
          {isAdmin && pendingAdmin.length > 0 && (
            <Section title="Da Verificare (Admin)" count={pendingAdmin.length} color="text-blue-700">
              {pendingAdmin.map(r => (
                <RequestCard key={r.id} r={r} isAdmin={isAdmin}>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { setAdminVerifyModal(r.id); setAdminNotes(""); }} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2" disabled={acting === r.id}>
                      <CheckCircle className="w-3.5 h-3.5" /> Verifica OK
                    </button>
                    <button onClick={() => { setAdminVerifyModal(r.id); setAdminNotes(""); }} className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 flex items-center justify-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Rifiuta / Chiarimenti
                    </button>
                  </div>
                </RequestCard>
              ))}
            </Section>
          )}

          {/* Originator: pending decision */}
          {(isOriginator || isAdmin) && pendingOriginator.length > 0 && (
            <Section title="Da Valutare (Originator)" count={pendingOriginator.length} color="text-[#D4AF37]">
              {pendingOriginator.map(r => (
                <RequestCard key={r.id} r={r} isAdmin={isAdmin} showFullIdentity>
                  {(isOriginator || isAdmin) && (
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => handleOriginatorDecide(r.id, "approved")} disabled={acting === r.id} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {acting === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approva L2
                      </button>
                      <button onClick={() => handleOriginatorDecide(r.id, "declined")} disabled={acting === r.id} className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 flex items-center justify-center gap-2">
                        <XCircle className="w-3.5 h-3.5" /> Declina
                      </button>
                    </div>
                  )}
                </RequestCard>
              ))}
            </Section>
          )}

          {/* Other requests */}
          {others.length > 0 && (
            <Section title="Storico" count={others.length} color="text-slate-500">
              {others.map(r => (
                <RequestCard key={r.id} r={r} isAdmin={isAdmin} showFullIdentity={r.l2_admin_verified}>
                  {isAdmin && r.l2_status === "declined" && r.l2_decline_reason && !r.l2_decline_forwarded && (
                    <button onClick={() => setForwardModal({ id: r.id, reason: r.l2_decline_reason! })} className="mt-3 text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
                      <Send className="w-3 h-3" /> Inoltra Motivazione al Richiedente
                    </button>
                  )}
                </RequestCard>
              ))}
            </Section>
          )}
        </>
      )}

      {/* Admin verify modal */}
      {adminVerifyModal && (
        <Modal title="Verifica Documentazione L2" onClose={() => setAdminVerifyModal(null)}>
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Note (opzionali)</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Note per la verifica..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] resize-none" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleAdminVerify("approved")} disabled={!!acting} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-emerald-700 disabled:opacity-50">Documenti OK</button>
            <button onClick={() => handleAdminVerify("clarification")} disabled={!!acting} className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-amber-600 disabled:opacity-50">Chiarimenti</button>
            <button onClick={() => handleAdminVerify("rejected")} disabled={!!acting} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-red-700 disabled:opacity-50">Rifiuta</button>
          </div>
        </Modal>
      )}

      {/* Decline reason modal */}
      {declineModal && (
        <Modal title="Motivazione Rifiuto L2" onClose={() => { setDeclineModal(null); setDeclineReason(""); }}>
          <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={4} placeholder="Descrivi il motivo del rifiuto (min 20 caratteri)..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-300 resize-none" />
          <p className="text-[10px] text-slate-400 mt-1">{declineReason.length}/20 min</p>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setDeclineModal(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-500 border border-slate-200">Annulla</button>
            <button onClick={submitDecline} disabled={declineReason.trim().length < 20 || !!acting} className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase disabled:opacity-50">Conferma Rifiuto</button>
          </div>
        </Modal>
      )}

      {/* Forward reason modal */}
      {forwardModal && (
        <Modal title="Inoltra Motivazione al Richiedente" onClose={() => setForwardModal(null)}>
          <p className="text-xs text-slate-500 mb-2">Originale:</p>
          <div className="bg-slate-50 rounded-xl p-3 mb-3 text-sm text-slate-700">{forwardModal.reason}</div>
          <textarea value={forwardText} onChange={e => setForwardText(e.target.value)} rows={3} placeholder="Riformula (opzionale)..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] resize-none" />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setForwardModal(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-500 border border-slate-200">Annulla</button>
            <button onClick={submitForward} className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase">Inoltra</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className={`text-xs font-bold uppercase tracking-widest ${color} mb-4`}>{title} ({count})</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function RequestCard({ r, isAdmin, showFullIdentity, children }: { r: L2Request; isAdmin: boolean; showFullIdentity?: boolean; children?: React.ReactNode }) {
  const st = statusLabels[r.l2_status] || statusLabels.not_requested;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-900 font-mono">{r.anonymous_code}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${st.color}`}>{st.label}</span>
        </div>
        {r.l2_requested_at && (
          <span className="text-[10px] text-slate-400">
            L2: {new Date(r.l2_requested_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      {/* Requester identity — revealed after admin verification (or always for admin) */}
      {(isAdmin || showFullIdentity) && r.requester_name && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> {isAdmin && !showFullIdentity ? "Identità (solo admin)" : "Richiedente"}
          </p>
          <p className="text-sm font-bold text-blue-900">{r.requester_name}</p>
          {isAdmin && r.requester_email && <p className="text-xs text-blue-700">{r.requester_email}</p>}
        </div>
      )}

      {/* Client info */}
      {r.l2_client_name && (
        <div className="bg-slate-50 rounded-xl p-4 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Cliente Dichiarato
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-slate-400">Nome:</span> <span className="font-bold text-slate-900">{r.l2_client_name} {r.l2_client_surname}</span></div>
            {r.l2_client_company && <div><span className="text-slate-400">Società:</span> <span className="font-bold text-slate-900">{r.l2_client_company}</span></div>}
            {r.l2_client_email && <div><span className="text-slate-400">Email:</span> <span className="font-bold text-slate-900">{r.l2_client_email}</span></div>}
          </div>
        </div>
      )}

      {/* Fee & mandate info */}
      {(r.l2_fee_from_client || r.l2_mandate_type) && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {r.l2_fee_from_client && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Fee Cliente</p>
              <p className="text-xs font-bold text-slate-900">{r.l2_fee_from_client}</p>
            </div>
          )}
          {r.l2_fee_from_minerva && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Fee Minerva</p>
              <p className="text-xs font-bold text-slate-900">{r.l2_fee_from_minerva}</p>
            </div>
          )}
          {r.l2_mandate_type && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Mandato</p>
              <p className="text-xs font-bold text-slate-900 capitalize">{r.l2_mandate_type === "none" ? "Nessuno" : r.l2_mandate_type === "exclusive" ? "Esclusiva" : "Generico"}</p>
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {(r.l2_mandate_file_url || r.l2_nda_file_url) && (
        <div className="flex gap-2 mb-3">
          {r.l2_mandate_file_url && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <FileText className="w-3 h-3" /> Mandato
            </span>
          )}
          {r.l2_nda_file_url && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <FileText className="w-3 h-3" /> NDA
            </span>
          )}
          {r.l2_admin_verified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              <CheckCircle className="w-3 h-3" /> Verificato Admin
            </span>
          )}
        </div>
      )}

      {r.l2_admin_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1">Note Admin</p>
          <p className="text-xs text-amber-800">{r.l2_admin_notes}</p>
        </div>
      )}

      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
