"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function RequestAccessButton({ dealId }: { dealId: string }) {
  const supabase = supabaseBrowser();
  const [status, setStatus] = useState<"loading" | "none" | "pending" | "approved" | "rejected">("loading");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Controlla se ha già l'accesso approvato
      const { data: access } = await supabase
        .from("deal_access")
        .select("*")
        .eq("deal_id", dealId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (access) {
        setStatus("approved");
        return;
      }

      // 2. Controlla se c'è una richiesta pendente
      const { data: request } = await supabase
        .from("deal_access_requests")
        .select("status")
        .eq("deal_id", dealId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (request) {
        setStatus(request.status as any);
      } else {
        setStatus("none");
      }
    }
    checkStatus();
  }, [dealId, supabase]);

  const handleRequest = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("deal_access_requests")
      .insert({ deal_id: dealId, user_id: user?.id, status: "pending" });

    if (!error) {
      setStatus("pending");
    }
    setLoading(false);
  };

  if (status === "loading") return <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />;
  
  if (status === "approved") return (
    <div className="flex items-center text-green-400 text-[9px] uppercase tracking-widest font-bold">
      <CheckCircle className="w-3 h-3 mr-2" /> Accesso Autorizzato
    </div>
  );

  if (status === "pending") return (
    <div className="flex items-center text-[#D4AF37] text-[9px] uppercase tracking-widest font-bold bg-[#D4AF37]/5 px-3 py-2 rounded border border-[#D4AF37]/20">
      <Clock className="w-3 h-3 mr-2 animate-pulse" /> Richiesta in Sospeso
    </div>
  );

  if (status === "rejected") return (
    <div className="flex items-center text-red-400 text-[9px] uppercase tracking-widest font-bold">
      <AlertCircle className="w-3 h-3 mr-2" /> Richiesta Rifiutata
    </div>
  );

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="bg-[#D4AF37] text-[#001220] px-4 py-2 text-[9px] font-bold tracking-[0.2em] uppercase hover:bg-[#FBE8A6] transition-all disabled:opacity-50 flex items-center"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Richiedi Accesso"}
    </button>
  );
}