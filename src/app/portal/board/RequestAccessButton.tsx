"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function RequestAccessButton({ dealId, isAdmin }: { dealId: string; isAdmin?: boolean }) {
  const supabase = createClient();
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
    if (!error) {
      setStatus("pending");
      try {
        fetch("/api/notify-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId }),
        });
      } catch (e) {}
    }
    setLoading(false);
    setShowForm(false);
  };

  if (status === "loading") return <div className="h-8 w-24 bg-slate-50 animate-pulse rounded" />;

  if (isAdmin || status === "approved") return (
    <Link href={"/portal/deals/" + dealId} className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors">Apri Dossier</Link>
  );

  if (status === "pending") return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">In Attesa</span>
  );

  if (status === "rejected") return (
    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">Rifiutata</span>
  );

  if (showForm) return (
    <div className="flex flex-col gap-2 items-end">
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo della richiesta..." className="w-64 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37]" rows={2} />
      <div className="flex gap-2">
        <button onClick={() => setShowForm(false)} className="text-[9px] text-slate-400 uppercase tracking-wider px-3 py-1">Annulla</button>
        <button onClick={handleRequest} disabled={loading || !reason.trim()} className="bg-[#D4AF37] text-white px-4 py-1.5 rounded-lg text-[9px] font-bold tracking-widest uppercase disabled:opacity-50 hover:bg-[#b8962d] transition-colors">Invia</button>
      </div>
    </div>
  );

  return (
    <button onClick={() => setShowForm(true)} className="bg-[#D4AF37] text-white px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Richiedi Info</button>
  );
}