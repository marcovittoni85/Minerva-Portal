"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import DynamicDashboard from "@/components/dashboard/DynamicDashboard";

export default function DashboardPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setName(profile?.full_name || "Partner");
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/dashboard-hero.webp"
            alt="Minerva Partners"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/30" />
        </div>
        <div className="relative z-10 px-4 md:px-8 py-12 md:py-16">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Bentornato, <span className="text-[#D4AF37]">{name}</span></h1>
          <p className="text-white/60 text-sm mt-2 max-w-md">Ecco cosa sta succedendo nel tuo network</p>
        </div>
      </div>

      {/* Dynamic Dashboard */}
      <DynamicDashboard />
    </div>
  );
}
