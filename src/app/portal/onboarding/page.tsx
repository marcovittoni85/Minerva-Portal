"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { FileText, Download, CheckSquare, Square, Clock, Shield } from "lucide-react";
import Image from "next/image";

const CODICI = [
  {
    key: "etico",
    title: "Codice Etico VERITAS",
    description: "Principi etici fondamentali e standard di condotta professionale di Minerva Partners.",
    path: "codici/Codice_Etico_VERITAS_Minerva.pdf",
  },
  {
    key: "retributivo",
    title: "Codice Retributivo",
    description: "Struttura retributiva, fee sharing e modalità di compensazione.",
    path: "codici/Codice_Retributivo_Minerva.pdf",
  },
  {
    key: "operativo",
    title: "Codice Operativo",
    description: "Procedure operative, workflow e regole di ingaggio per le operazioni.",
    path: "codici/Codice_Operativo_Minerva.pdf",
  },
];

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("onboarding_deadline, onboarding_completed").eq("id", user.id).single();
      if (profile?.onboarding_completed) {
        router.push("/portal");
        return;
      }

      if (profile?.onboarding_deadline) {
        setDeadline(profile.onboarding_deadline);
        const dl = new Date(profile.onboarding_deadline);
        const now = new Date();
        const diff = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff);
      }

      // Get download URLs for the PDFs
      for (const codice of CODICI) {
        const { data } = supabase.storage.from("minerva-documents").getPublicUrl(codice.path);
        if (data?.publicUrl) {
          setDownloadUrls(prev => ({ ...prev, [codice.key]: data.publicUrl }));
        }
      }
    }
    load();
  }, []);

  const allAccepted = CODICI.every(c => accepted[c.key]);

  const handleSign = async () => {
    if (!allAccepted) return;
    setLoading(true);
    setError(null);

    try {
      // Get client IP
      let ip = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ip = ipData.ip;
      } catch { /* fallback */ }

      const res = await fetch("/api/onboarding/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Errore durante la firma");
      } else {
        router.push("/portal");
      }
    } catch {
      setError("Errore di rete");
    }
    setLoading(false);
  };

  const toggleAccept = (key: string) => {
    setAccepted(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Image src="/icon.webp" alt="Minerva" width={50} height={50} className="mx-auto mb-4" unoptimized />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Presa Visione Codici Minerva</h1>
          <p className="text-slate-500 text-sm">
            Prima di accedere al portale, devi prendere visione e accettare i tre codici Minerva Partners.
          </p>
        </div>

        {/* Countdown */}
        {daysLeft !== null && (
          <div className={`mb-8 rounded-xl p-4 flex items-center gap-3 ${
            daysLeft <= 5 ? "bg-red-50 border border-red-200" : daysLeft <= 10 ? "bg-amber-50 border border-amber-200" : "bg-blue-50 border border-blue-200"
          }`}>
            <Clock className={`w-5 h-5 flex-shrink-0 ${daysLeft <= 5 ? "text-red-500" : daysLeft <= 10 ? "text-amber-500" : "text-blue-500"}`} />
            <div>
              <p className={`text-sm font-bold ${daysLeft <= 5 ? "text-red-700" : daysLeft <= 10 ? "text-amber-700" : "text-blue-700"}`}>
                {daysLeft > 0
                  ? `Hai ${daysLeft} giorn${daysLeft === 1 ? "o" : "i"} rimanent${daysLeft === 1 ? "e" : "i"} per completare l'onboarding`
                  : "Termine scaduto — contatta l'amministratore"
                }
              </p>
              {deadline && (
                <p className={`text-xs mt-0.5 ${daysLeft <= 5 ? "text-red-500" : daysLeft <= 10 ? "text-amber-500" : "text-blue-500"}`}>
                  Scadenza: {new Date(deadline).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* Documents */}
        <div className="space-y-4 mb-8">
          {CODICI.map(codice => {
            const isAccepted = !!accepted[codice.key];
            return (
              <div key={codice.key} className={`border rounded-2xl p-6 transition-all ${isAccepted ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isAccepted ? "bg-emerald-100" : "bg-slate-100"}`}>
                    <FileText className={`w-6 h-6 ${isAccepted ? "text-emerald-600" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{codice.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{codice.description}</p>
                    <div className="flex items-center gap-4">
                      {downloadUrls[codice.key] ? (
                        <a
                          href={downloadUrls[codice.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors"
                        >
                          <Download className="w-3 h-3" /> Scarica PDF
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">PDF non disponibile</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleAccept(codice.key)}
                  className="mt-4 flex items-center gap-3 w-full text-left py-2 group"
                >
                  {isAccepted ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 group-hover:text-[#D4AF37] flex-shrink-0 transition-colors" />
                  )}
                  <span className={`text-sm ${isAccepted ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                    Ho letto e accetto integralmente il {codice.title}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Sign button */}
        <button
          onClick={handleSign}
          disabled={!allAccepted || loading}
          className={`w-full py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${
            allAccepted
              ? "bg-[#0f172a] text-[#D4AF37] hover:bg-slate-800 cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {loading ? (
            <span className="animate-pulse">Firma in corso...</span>
          ) : (
            <>
              <Shield className="w-4 h-4" /> Firma e Conferma
            </>
          )}
        </button>

        {!allAccepted && (
          <p className="text-center text-xs text-slate-400 mt-3">
            Accetta tutti e tre i codici per procedere con la firma
          </p>
        )}

        <p className="text-center text-[10px] text-slate-300 mt-6">
          La firma registrerà: timestamp, indirizzo IP e user agent del tuo browser.
        </p>
      </div>
    </div>
  );
}
