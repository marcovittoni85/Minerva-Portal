'use client';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, ShieldCheck, PlusCircle, ClipboardList, Shield, Columns3, FileText, Users, UserPlus, Calculator, Activity, ScrollText, CircleDollarSign, HeartHandshake, Gauge, CheckSquare, Calendar, BookOpen, Palette, ChevronDown, DollarSign, User, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { NotificationCenter } from '@/components/topbar/NotificationCenter';
import { SearchBar } from '@/components/topbar/SearchBar';
import { cn } from '@/lib/utils';

interface AdminGroup {
  id: string;
  label: string;
  icon: any;
  items: { name: string; href: string; icon: any }[];
}

const ADMIN_GROUPS: AdminGroup[] = [
  {
    id: 'deal-flow',
    label: 'Deal Flow',
    icon: Briefcase,
    items: [
      { name: 'Gestione Deal', href: '/portal/deal-manage', icon: Shield },
      { name: 'Pipeline', href: '/portal/admin/pipeline', icon: Columns3 },
      { name: 'Nuovo Deal', href: '/portal/admin/new-deal', icon: PlusCircle },
      { name: 'Proposte Deal', href: '/portal/deal-proposals', icon: Briefcase },
    ],
  },
 {
    id: 'operations',
    label: 'Operations',
    icon: Activity,
    items: [
      { name: 'Cockpit', href: '/portal/admin/cockpit', icon: Gauge },
      { name: 'Approvazioni Onboarding', href: '/portal/admin/onboarding-approvals', icon: CheckSquare },
      { name: 'Task', href: '/portal/admin/tasks', icon: CheckSquare },
      { name: 'Calendario', href: '/portal/admin/calendar', icon: Calendar },
    ],
  },
  {
    id: 'people',
    label: 'People & CRM',
    icon: Users,
    items: [
      { name: 'CRM', href: '/portal/crm', icon: Users },
      { name: 'Relazioni', href: '/portal/admin/relationships', icon: HeartHandshake },
      { name: 'Gestione Partner', href: '/portal/admin/partners', icon: Users },
      { name: 'Richieste Accesso', href: '/portal/access-requests', icon: ClipboardList },
      { name: 'Invita Utente', href: '/portal/admin/invite-user', icon: UserPlus },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    items: [
      { name: 'Mandati', href: '/portal/mandates', icon: ScrollText },
      { name: 'Simulatore Fee', href: '/portal/fee-simulator', icon: Calculator },
      { name: 'Fee & Revenue', href: '/portal/fees', icon: CircleDollarSign },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: Shield,
    items: [
      { name: 'Audit Log', href: '/portal/audit-log', icon: FileText },
      { name: 'Knowledge Base', href: '/portal/admin/knowledge-base', icon: BookOpen },
      { name: 'Dashboard Builder', href: '/portal/admin/dashboard-editor', icon: Palette },
    ],
  },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isOriginator, setIsOriginator] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        setUserId(user.id);
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        setRole(data?.role || "");

        // ONBOARDING GATE: spostato nel middleware. Qui leggiamo solo i metadata UI.
        // Il middleware (src/middleware.ts) si occupa di redirezionare i non firmatari.

        const { count } = await supabase.from("deals").select("id", { count: "exact", head: true }).eq("originator_id", user.id).eq("active", true);
        setIsOriginator((count ?? 0) > 0);

        // Auto-expand admin group based on pathname
        for (const group of ADMIN_GROUPS) {
          if (group.items.some(item => pathname.startsWith(item.href))) {
            setOpenGroups(prev => ({ ...prev, [group.id]: true }));
          }
        }
      } catch {
        // Auth or data fetch failed - silently fall through
      }
    }
    load();
  }, []);

  const isAdmin = role === "admin";
  const isClient = role === "client";
  const isOnboarding = pathname?.startsWith("/portal/onboarding") || pathname === "/portal/change-password";

  // Onboarding/change-password: full-screen, no sidebar
  if (isOnboarding) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const clientItems = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: ShieldCheck },
    { name: 'Impostazioni', href: '/portal/settings', icon: Settings },
  ];

  interface MenuItem {
    name: string; href: string; icon: any;
    submenu?: { name: string; href: string }[];
  }

  const partnerItems: MenuItem[] = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'Bacheca Deal', href: '/portal/board', icon: Briefcase, submenu: [
      { name: 'M&A / Cessioni', href: '/portal/board?cat=ma' },
      { name: 'Real Estate Off-Market', href: '/portal/board?cat=re' },
      { name: 'Special Situations', href: '/portal/board?cat=ss' },
      { name: 'Energy Transition', href: '/portal/board?cat=energy' },
    ]},
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: ShieldCheck },
    { name: 'Proponi Deal', href: '/portal/propose-deal', icon: PlusCircle, submenu: [
      { name: 'Azienda (M&A)', href: '/portal/propose-deal?type=ma' },
      { name: 'Immobile Off-Market', href: '/portal/propose-deal?type=re' },
      { name: 'Cliente UHNW (Wealth)', href: '/portal/propose-deal?type=wealth' },
      { name: 'Family Advisory', href: '/portal/propose-deal?type=family' },
      { name: 'Protection (Insurance)', href: '/portal/propose-deal?type=protection' },
      { name: 'Altro', href: '/portal/propose-deal?type=other' },
    ]},
    { name: 'Knowledge Base', href: '/portal/knowledge-base', icon: BookOpen },
    { name: 'Network', href: '/portal/admin/relationships', icon: Network },
    { name: 'Calendario', href: '/portal/admin/calendar', icon: Calendar },
    { name: 'Profilo', href: '/portal/settings', icon: User },
  ];

  const menuItems: MenuItem[] = isClient ? clientItems : partnerItems;

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

      {/* Mobile header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <Image src="/icon.webp" alt="Minerva" width={30} height={30} unoptimized />
        <div className="flex items-center gap-3">
          {userId && <NotificationCenter userId={userId} />}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={"fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 transform transition-transform md:relative md:translate-x-0 flex flex-col overflow-y-auto " + (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/icon.webp" alt="Minerva" width={35} height={35} unoptimized />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Minerva Partners</span>
          </div>
          {userId && (
            <div className="hidden md:block">
              <NotificationCenter userId={userId} />
            </div>
          )}
        </div>

        {/* Search bar */}
        <div className="px-4 mb-3">
          <SearchBar />
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/') || pathname?.startsWith(item.href + '?')
            const hasSubmenu = item.submenu && item.submenu.length > 0
            const isSubmenuOpen = openGroups[item.href]
            const isSubmenuActive = hasSubmenu && item.submenu!.some(s => pathname?.startsWith(s.href.split('?')[0]))

            return (
              <div key={item.href}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={"flex-1 flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + ((isActive || isSubmenuActive) ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}
                  >
                    <item.icon className="w-4 h-4" /> <span>{item.name}</span>
                  </Link>
                  {hasSubmenu && (
                    <button
                      onClick={() => setOpenGroups(prev => ({ ...prev, [item.href]: !prev[item.href] }))}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isSubmenuOpen && "rotate-180")} />
                    </button>
                  )}
                </div>
                {hasSubmenu && isSubmenuOpen && (
                  <div className="ml-7 space-y-0.5 mt-0.5">
                    {item.submenu!.map(sub => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-1.5 rounded-lg text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="px-4 mb-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Admin</p>
              </div>
              {ADMIN_GROUPS.map((group) => {
                const isGroupActive = group.items.some(item => pathname.startsWith(item.href));
                const isOpen = openGroups[group.id] ?? isGroupActive;
                const GroupIcon = group.icon;

                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                        isGroupActive ? "text-[#D4AF37]" : "text-slate-400 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <GroupIcon className="w-4 h-4" />
                        <span>{group.label}</span>
                      </div>
                      <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="ml-4 space-y-0.5">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center space-x-3 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                              pathname.startsWith(item.href)
                                ? "bg-slate-50 text-[#D4AF37]"
                                : "text-slate-400 hover:text-slate-700"
                            )}
                          >
                            <item.icon className="w-3.5 h-3.5" />
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {!isAdmin && isOriginator && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="px-4 mb-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">I Tuoi Deal</p>
              </div>
              {originatorItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className={"flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all " + (pathname === item.href ? "bg-slate-50 text-[#D4AF37]" : "text-slate-400 hover:text-slate-900")}>
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

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <main className={"flex-1 min-w-0 bg-white " + (isMobileMenuOpen ? "overflow-hidden max-h-screen" : "")}>{children}</main>
    </div>
  );
}