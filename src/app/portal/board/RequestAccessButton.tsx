"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function RequestAccessButton({ dealId }: { dealId: string }) {
  const supabase = supabaseBrowser();
  const [state, setState] = useState<"loading" | "has_access" | "pending" | "rejected" | "none">("loading");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return setState("none");

    const { data: acc, error: e1 } = await supabase.from("deal_access").select("access_level").eq("deal_id", dealId).eq("user_id", uid).maybeSingle();
    if (!e1 && acc) return setState("has_access");

    const { data: req, error: e2 } = await supabase.from("deal_access_requests").select("status").eq("deal_id", dealId).eq("user_id", uid).order("requested_at", { ascending: false }).limit(1).maybeSingle();
    if (!e2 && req) {
      if (req.status === "pending") return setState("pending");
      if (req.status === "rejected") return setState("rejected");
    }
    setState("none");
  }

  useEffect(() => { load(); }, [dealId]);

  async function request() {
    setMsg(null);
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return setMsg("Non autenticato.");

    const { error } = await supabase.from("deal_access_requests").insert({ deal_id: dealId, user_id: uid, status: "pending" });
    if (error) {
      if ((error as any).code === "23505" || error.message?.includes("duplicate key")) {
        setState("pending");
        return setMsg("Richiesta già inviata.");
      }
      return setMsg(error.message);
    }
    setState("pending");
    setMsg("Richiesta inviata.");
  }

  if (state === "loading") return <span className="text-xs text-slate-500">…</span>;
  if (state === "has_access") return <Link className="text-sm font-semibold text-green-600 underline" href={`/portal/deals/${dealId}`}>Apri Dossier</Link>;
  if (state === "pending") return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">⏳ In attesa di approvazione</span>;
  if (state === "rejected") return <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">Richiesta rifiutata</span>;

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <button onClick={request} className="rounded-xl border border-[#D4AF37]/30 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">Richiedi accesso</button>
      {msg && <div className="text-xs text-red-500">{msg}</div>}
    </div>
  );
}