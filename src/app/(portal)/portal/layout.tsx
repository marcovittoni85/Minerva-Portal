import NotificationsBell from "./NotificationsBell";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  const uid = data.user?.id;
  const email = data.user?.email ?? "";

  // Recupero ruolo dal database
  let role = "";
  if (uid) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();

    role = (prof?.role as any)?.toString?.() ?? String(prof?.role ?? "");
  }

  const roleLc = role.toLowerCase();
  const isAdmin = roleLc === "admin" || roleLc === "equity_partner";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 min-h-screen border-r bg-white sticky top-0 flex flex-col">
          <div className="p-6 border-b">
            <div className="text-xs tracking-[0.35em] text-slate-400 font-bold">MINERVA</div>
            <div className="text-lg font-bold text-slate-900">Portal</div>
            <div className="text-[11px] text-slate-500 mt-2 truncate">{email}</div>
            <div className="inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded mt-1 uppercase">
              {role || "Partner"}
            </div>
          </div>

          <nav className="p-4 flex-1 space-y-1">
            <p className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              Menu principale
            </p>
            <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors" href="/portal">
              Dashboard
            </Link>
            <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors" href="/portal/my-deals">
              💼 I Miei Investimenti
            </Link>
            <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors" href="/portal/deals">
              Operazioni
            </Link>
            <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm font-medium transition-colors" href="/portal/funnel">
              Funnel Board
            </Link>

            {/* Sezione Amministrazione Protetta */}
            {isAdmin && (
              <div className="pt-6 mt-4 border-t border-slate-100">
                <p className="px-3 mb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Management
                </p>
                <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-700 text-sm font-semibold transition-colors" href="/portal/access-requests">
                  🔑 Richieste Accesso
                </Link>
                <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors" href="/portal/moderation/deals">
                  Approva Nuovi Deal
                </Link>
                <Link className="flex items-center px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors" href="/portal/moderation/comments">
                  Moderazione Commenti
                </Link>
              </div>
            )}
          </nav>

          <div className="p-4 border-t">
            <form action="/portal/logout" method="post">
              <button className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 text-sm font-medium transition-colors">
                Logout
              </button>
            </form>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-h-screen">
          <header className="flex items-center justify-end px-10 py-6">
            <NotificationsBell />
          </header>
          <div className="px-10 pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}