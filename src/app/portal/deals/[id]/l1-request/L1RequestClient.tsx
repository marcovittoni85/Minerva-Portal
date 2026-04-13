"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Shield, Loader2 } from "lucide-react";

interface Props {
  deal: {
    id: string;
    title: string;
    code: string;
    sector: string;
    side: string;
    ev_range: string;
    geography: string;
    blind_description: string | null;
    teaser_description: string | null;
    asset_class: string | null;
    board_status: string | null;
  };
  existingRequest: {
    id: string;
    l1_status: string;
    l2_status: string;
    anonymous_code: string;
  } | null;
}

export default function L1RequestClient({ deal, existingRequest }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (message.trim().length < 20) {
      setError("Minimo 20 caratteri");
      return;
    }
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/deal-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id, interestMessage: message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Errore nell'invio");
      }
    } catch {
      setError("Errore di rete");
    }
    setSending(false);
  };

  // Already has an active request
  if (existingRequest) {
    const { l1_status, l2_status, anonymous_code } = existingRequest;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href="/portal/board" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla Bacheca
        </Link>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          {l1_status === "approved" && (
            <>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">Autorizzazione Livello 1</p>
                <p className="text-lg font-bold text-emerald-800">Codice Minerva: {anonymous_code}</p>
              </div>
              <p className="text-slate-600 text-sm mb-6">Puoi ora visualizzare i dati completi del deal.</p>
              <Link
                href={`/portal/deals/${deal.id}`}
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors"
              >
                Visualizza Deal Completo
              </Link>
              {l2_status === "not_requested" && (
                <div className="mt-4">
                  <Link
                    href={`/portal/deals/${deal.id}/l2-request`}
                    className="text-sm text-[#D4AF37] font-bold hover:underline"
                  >
                    Procedi con richiesta L2 →
                  </Link>
                </div>
              )}
            </>
          )}

          {l1_status === "pending" && (
            <>
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Richiesta in Attesa</h2>
              <p className="text-slate-500 text-sm mb-2">La tua richiesta di interesse ({anonymous_code}) è in fase di valutazione.</p>
              <p className="text-slate-400 text-xs">Riceverai una notifica quando l'originator avrà preso una decisione.</p>
            </>
          )}

          {l1_status === "declined" && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Autorizzazione Livello 1 Negata</p>
              </div>
              <p className="text-slate-500 text-sm">La tua richiesta non è stata accolta per questo deal.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-100 rounded-2xl p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Richiesta Inviata</h2>
          <p className="text-slate-500 text-sm mb-6">L'originator valuterà la tua richiesta. Riceverai una notifica con l'esito.</p>
          <button
            onClick={() => router.push("/portal/board")}
            className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors"
          >
            Torna alla Bacheca
          </button>
        </div>
      </div>
    );
  }

  // Request form
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link href="/portal/board" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna alla Bacheca
      </Link>

      {/* Deal summary (blind) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{deal.code}</span>
          {deal.asset_class && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37]">
              {deal.asset_class.replace(/_/g, " ")}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">{deal.title}</h1>
        {(deal.blind_description || deal.teaser_description) && (
          <p className="text-slate-500 text-sm mb-4">{deal.blind_description || deal.teaser_description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          {deal.sector && <span>Settore: {deal.sector}</span>}
          {deal.ev_range && <span>EV: {deal.ev_range}</span>}
          {deal.geography && <span>Area: {deal.geography}</span>}
          {deal.side && <span>Side: {deal.side}</span>}
        </div>
      </div>

      {/* Interest form */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Richiedi Approfondimento</h2>
        </div>

        <p className="text-slate-500 text-sm mb-4">
          La tua identità resterà anonima per l'originator. Ti verrà assegnato un codice univoco.
        </p>

        {deal.board_status === "in_negotiation" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-700 text-xs font-bold">
              Questo deal è in fase di trattativa. Puoi comunque segnalare il tuo interesse.
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-2">
            Descrivi brevemente il motivo del tuo interesse *
          </label>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setError(null); }}
            placeholder="Descrivi brevemente il motivo del tuo interesse"
            rows={4}
            minLength={20}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors resize-none"
          />
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-slate-400">Minimo 20 caratteri</p>
            <p className={"text-[10px] " + (message.length >= 20 ? "text-emerald-500" : "text-slate-400")}>{message.length}/20+</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={sending || message.trim().length < 20}
          className="w-full bg-[#D4AF37] text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Invio in corso..." : "Invia Richiesta di Interesse"}
        </button>
      </div>
    </div>
  );
}
