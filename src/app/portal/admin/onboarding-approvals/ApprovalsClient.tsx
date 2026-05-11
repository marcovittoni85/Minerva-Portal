"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, FileText, Download, CheckCircle2, XCircle, Clock, AlertCircle, Mail, Phone, Building, Calendar, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Pending {
  id: string
  user_id: string
  storage_path: string
  original_filename: string
  file_size_bytes: number
  mime_type: string
  codici_accepted: any[]
  uploaded_at: string
  uploaded_ip: string
  uploaded_user_agent: string
  approval_status: string
  rejection_reason?: string
  signed_url: string
  profile: {
    email: string
    full_name: string
    role: string
    ruolo_enumerato?: string
    partner_line?: string
    company?: string
    position?: string
    phone?: string
    created_at?: string
  }
}

export function ApprovalsClient() {
  const router = useRouter()
  const supabase = createClient()
  const [pendings, setPendings] = useState<Pending[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) { router.push("/login"); return }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      router.push("/portal")
      return
    }

    await loadPendings()
  }

  async function loadPendings() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/onboarding-approvals")
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Errore caricamento")
        setLoading(false)
        return
      }
      const data = await res.json()
      setPendings(data.pendings || [])
    } catch {
      setError("Errore di rete")
    }
    setLoading(false)
  }

  async function handleAction(signatureId: string, action: "approve" | "reject", reason?: string) {
    setActionLoading(signatureId)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/admin/onboarding-approvals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_id: signatureId,
          action,
          rejection_reason: reason,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Errore")
      } else {
        setSuccess(action === "approve" ? "Approvato e notifica inviata" : "Rifiutato e notifica inviata")
        await loadPendings()
        setRejectModal(null)
        setRejectReason("")
      }
    } catch {
      setError("Errore di rete")
    }
    setActionLoading(null)
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const pendingOnly = pendings.filter(p => p.approval_status === "pending")
  const rejectedOnly = pendings.filter(p => p.approval_status === "rejected")

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-6 h-6 text-[#D4AF37]" />
          <h1 className="text-2xl font-bold text-slate-900">Approvazione Onboarding</h1>
        </div>
        <p className="text-slate-500 text-sm">Verifica e approva le firme dei Patti di Ingresso inviate dai partner.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-700 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              In attesa di approvazione ({pendingOnly.length})
            </h2>
            {pendingOnly.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm">
                Nessuna firma in attesa di approvazione
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOnly.map(p => (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{p.profile.full_name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> {p.profile.email}
                          </span>
                          {p.profile.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3" /> {p.profile.phone}
                            </span>
                          )}
                          {p.profile.company && (
                            <span className="flex items-center gap-1.5">
                              <Building className="w-3 h-3" /> {p.profile.company}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {p.profile.role && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-widest text-slate-600">
                              {p.profile.role}
                            </span>
                          )}
                          {p.profile.ruolo_enumerato && (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-widest text-amber-700">
                              {p.profile.ruolo_enumerato}
                            </span>
                          )}
                          {p.profile.partner_line && (
                            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold uppercase tracking-widest text-blue-700">
                              {p.profile.partner_line}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          <Clock className="w-3 h-3" /> In attesa
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Firma caricata</div>
                        <div className="text-xs text-slate-700 flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> {formatDate(p.uploaded_at)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">IP</div>
                        <div className="text-xs text-slate-700 font-mono">{p.uploaded_ip}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">File</div>
                        <div className="text-xs text-slate-700 flex items-center gap-2">
                          <FileText className="w-3 h-3" /> {p.original_filename} ({formatBytes(p.file_size_bytes)})
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Codici accettati</div>
                        <div className="text-xs text-slate-700">{(p.codici_accepted || []).length} di 3</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {p.signed_url && (
                        <a href={p.signed_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50">
                          <Download className="w-3 h-3" /> Visualizza Patto Firmato
                        </a>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => setRejectModal({ id: p.id, name: p.profile.full_name })}
                        disabled={actionLoading === p.id}
                        className="px-4 py-2.5 border border-red-200 text-red-700 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="w-3 h-3" /> Rifiuta
                      </button>
                      <button
                        onClick={() => handleAction(p.id, "approve")}
                        disabled={actionLoading === p.id}
                        className="px-4 py-2.5 bg-[#0f172a] text-[#D4AF37] rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Approva
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rejectedOnly.length > 0 && (
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Rifiutate ({rejectedOnly.length})
              </h2>
              <div className="space-y-3">
                {rejectedOnly.map(p => (
                  <div key={p.id} className="border border-red-100 bg-red-50/30 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{p.profile.full_name}</h3>
                        <p className="text-xs text-slate-500">{p.profile.email}</p>
                        {p.rejection_reason && (
                          <p className="text-xs text-red-700 mt-2 bg-white p-2 rounded border border-red-100">
                            <strong>Motivazione:</strong> {p.rejection_reason}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-700">Rifiutata</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Rifiuta firma di {rejectModal.name}</h3>
            <p className="text-xs text-slate-500 mb-4">Inserisci la motivazione del rifiuto. Verra inviata via email al partner.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Es: Firma non leggibile, ricaricare il documento..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-[#D4AF37]"
            />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason("") }}
                className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                Annulla
              </button>
              <button
                onClick={() => handleAction(rejectModal.id, "reject", rejectReason)}
                disabled={rejectReason.trim().length < 5 || actionLoading === rejectModal.id}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === rejectModal.id && <Loader2 className="w-3 h-3 animate-spin" />}
                Conferma rifiuto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
