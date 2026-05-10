'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, CheckSquare, Square, Clock, Shield } from 'lucide-react'
import Image from 'next/image'

interface CodiceDoc {
  id: string
  nome: string
  versione: string
  signedUrl: string
}

interface Props {
  profile: { id: string; full_name: string; email: string }
  codici: CodiceDoc[]
  daysRemaining: number
  deadline: string
}

export function OnboardingClient({ profile, codici, daysRemaining, deadline }: Props) {
  const router = useRouter()
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [openModal, setOpenModal] = useState<{ url: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAccepted = codici.every(c => accepted[c.id])
  const progressPct = Math.round((Object.values(accepted).filter(Boolean).length / codici.length) * 100)

  const toggleAccept = (id: string) => {
    setAccepted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSign = async () => {
    if (!allAccepted) return
    setLoading(true)
    setError(null)

    try {
      let ip = 'unknown'
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        ip = ipData.ip
      } catch { /* fallback */ }

      const res = await fetch('/api/onboarding/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip,
          userAgent: navigator.userAgent,
          codiciAccepted: codici.map(c => ({ id: c.id, nome: c.nome, versione: c.versione })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Errore durante la firma')
      } else {
        router.push('/portal')
      }
    } catch {
      setError('Errore di rete')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <Image src="/icon.webp" alt="Minerva" width={50} height={50} className="mx-auto mb-4" unoptimized />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Benvenuto in Minerva, {profile.full_name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm">
            Per entrare nell'ecosistema Minerva devi prendere visione e accettare {codici.length} documenti.
          </p>
        </div>

        {/* Countdown */}
        <div className={`mb-8 rounded-xl p-4 flex items-center gap-3 ${
          daysRemaining <= 5 ? 'bg-red-50 border border-red-200' :
          daysRemaining <= 10 ? 'bg-amber-50 border border-amber-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <Clock className={`w-5 h-5 flex-shrink-0 ${
            daysRemaining <= 5 ? 'text-red-500' : daysRemaining <= 10 ? 'text-amber-500' : 'text-blue-500'
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-bold ${
              daysRemaining <= 5 ? 'text-red-700' : daysRemaining <= 10 ? 'text-amber-700' : 'text-blue-700'
            }`}>
              {daysRemaining > 0
                ? `Hai ${daysRemaining} giorn${daysRemaining === 1 ? 'o' : 'i'} rimanent${daysRemaining === 1 ? 'e' : 'i'} per completare l'onboarding`
                : 'Termine scaduto — contatta l\'amministratore'
              }
            </p>
            <p className={`text-xs mt-0.5 ${
              daysRemaining <= 5 ? 'text-red-500' : daysRemaining <= 10 ? 'text-amber-500' : 'text-blue-500'
            }`}>
              Scadenza: {new Date(deadline).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-24">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  daysRemaining <= 5 ? 'bg-red-500' : daysRemaining <= 10 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1">{progressPct}% letto</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* Documents */}
        <div className="space-y-4 mb-8">
          {codici.map(codice => {
            const isAccepted = !!accepted[codice.id]
            return (
              <div key={codice.id} className={`border rounded-2xl p-6 transition-all ${
                isAccepted ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isAccepted ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}>
                    <FileText className={`w-6 h-6 ${isAccepted ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{codice.nome}</h3>
                    <p className="text-[10px] text-slate-400">Versione {codice.versione}</p>
                    <div className="flex items-center gap-4 mt-3">
                      {codice.signedUrl ? (
                        <>
                          <a
                            href={codice.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors"
                          >
                            <Download className="w-3 h-3" /> Scarica PDF
                          </a>
                          <button
                            onClick={() => setOpenModal({ url: codice.signedUrl, name: codice.nome })}
                            className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Leggi online
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">PDF non disponibile</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleAccept(codice.id)}
                  className="mt-4 flex items-center gap-3 w-full text-left py-2 group"
                >
                  {isAccepted ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 group-hover:text-[#D4AF37] flex-shrink-0 transition-colors" />
                  )}
                  <span className={`text-sm ${isAccepted ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    Ho letto e accetto integralmente il {codice.nome}
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        {/* Sign button */}
        <button
          onClick={handleSign}
          disabled={!allAccepted || loading}
          className={`w-full py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2 ${
            allAccepted
              ? 'bg-[#0f172a] text-[#D4AF37] hover:bg-slate-800 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {loading ? (
            <span className="animate-pulse">Firma in corso...</span>
          ) : allAccepted ? (
            <>
              <Shield className="w-4 h-4" /> Firma e Conferma
            </>
          ) : (
            `Accetta tutti i codici per firmare (${progressPct}%)`
          )}
        </button>

        <p className="text-center text-[10px] text-slate-300 mt-6">
          La firma registrerà: timestamp, indirizzo IP e user agent del tuo browser.
        </p>
      </div>

      {/* Modal lettura PDF */}
      {openModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
          <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{openModal.name}</h3>
            <button
              onClick={() => setOpenModal(null)}
              className="text-slate-400 hover:text-slate-700 text-sm"
            >
              Chiudi &times;
            </button>
          </div>
          <iframe src={openModal.url} className="flex-1 w-full" />
        </div>
      )}
    </div>
  )
}
