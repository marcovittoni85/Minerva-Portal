'use client';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, ShieldCheck, PlusCircle, ClipboardList, Bell, Shield, Columns3, FileText, Key, Users, ArrowRightLeft, CheckCircle, XCircle, Megaphone, Calculator, Activity, ScrollText, CircleDollarSign, HeartHandshake, Gauge, CheckSquare, Calendar, BookOpen, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

function notifTypeIcon(type: string) {
  const map: Record<string, typeof Bell> = {
    access_request: Key,
    access_approved: CheckCircle,
    access_rejected: XCircle,
    workgroup_added: Users,
    declaration_received: FileText,
    step_changed: FileText,
    stage_changed: ArrowRightLeft,
    deal_proposal_approved: CheckCircle,
    deal_proposal_rejected: XCircle,
    new_deal_board: Megaphone,
  };
  return map[type] || Bell;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const [isOriginator, setIsOriginator] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          setRole(data?.role || "");
          const { count } = await supabase.from("deals").select("id", { count: "exact", head: true }).eq("originator_id", user.id).eq("active", true);
          setIsOriginator((count ?? 0) > 0);
          const { count: unread } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
          setUnreadCount(unread ?? 0);
        }
      } catch {
        // Auth or data fetch failed — continue with defaults
      }
    }
    load();
  }, [pathname]);

  const loadNotifs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
        setNotifs(data ?? []);
      }
    } catch {
      // Notification load failed — silent
    }
    setShowNotifs(!showNotifs);
  };

  const markAllRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
        setUnreadCount(0);
        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch {
      // Mark read failed — silent
    }
  };

  const handleNotifClick = async (n: any) => {
    try {
      if (!n.is_read) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      // silent
    }
    if (n.link) {
      setShowNotifs(false);
      router.push(n.link);
    }
  };

  const isAdmin = role === "admin";
  const isClient = role === "client";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Client role: minimal menu
  const clientItems = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: ShieldCheck },
    { name: 'Impostazioni', href: '/portal/settings', icon: Settings },
  ];

  const menuItems = isClient ? clientItems : [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'Bacheca Deal', href: '/portal/board', icon: Briefcase },
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: ShieldCheck },
    { name: 'Operazioni', href: '/portal/operations', icon: Activity },
    { name: 'Proponi Deal', href: '/portal/propose-deal', icon: PlusCircle },
    { name: 'Impostazioni', href: '/portal/settings', icon: Settings },
  ];

  const adminItems = [
    { name: 'Cockpit', href: '/portal/admin/cockpit', icon: Gauge },
    { name: 'Task', href: '/portal/admin/tasks', icon: CheckSquare },
    { name: 'Calendario', href: '/portal/admin/calendar', icon: Calendar },
    { name: 'Gestione Deal', href: '/portal/deal-manage', icon: Shield },
    { name: 'Pipeline', href: '/portal/pipeline', icon: Columns3 },
    { name: 'Audit Log', href: '/portal/audit-log', icon: FileText },
    { name: 'Hub Richieste', href: '/portal/hub/requests', icon: ClipboardList },
    { name: 'Richieste Accesso', href: '/portal/access-requests', icon: ClipboardList },
    { name: 'Proposte Deal', href: '/portal/deal-proposals', icon: Briefcase },
    { name: 'Simulatore Fee', href: '/portal/fee-simulator', icon: Calculator },
    { name: 'CRM', href: '/portal/crm', icon: Users },
    { name: 'Mandati', href: '/portal/mandates', icon: ScrollText },
    { name: 'Fee & Revenue', href: '/portal/fees', icon: CircleDollarSign },
    { name: 'Relazioni', href: '/portal/admin/relationships', icon: HeartHandshake },
    { name: 'Knowledge Base', href: '/portal/admin/knowledge-base', icon: BookOpen },
    { name: 'Dashboard Builder', href: '/portal/admin/dashboard-editor', icon: Palette },
    { name: 'Gestione Partner', href: '/portal/admin/partners', icon: Users },
    { name: 'Nuovo Deal', href: '/portal/admin/new-deal', icon: PlusCircle },
  ];

  const originatorItems = [
    { name: 'Richieste L1/L2', href: '/portal/access-requests', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <style>{`
        @keyframes bell-ring {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(5deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <Image src="/icon.webp" alt="Minerva" width={30} height={30} unoptimized />
        <div className="flex items-center gap-3">
          <button onClick={loadNotifs} className="relative">
            <Bell className={"w-5 h-5 " + (unreadCount > 0 ? "text-[#D4AF37]" : "text-slate-400")} style={unreadCount > 0 ? { animation: "bell-ring 0.8s ease-in-out 3", transformOrigin: "top center" } : undefined} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      <aside className={"fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transform transition-transform md:relative md:translate-x-0 flex flex-col " + (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/icon.webp" alt="Minerva" width={35} height={35} unoptimized />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Minerva Partners</span>
          </div>
          <button onClick={loadNotifs} className="relative hidden md:block">
            <Bell className={"w-4 h-4 transition-colors " + (unreadCount > 0 ? "text-[#D4AF37]" : "text-slate-400 hover:text-[#D4AF37]")} style={unreadCount > 0 ? { animation: "bell-ring 0.8s ease-in-out 3", transformOrigin: "top center" } : undefined} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
          </button>
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
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={"flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + (pathname.startsWith(item.href) ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}>
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

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-slate-50">
          <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /> <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Notification panel */}
      {showNotifs && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowNotifs(false)} />
          <div className="fixed top-0 right-0 z-50 w-full sm:w-80 max-h-screen bg-white border-l border-slate-100 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Notifiche</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider hover:underline">Segna tutte lette</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Nessuna notifica</p>
                  <p className="text-[10px] text-slate-300 mt-1">Le tue notifiche appariranno qui</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const NotifIcon = notifTypeIcon(n.type);
                  return (
                    <div key={n.id} onClick={() => handleNotifClick(n)} className={"px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors " + (!n.is_read ? "bg-[#D4AF37]/5" : "")}>
                      <div className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read ? "bg-[#D4AF37]/10" : "bg-slate-50"}`}>
                          <NotifIcon className={`w-3 h-3 ${!n.is_read ? "text-[#D4AF37]" : "text-slate-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <Link href="/portal/notifications" onClick={() => setShowNotifs(false)} className="block p-3 border-t border-slate-100 text-center text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:bg-slate-50 transition-colors">
              Vedi tutte
            </Link>
          </div>
        </>
      )}

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className={"flex-1 bg-white " + (isMobileMenuOpen ? "overflow-hidden max-h-screen" : "")}>{children}</main>
    </div>
  );
}