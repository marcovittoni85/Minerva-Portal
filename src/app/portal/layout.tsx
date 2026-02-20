'use client';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, ShieldCheck, PlusCircle, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const [isOriginator, setIsOriginator] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setRole(data?.role || "");
        const { count } = await supabase.from("deals").select("id", { count: "exact", head: true }).eq("originator_id", user.id).eq("active", true);
        setIsOriginator((count ?? 0) > 0);
      }
    }
    load();
  }, []);

  const isAdmin = role === "admin" || role === "equity_partner";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'Bacheca Deal', href: '/portal/board', icon: Briefcase },
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: ShieldCheck },
    { name: 'Proponi Deal', href: '/portal/propose-deal', icon: PlusCircle },
    { name: 'Impostazioni', href: '/portal/settings', icon: Settings },
  ];

  const adminItems = [
    { name: 'Richieste Accesso', href: '/portal/access-requests', icon: ClipboardList },
    { name: 'Proposte Deal', href: '/portal/deal-proposals', icon: Briefcase },
  ];

  const originatorItems = [
    { name: 'Richieste Accesso', href: '/portal/access-requests', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <Image src="/icon.webp" alt="Minerva" width={30} height={30} unoptimized />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-5 h-5" /></button>
      </div>

      <aside className={"fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transform transition-transform md:relative md:translate-x-0 flex flex-col " + (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-8 flex items-center space-x-3">
          <Image src="/icon.webp" alt="Minerva" width={35} height={35} unoptimized />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Minerva Partners</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={"flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + (pathname === item.href ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}>
              <item.icon className="w-4 h-4" /> <span>{item.name}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="px-4 mb-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Admin</p>
              </div>
              {adminItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={"flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + (pathname === item.href ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}>
                  <item.icon className="w-4 h-4" /> <span>{item.name}</span>
                </Link>
              ))}
            </>
          )}

          {!isAdmin && isOriginator && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="px-4 mb-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">I Tuoi Deal</p>
              </div>
              {originatorItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={"flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + (pathname === item.href ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}>
                  <item.icon className="w-4 h-4" /> <span>{item.name}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> <span>Esci</span>
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className="flex-1 bg-white">{children}</main>
    </div>
  );
}