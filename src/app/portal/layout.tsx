'use client';

import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Settings, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Uso window.location per resettare la sessione ed evitare redirect a localhost
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
    { name: 'Bacheca Deal', href: '/portal/board', icon: Briefcase },
    { name: 'I Miei Deal', href: '/portal/my-deals', icon: Briefcase },
    { name: 'Impostazioni', href: '/portal/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50">
        <Image src="/icon.webp" alt="Minerva" width={32} height={32} unoptimized />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="p-8 border-b border-slate-100 flex items-center space-x-3">
          <Image src="/icon.webp" alt="Minerva" width={40} height={40} unoptimized />
          <div>
            <p className="text-slate-900 font-bold text-xs tracking-widest uppercase">Minerva</p>
            <p className="text-[#D4AF37] text-[9px] font-bold uppercase tracking-tighter text-white/50">Partners</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive 
                    ? 'bg-slate-100 text-[#D4AF37] font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Esci dal Portale</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  );
}