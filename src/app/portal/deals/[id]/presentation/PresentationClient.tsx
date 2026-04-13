"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Download, Printer } from "lucide-react";

const ASSET_LABELS: Record<string, string> = {
  m_and_a: "M&A",
  real_estate: "Real Estate",
  club_deal: "Club Deal / PE",
  strategy: "Strategy / Consulenza",
  wealth_management: "Wealth Management",
};

export default function PresentationClient({
  deal, originatorName,
}: {
  deal: any;
  originatorName: string;
}) {
  const [mode, setMode] = useState<"blind" | "full">("blind");
  const printRef = useRef<HTMLDivElement>(null);

  const checklist = deal.checklist_data || {};
  const assetLabel = ASSET_LABELS[deal.asset_class] || deal.asset_class || "N/A";

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>Minerva — ${deal.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap');
          body { margin: 0; font-family: 'DM Sans', sans-serif; background: #001220; color: #f8fafc; }
          .page { width: 100%; min-height: 100vh; padding: 60px; box-sizing: border-box; }
          h1, h2, h3 { font-family: 'Cormorant Garamond', serif; }
          h1 { font-size: 36px; color: #D4AF37; margin-bottom: 8px; }
          h2 { font-size: 24px; color: #D4AF37; margin-top: 40px; }
          .subtitle { color: #94a3b8; font-size: 14px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
          .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 20px; }
          .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 4px; }
          .card-value { font-size: 16px; font-weight: 700; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid rgba(212,175,55,0.3); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; }
          .logo { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: #D4AF37; font-weight: 700; }
          .badge { display: inline-block; background: rgba(212,175,55,0.15); color: #D4AF37; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style></head><body>
        ${printRef.current.innerHTML}
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{deal.code}</p>
          <h1 className="text-2xl font-bold text-slate-900">Presentazione <span className="text-[#D4AF37]">Deal</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setMode("blind")} className={"px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all " + (mode === "blind" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <EyeOff className="w-3.5 h-3.5 inline mr-1" /> Blind
            </button>
            <button onClick={() => setMode("full")} className={"px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all " + (mode === "full" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Full
            </button>
          </div>
          <button onClick={handlePrint} className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors flex items-center gap-2">
            <Printer className="w-3.5 h-3.5" /> Stampa / PDF
          </button>
        </div>
      </header>

      {/* Preview */}
      <div ref={printRef}>
        <div className="page" style={{ background: "#001220", color: "#f8fafc", borderRadius: "16px", padding: "48px", minHeight: "600px", fontFamily: "'DM Sans', sans-serif" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
            <div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "14px", color: "#D4AF37", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "8px" }}>
                Minerva Partners
              </p>
              <p style={{ fontSize: "11px", color: "#64748b", letterSpacing: "2px", textTransform: "uppercase" }}>
                {mode === "blind" ? "Blind Profile" : "Full Presentation"}
              </p>
            </div>
            <div style={{ background: "rgba(212,175,55,0.15)", color: "#D4AF37", padding: "6px 16px", borderRadius: "8px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
              {assetLabel}
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", color: "#D4AF37", marginBottom: "8px", lineHeight: 1.2 }}>
            {deal.title}
          </h1>

          {mode === "blind" && (
            <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "32px", lineHeight: 1.6, maxWidth: "600px" }}>
              {deal.blind_description || deal.teaser_description || deal.description || ""}
            </p>
          )}

          {mode === "full" && (
            <p style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "32px", lineHeight: 1.6 }}>
              {deal.description || ""}
            </p>
          )}

          {/* Key metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "24px" }}>
            <MetricCard label="Settore" value={mode === "blind" ? (deal.sector || "Confidenziale") : (deal.sector || "N/A")} />
            <MetricCard label="EV Range" value={deal.ev_range || deal.estimated_ev || "N/A"} />
            <MetricCard label="Side" value={deal.side || "N/A"} />
            {mode === "full" && (
              <>
                <MetricCard label="Geografia" value={deal.geography || deal.location || "N/A"} />
                <MetricCard label="Tipo Operazione" value={deal.deal_type || "N/A"} />
                {deal.asset_class === "m_and_a" && checklist.revenue && (
                  <MetricCard label="Fatturato" value={`€ ${Number(checklist.revenue).toLocaleString("it-IT")}`} />
                )}
                {deal.asset_class === "m_and_a" && checklist.ebitda && (
                  <MetricCard label="EBITDA" value={`€ ${Number(checklist.ebitda).toLocaleString("it-IT")}`} />
                )}
                {deal.asset_class === "real_estate" && checklist.surface_sqm && (
                  <MetricCard label="Superficie" value={`${checklist.surface_sqm} mq`} />
                )}
                {deal.asset_class === "real_estate" && checklist.asking_price && (
                  <MetricCard label="Prezzo Richiesto" value={`€ ${Number(checklist.asking_price).toLocaleString("it-IT")}`} />
                )}
                {deal.asset_class === "club_deal" && checklist.target_return && (
                  <MetricCard label="Rendimento Target" value={checklist.target_return} />
                )}
                {deal.asset_class === "club_deal" && checklist.min_ticket && (
                  <MetricCard label="Ticket Minimo" value={`€ ${Number(checklist.min_ticket).toLocaleString("it-IT")}`} />
                )}
              </>
            )}
          </div>

          {/* Blind-specific: generic rationale */}
          {mode === "blind" && deal.asset_class === "m_and_a" && checklist.sell_reason && (
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#D4AF37", marginBottom: "12px" }}>
                Razionale Strategico
              </h2>
              <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>{checklist.sell_reason}</p>
            </div>
          )}

          {/* Full-specific: all checklist data */}
          {mode === "full" && Object.keys(checklist).length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#D4AF37", marginBottom: "16px" }}>
                Dettagli Operazione
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {Object.entries(checklist).map(([key, value]) => (
                  <div key={key} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                    <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#64748b", marginBottom: "4px" }}>
                      {key.replace(/_/g, " ")}
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0" }}>{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full: originator */}
          {mode === "full" && originatorName && (
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#D4AF37", marginBottom: "8px" }}>
                Team Minerva
              </h2>
              <p style={{ fontSize: "13px", color: "#cbd5e1" }}>Originator: {originatorName}</p>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid rgba(212,175,55,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: "#D4AF37", fontWeight: 700 }}>
              Minerva Partners
            </p>
            <div style={{ textAlign: "right", fontSize: "10px", color: "#64748b" }}>
              {mode === "blind" ? (
                <p>Opportunità riservata — Per accedere al dossier completo contattare il proprio referente Minerva</p>
              ) : (
                <p>Documento riservato — Distribuzione non autorizzata</p>
              )}
              <p style={{ marginTop: "4px" }}>{deal.code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", padding: "16px" }}>
      <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#D4AF37", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>{value}</p>
    </div>
  );
}
