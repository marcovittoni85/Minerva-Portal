"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Download, CheckSquare, Square, LogOut, Upload, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface CodiceDoc {
  id: string
  nome: string
  versione: string
  signedUrl: string
}

interface Patto {
  nome: string
  signedUrl: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  onboarding_completed: boolean
  onboarding_status?: string
}

export function OnboardingClient() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [codici, setCodici] = useState<CodiceDoc[]>([])
  const [patto, setPatto] = useState<Patto | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) { router.push("/login"); return }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, email, onboarding_completed, onboarding_status")
          .eq("id", user.id)
          .single()

        if (!profileData) { router.push("/login"); return }

        if (profileData.onboarding_status === "approved") {
          router.push("/portal")
          return
        }

        if (profileData.onboarding_status === "pending_approval") {
          router.push("/portal/onboarding/pending")
          return
        }

        setProfile(profileData)

        const res = await fetch("/api/onboarding/codici")
        if (res.ok) {
          const data = await res.json()
          setCodici(data.codici || [])
          setPatto(data.patto || null)
        }
      } catch (e) {
        console.error("Load error:", e)
      } finally {
        setInitialLoading(false)
      }
    }
    loadData()
  }, [])

  const allAccepted = codici.length > 0 && codici.every(c => accepted[c.id])

  const toggleAccept = (id: string) => {
    setAccepted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
    if (!allowedTypes.includes(file.type)) {
      setError("Formato non valido. Carica PDF, PNG o JPG.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File troppo grande. Max 10MB.")
      return
    }
    setUploadedFile(file)
  }

  const handleSubmit = async () => {
    if (!allAccepted || !uploadedFile) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("ip", "unknown")
      formData.append("userAgent", navigator.userAgent)
      formData.append("codiciAccepted", JSON.stringify(
        codici.map(c => ({ id: c.id, nome: c.nome, versione: c.versione }))
      ))

      const res = await fetch("/api/onboarding/sign", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Errore durante l invio")
      } else {
        router.push("/portal/onboarding/pending")
      }
    } catch {
      setError("Errore di rete")
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  if (initialLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-slate-400 text-sm">Caricamento...</div></div>
  }

  if (!profile) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-slate-400 text-sm">Reindirizzamento...</div></div>
  }

  const firstName = profile.full_name ? profile.full_name.split(" ")[0] : ""
  const canSubmit = allAccepted && uploadedFile !== null && !loading

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

      <div className="flex items-start justify-center p-6 min-h-[calc(100vh-65px)]">
        <div className="w-full max-w-2xl py-6">
          <div className="text-center mb-10">
            <Image src="/icon.webp" alt="Minerva" width={50} height={50} className="mx-auto mb-4" unoptimized />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Benvenuto in Minerva, {firstName}</h1>
            <p className="text-slate-500 text-sm">
              Per entrare nell ecosistema completa i 3 step seguenti
            </p>
          </div>

          {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span></div>}

          <div className="mb-8">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Step 1 di 3 — Lettura e accettazione Codici</div>
            <div className="space-y-3">
              {codici.map(codice => {
                const isAccepted = !!accepted[codice.id]
                return (
                  <div key={codice.id} className={"border rounded-xl p-4 " + (isAccepted ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white")}>
                    <div className="flex items-center gap-4">
                      <div className={"w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 " + (isAccepted ? "bg-emerald-100" : "bg-slate-100")}>
                        <FileText className={"w-5 h-5 " + (isAccepted ? "text-emerald-600" : "text-slate-400")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">{codice.nome}</h3>
                        {codice.signedUrl ? (
                          <a href={codice.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] mt-1">
                            <Download className="w-3 h-3" /> Scarica PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">PDF non disponibile</span>
                        )}
                      </div>
                      <button onClick={() => toggleAccept(codice.id)} className="flex-shrink-0">
                        {isAccepted ? <CheckSquare className="w-6 h-6 text-emerald-600" /> : <Square className="w-6 h-6 text-slate-300 hover:text-[#D4AF37]" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={"mb-8 transition-opacity " + (allAccepted ? "opacity-100" : "opacity-40 pointer-events-none")}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Step 2 di 3 — Scarica e firma il Patto</div>
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/40">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">{patto?.nome || "Patto di Ingresso"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Scarica, stampa o firma digitalmente, poi ricarica la copia firmata.</p>
                </div>
              </div>
              {patto?.signedUrl ? (
                <a href={patto.signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d]">
                  <Download className="w-3 h-3" /> Scarica Patto da firmare
                </a>
              ) : null}
            </div>
          </div>

          <div className={"mb-8 transition-opacity " + (allAccepted ? "opacity-100" : "opacity-40 pointer-events-none")}>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Step 3 di 3 — Carica Patto firmato</div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#D4AF37] transition-colors">
              <input
                type="file"
                id="patto-upload"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="patto-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {uploadedFile ? (
                  <>
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-700">{uploadedFile.name}</span>
                    <span className="text-[10px] text-slate-400">{(uploadedFile.size / 1024).toFixed(0)} KB - Click per cambiare</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Click per caricare il Patto firmato</span>
                    <span className="text-[10px] text-slate-400">PDF, PNG, JPG - Max 10MB</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={"w-full py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all " + (canSubmit ? "bg-[#0f172a] text-[#D4AF37] hover:bg-slate-800" : "bg-slate-100 text-slate-400 cursor-not-allowed")}
          >
            {loading ? "Invio in corso..." : "Invia per approvazione"}
          </button>

          <p className="text-center text-[10px] text-slate-400 mt-4">
            Un amministratore verifichera la firma e ti contattera entro 24h.
          </p>
        </div>
      </div>
    </div>
  )
}
