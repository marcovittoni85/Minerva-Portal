"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye, Loader2, Send } from "lucide-react";

interface InterestRequest {
  id: string;
  anonymous_code: string;
  interest_message: string;
  l1_status: string;
  l1_decided_at: string | null;
  l1_decline_reason: string | null;
  l1_decline_forwarded: boolean;
  l2_status: string;
  created_at: string;
  // Admin-only fields
  requester_name?: string;
  requester_email?: string;
}

export default function L1ReviewClient({
  dealId, dealTitle, dealCode, isAdmin,
}: {
  dealId: string;
  dealTitle: string;
  dealCode: string;
  isAdmin: boolean;
}) {
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [declineModal, setDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [forwardModal, setForwardModal] = useState<{ id: string; reason: string } | null>(null);
  const [forwardText, setForwardText] = useState("");

  const fetchRequests = useCallback(async () => {
    const res = await fetch(`/api/deal-interest?dealId=${dealId}`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleDecide = async (requestId: string, decision: "approved" | "declined") => {
    if (decision === "declined") {
      setDeclineModal(requestId);
      return;
    }

    setDeciding(requestId);
    const res = await fetch("/api/deal-interest/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, level: "l1", decision }),
    });
    if (res.ok) await fetchRequests();
    setDeciding(null);
  };

  const submitDecline = async () => {
    if (!declineModal || declineReason.trim().length < 20) return;
    setDeciding(declineModal);
    const res = await fetch("/api/deal-interest/decide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: declineModal,
        level: "l1",
        decision: "declined",
        declineReason: declineReason.trim(),
      }),
    });
    if (res.ok) {
      await fetchRequests();
      setDeclineModal(null);
      setDeclineReason("");
    }
    setDeciding(null);
  };

  const submitForward = async () => {
    if (!forwardModal) return;
    await fetch("/api/deal-interest/forward-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: forwardModal.id,
        level: "l1",
        forwardedText: forwardText.trim() || undefined,
      }),
    });
    setForwardModal(null);
    setForwardText("");
    await fetchRequests();
  };

  const pending = requests.filter(r => r.l1_status === "pending");
  const decided = requests.filter(r => r.l1_status !== "pending");

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href={`/portal/deals/${dealId}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{dealCode}</p>
        <h1 className="text-2xl font-bold text-slate-900">Richieste di Interesse — <span className="text-[#D4AF37]">L1</span></h1>
        <p className="text-slate-500 text-sm mt-1">{dealTitle}</p>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-sm">
          Nessuna richiesta di interesse ricevuta.
        </div>
      ) : (
        <>
          {/* Pending requests */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4">Da Valutare ({pending.length})</h2>
              <div className="space-y-4">
                {pending.map(r => (
                  <div key={r.id} className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 font-mono">{r.anonymous_code}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Admin can see real identity */}
                    {isAdmin && r.requester_name && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-1">Identità (solo admin)</p>
                        <p className="text-sm font-bold text-blue-900">{r.requester_name}</p>
                        {r.requester_email && <p className="text-xs text-blue-700">{r.requester_email}</p>}
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-4 mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Motivo di Interesse</p>
                      <p className="text-sm text-slate-700">{r.interest_message}</p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDecide(r.id, "approved")}
                        disabled={deciding === r.id}
                        className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {deciding === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Approva L1
                      </button>
                      <button
                        onClick={() => handleDecide(r.id, "declined")}
                        disabled={deciding === r.id}
                        className="flex-1 border border-red-200 text-red-600 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Declina
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decided requests */}
          {decided.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Storico ({decided.length})</h2>
              <div className="space-y-3">
                {decided.map(r => (
                  <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 font-mono">{r.anonymous_code}</span>
                        {r.l1_status === "approved" ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approvata
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Declinata
                          </span>
                        )}
                        {r.l2_status !== "not_requested" && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            L2: {r.l2_status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Admin: forward decline reason */}
                        {isAdmin && r.l1_status === "declined" && r.l1_decline_reason && !r.l1_decline_forwarded && (
                          <button
                            onClick={() => setForwardModal({ id: r.id, reason: r.l1_decline_reason! })}
                            className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Inoltra Motivazione
                          </button>
                        )}
                        {r.l1_decline_forwarded && (
                          <span className="text-[10px] text-slate-400">Motivazione inoltrata</span>
                        )}
                        {r.l1_status === "approved" && (
                          <Link
                            href={`/portal/deals/${dealId}/l2-review`}
                            className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Vedi L2
                          </Link>
                        )}
                      </div>
                    </div>
                    {isAdmin && r.requester_name && (
                      <p className="text-[10px] text-blue-600 mt-1">Richiedente: {r.requester_name}</p>
                    )}
                    {r.l1_decided_at && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Deciso il: {new Date(r.l1_decided_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Decline reason modal */}
      {declineModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Motivazione Rifiuto L1</h3>
              <p className="text-xs text-slate-500 mt-1">La motivazione è obbligatoria e sarà visibile all'admin.</p>
            </div>
            <div className="p-6">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Descrivi il motivo del rifiuto (minimo 20 caratteri)..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-red-300 transition-colors resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{declineReason.length}/20 caratteri min</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setDeclineModal(null); setDeclineReason(""); }} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50">Annulla</button>
              <button
                onClick={submitDecline}
                disabled={declineReason.trim().length < 20 || !!deciding}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deciding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Conferma Rifiuto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward reason modal */}
      {forwardModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Inoltra Motivazione al Richiedente</h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-3">Motivazione originale dell'originator:</p>
              <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm text-slate-700">{forwardModal.reason}</div>
              <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-2">
                Riformula (opzionale) — lascia vuoto per inviare l'originale
              </label>
              <textarea
                value={forwardText}
                onChange={(e) => setForwardText(e.target.value)}
                placeholder="Riformula la motivazione se necessario..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors resize-none"
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setForwardModal(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50">Annulla</button>
              <button
                onClick={submitForward}
                className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d]"
              >
                Inoltra al Richiedente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
