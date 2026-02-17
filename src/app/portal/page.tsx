"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Briefcase, PlusCircle, ClipboardList, Settings } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
        setName(data?.full_name || "Partner");
        setRole(data?.role || "");
      }
    }
    load();
  }, []);

  const isAdmin = role === "admin" || role === "equity_partner";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
        <h1 className="text-3xl font-bold text-slate-900">Bentornato, <span className="text-[#D4AF37]">{name}</span></h1>
        <p className="text-slate-500 text-sm mt-2">Private Marketplace Dashboard</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/board" className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
          <Briefcase className="w-5 h-5 mb-4 text-[#D4AF37]" />
          <h3 className="text-slate-900 text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">Bacheca Deal</h3>
          <p className="text-slate-500 text-xs">Esplora le opportunita riservate</p>
        </Link>
        <Link href="/portal/propose-deal" className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
          <PlusCircle className="w-5 h-5 mb-4 text-emerald-500" />
          <h3 className="text-slate-900 text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">Proponi Deal</h3>
          <p className="text-slate-500 text-xs">Sottoponi una nuova operazione</p>
        </Link>
        <Link href="/portal/settings" className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
          <Settings className="w-5 h-5 mb-4 text-slate-400" />
          <h3 className="text-slate-900 text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">Impostazioni</h3>
          <p className="text-slate-500 text-xs">Gestisci il tuo account</p>
        </Link>
      </div>

      {isAdmin && (
        <div className="mt-8">
          <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-3">Amministrazione</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/portal/access-requests" className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
              <ClipboardList className="w-5 h-5 mb-4 text-[#D4AF37]" />
              <h3 className="text-slate-900 text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">Richieste Accesso</h3>
              <p className="text-slate-500 text-xs">Approva o rifiuta le richieste</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}