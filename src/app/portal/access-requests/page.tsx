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

  const cards = [
    { name: "Bacheca Deal", desc: "Esplora le opportunita riservate", href: "/portal/board", icon: Briefcase, color: "text-[#D4AF37]" },
    { name: "Proponi Deal", desc: "Sottoponi una nuova operazione", href: "/portal/propose-deal", icon: PlusCircle, color: "text-emerald-400" },
    { name: "Impostazioni", desc: "Gestisci il tuo account", href: "/portal/settings", icon: Settings, color: "text-slate-400" },
  ];

  const adminCards = [
    { name: "Richieste Accesso", desc: "Approva o rifiuta le richieste", href: "/portal/access-requests", icon: ClipboardList, color: "text-[#D4AF37]" },
  ];

  return (
    <div className="min-h-screen bg-[#001220] pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <header className="mb-12 pb-8 border-b border-white/10">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Minerva Partners</p>
          <h1 className="text-3xl font-light text-white">Bentornato, <span className="text-[#D4AF37]">{name}</span></h1>
          <p className="text-slate-500 text-sm mt-2">Private Marketplace Dashboard</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="group bg-[#001c30] border border-white/5 rounded-xl p-6 hover:border-[#D4AF37]/20 transition-all">
              <card.icon className={"w-5 h-5 mb-4 " + card.color} />
              <h3 className="text-white text-sm font-medium mb-1 group-hover:text-[#D4AF37] transition-colors">{card.name}</h3>
              <p className="text-slate-500 text-xs">{card.desc}</p>
            </Link>
          ))}
        </div>

        {isAdmin && (
          <div className="mt-8">
            <p className="text-slate-600 text-[9px] uppercase tracking-widest font-bold mb-3">Amministrazione</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {adminCards.map((card) => (
                <Link key={card.href} href={card.href} className="group bg-[#001c30] border border-[#D4AF37]/10 rounded-xl p-6 hover:border-[#D4AF37]/30 transition-all">
                  <card.icon className={"w-5 h-5 mb-4 " + card.color} />
                  <h3 className="text-white text-sm font-medium mb-1 group-hover:text-[#D4AF37] transition-colors">{card.name}</h3>
                  <p className="text-slate-500 text-xs">{card.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}