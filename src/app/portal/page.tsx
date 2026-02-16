import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  // 1. Recuperiamo l'utente dall'autenticazione
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Recuperiamo il profilo
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Errore profilo:", profileError.message);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">
          Bentornato, {profile?.full_name || "Partner"}
        </h1>
        <p className="text-slate-500 mt-2 italic">Dashboard Minerva Partners</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card Investimenti (Per Tutti) - Dove vedono le loro VDR */}
        <Link href="/portal/my-deals" className="group p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all border-slate-100">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
            📂
          </div>
          <h3 className="text-xl font-bold text-slate-900">I miei Investimenti</h3>
          <p className="text-slate-500 mt-2 text-sm">Accedi alle tue Data Room e ai documenti approvati.</p>
        </Link>

        {/* Card Deal Generali */}
        <Link href="/portal/deals" className="group p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all border-slate-100">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            💼
          </div>
          <h3 className="text-xl font-bold text-slate-900">Catalogo Deal</h3>
          <p className="text-slate-500 mt-2 text-sm">Visualizza tutti i dossier attivi e le opportunità.</p>
        </Link>

        {/* Card Approvazione Accessi (SOLO ADMIN) - Il cuore del sistema Make */}
        {profile?.role === 'admin' && (
          <Link href="/portal/access-requests" className="group p-8 bg-slate-900 border rounded-3xl shadow-sm hover:shadow-xl transition-all border-slate-800">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-green-500 transition-colors">
              🔑
            </div>
            <h3 className="text-xl font-bold text-white">Richieste Accesso</h3>
            <p className="text-slate-400 mt-2 text-sm">Approva i partner e attiva automaticamente le VDR.</p>
          </Link>
        )}

        {/* Card Moderazione (Solo per Admin) */}
        {profile?.role === 'admin' && (
          <Link href="/portal/moderation/comments" className="group p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all border-slate-100">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              💬
            </div>
            <h3 className="text-xl font-bold text-slate-900">Moderazione</h3>
            <p className="text-slate-500 mt-2 text-sm">Approva i commenti e gestisci la community.</p>
          </Link>
        )}

        {/* Card Profilo */}
        <Link href="/portal/settings" className="group p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all border-slate-100">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            ⚙️
          </div>
          <h3 className="text-xl font-bold text-slate-900">Impostazioni</h3>
          <p className="text-slate-500 mt-2 text-sm">Gestisci il tuo account e le preferenze.</p>
        </Link>
      </div>
    </div>
  );
}