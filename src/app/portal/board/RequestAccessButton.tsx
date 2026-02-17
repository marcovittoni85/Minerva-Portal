"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function RequestAccessButton({ dealId, isAdmin }: { dealId: string; isAdmin?: boolean }) {
  const supabase = supabaseBrowser();
  const [status, setStatus] = useState<"loading" | "none" | "pending" | "approved" | "rejected">("loading");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isAdmin) { setStatus("approved"); return; }
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: access } = await supabase.from("deal_access").select("*").eq("deal_id", dealId).eq("user_id", user.id).maybeSingle();
      if (access) { setStatus("approved"); return; }
      const { data: request } = await supabase.from("deal_access_requests").select("status").eq("deal_id", dealId).eq("user_id", user.id).maybeSingle();
      if (request) { setStatus(request.status as any); } else { setStatus("none"); }
    }
    checkStatus();
  }, [dealId, supabase, isAdmin]);

  const handleRequest = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("deal_access_requests").insert({ deal_id: dealId, user_id: user?.id, status: "pending", reason: reason.trim() });
    if (!error) setStatus("pending");
    setLoading(false);
    setShowForm(false);
  };

  if (status === "loading") return <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />;

  if (isAdmin || status === "approved") return (
    <Link href={"/portal/deals/" + dealId} className="text-[9px] font-bold uppercase tracking-widest text-green-400 hover:text-green-300 transition-colors">Apri Dossier</Link>
  );

  if (status === "pending") return (
    <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-2 rounded border border-[#D4AF37]/20">In Attesa</span>
  );

  if (status === "rejected") return (
    <span className="text-[9px] font-bold uppercase tracking-widest text-red-400">Rifiutata</span>
  );

  if (showForm) return (
    <div className="flex flex-col gap-2 items-end">
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo della richiesta..." className="w-64 bg-[#001220] border border-white/10 rounded-lg p-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-[#D4AF37]" rows={2} />
      <div className="flex gap-2">
        <button onClick={() => setShowForm(false)} className="text-[9px] text-slate-500 uppercase tracking-wider px-3 py-1">Annulla</button>
        <button onClick={handleRequest} disabled={loading || !reason.trim()} className="bg-[#D4AF37] text-[#001220] px-4 py-1.5 text-[9px] font-bold tracking-widest uppercase disabled:opacity-50">Invia</button>
      </div>
    </div>
  );

  return (
    <button onClick={() => setShowForm(true)} className="bg-[#D4AF37] text-[#001220] px-4 py-2 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-[#FBE8A6] transition-all">Richiedi Info</button>
  );
}