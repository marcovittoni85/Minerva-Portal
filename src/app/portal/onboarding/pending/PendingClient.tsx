"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, LogOut, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export function PendingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<string>("loading")

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push("/login"); return }

      const { data } = await supabase
        .from("profiles")
        .select("onboarding_status")
        .eq("id", user.id)
        .single()

      const s = data?.onboarding_status || "in_progress"
      if (s === "approved") {
        router.push("/portal")
      } else if (s === "in_progress") {
        router.push("/portal/onboarding")
      } else {
        setStatus(s)
      }
    }
    check()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-slate-400 text-sm">Caricamento...</div></div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/icon.webp" alt="Minerva" width={30} height={30} unoptimized />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Minerva Partners</span>
        </div>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 flex items-center gap-2 text-xs">
          <LogOut className="w-3.5 h-3.5" /> Esci
        </button>
      </header>

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-65px)]">
        <div className="w-full max-w-xl text-center">
          {status === "pending_approval" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Patto inviato con successo</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Un amministratore Minerva sta verificando la tua firma e i documenti caricati.<br />
                Riceverai una notifica email entro 24 ore con l esito.
              </p>
              <div className="border border-slate-200 rounded-xl p-4 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-slate-700">Codici accettati</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-slate-700">Patto firmato caricato</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-slate-700">In attesa di approvazione admin</span>
                </div>
              </div>
            </>
          ) : status === "rejected" ? (
            <>
              <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Documenti rifiutati</h1>
              <p className="text-slate-500 text-sm mb-6">
                Un amministratore ha rifiutato la tua richiesta. Controlla la tua email per i dettagli e ri-invia i documenti corretti.
              </p>
              <button onClick={() => router.push("/portal/onboarding")} className="px-6 py-3 bg-[#0f172a] text-[#D4AF37] rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800">Ri-invia documenti</button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
