'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SignaturePad from 'signature_pad'
import Image from 'next/image'
import { Shield, ChevronRight, ChevronLeft, Check, AlertTriangle } from 'lucide-react'
import { inputClass, labelClass, buttonPrimary, buttonSecondary } from '@/components/ui/form'

interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  role: string
}

const NDA_TEXT = `ACCORDO DI RISERVATEZZA PRELIMINARE
(NDA Trial 30 giorni — Minerva Partners)

TRA
Minerva Partners S.r.l., con sede legale in Via Roggia Vignola 9, 24047 Treviglio (BG), C.F./P.IVA 04XXXXXXXX, in persona del legale rappresentante pro tempore (di seguito "Minerva" o "Parte Divulgante")

E
Il Candidato identificato nella sezione di firma del presente accordo (di seguito "Candidato" o "Parte Ricevente")

(congiuntamente le "Parti")

PREMESSO CHE:
(a) Minerva Partners opera quale rete professionale di advisory specializzata in operazioni di M&A, Capital Markets, Real Estate, Private Debt e Special Situations;
(b) Il Candidato ha manifestato interesse ad entrare a far parte della rete Minerva Partners;
(c) Al fine di valutare la reciproca compatibilità, Minerva intende concedere al Candidato un periodo di prova ("Trial") della durata di 30 (trenta) giorni, durante il quale il Candidato avrà accesso limitato al portale e alle informazioni della rete;
(d) È necessario che il Candidato si impegni a mantenere la riservatezza su tutte le informazioni a cui avrà accesso durante il periodo di Trial.

TUTTO CIÒ PREMESSO, LE PARTI CONVENGONO QUANTO SEGUE:

Art. 1 — Definizioni
1.1 "Informazioni Riservate": qualsiasi informazione, dato, documento, know-how, strategia commerciale, lista clienti, dettagli di operazioni in corso o concluse, struttura retributiva, metodologie operative, software e tecnologie proprietarie di Minerva Partners, comunicata o resa accessibile al Candidato in qualsiasi forma (scritta, orale, elettronica, visiva) durante il periodo di Trial.
1.2 "Periodo di Trial": 30 (trenta) giorni di calendario decorrenti dalla data di sottoscrizione del presente accordo.
1.3 "Portale Minerva": la piattaforma tecnologica proprietaria di Minerva Partners accessibile via web.
1.4 "Rete Minerva": l'insieme dei Partner, Advisor e Friend che operano nell'ecosistema Minerva Partners.

Art. 2 — Oggetto
2.1 Il presente accordo disciplina gli obblighi di riservatezza del Candidato durante e dopo il Periodo di Trial.
2.2 Durante il Periodo di Trial, il Candidato avrà accesso a una versione limitata del Portale Minerva, potendo visualizzare:
(a) La bacheca dei deal pubblici (senza dettagli riservati);
(b) La struttura organizzativa della rete (senza dati personali dei membri);
(c) I Codici e regolamenti di Minerva Partners;
(d) Le funzionalità base del portale.
2.3 Il Candidato NON avrà accesso durante il Trial a:
(a) Dettagli specifici dei deal (valutazioni, termini, controparti);
(b) Dati personali e contatti dei membri della rete;
(c) Documenti riservati dei deal;
(d) Funzionalità di origination e workgroup.

Art. 3 — Obblighi di Riservatezza
3.1 Il Candidato si impegna a:
(a) Mantenere la più stretta riservatezza su tutte le Informazioni Riservate;
(b) Non divulgare, pubblicare, trasmettere o rendere comunque accessibili a terzi le Informazioni Riservate;
(c) Non utilizzare le Informazioni Riservate per finalità diverse dalla valutazione dell'ingresso nella Rete Minerva;
(d) Non riprodurre, copiare o duplicare in alcuna forma le Informazioni Riservate;
(e) Adottare misure di sicurezza adeguate a proteggere le Informazioni Riservate da accessi non autorizzati.

Art. 4 — Durata dell'obbligo di riservatezza
4.1 Gli obblighi di riservatezza previsti dal presente accordo si applicano durante il Periodo di Trial e per un periodo INDETERMINATO successivo alla sua conclusione, indipendentemente dall'esito della valutazione.
4.2 L'obbligo di riservatezza si estingue esclusivamente per quelle informazioni che:
(a) Diventino di pubblico dominio per causa non imputabile al Candidato;
(b) Siano state autonomamente sviluppate dal Candidato senza utilizzo delle Informazioni Riservate;
(c) Siano state legittimamente ottenute da terzi non vincolati da obblighi di riservatezza.

Art. 5 — Proprietà Intellettuale
5.1 Nessuna disposizione del presente accordo trasferisce al Candidato diritti di proprietà intellettuale su informazioni, marchi, software o metodologie di Minerva Partners.
5.2 Al termine del Periodo di Trial, il Candidato è tenuto a cancellare e distruggere qualsiasi copia di Informazioni Riservate in suo possesso.

Art. 6 — Non-Circumvention
6.1 Il Candidato si impegna, per un periodo di 12 (dodici) mesi dalla conclusione del Periodo di Trial, a non:
(a) Contattare direttamente soggetti conosciuti tramite il Portale Minerva o presentati durante il Trial per finalità di business;
(b) Proporre operazioni o servizi a controparti o clienti di Minerva Partners di cui sia venuto a conoscenza durante il Trial;
(c) Tentare di reclutare o distogliere membri della Rete Minerva.

Art. 7 — Penali
7.1 In caso di violazione degli obblighi di cui agli Artt. 3, 4, 5 e 6, il Candidato sarà tenuto al pagamento di una penale di EUR 50.000,00 (cinquantamila/00) per ciascuna violazione accertata, fatto salvo il risarcimento del maggior danno.
7.2 Le Parti riconoscono che la penale pattuita è proporzionata all'entità del potenziale danno derivante dalla violazione.

Art. 8 — Restituzione delle Informazioni
8.1 Al termine del Periodo di Trial, o in qualsiasi momento su richiesta di Minerva, il Candidato è tenuto a:
(a) Restituire immediatamente tutti i documenti e materiali contenenti Informazioni Riservate;
(b) Cancellare irrevocabilmente ogni copia digitale delle Informazioni Riservate;
(c) Confermare per iscritto l'avvenuta restituzione e cancellazione.

Art. 9 — Dichiarazioni del Candidato
9.1 Il Candidato dichiara e garantisce di:
(a) Essere maggiorenne e avere piena capacità di agire;
(b) Non essere soggetto a procedimenti penali pendenti per reati finanziari;
(c) Non essere vincolato da accordi con terzi che possano confliggere con il presente accordo;
(d) Agire in proprio nome e per proprio conto (o, se persona giuridica, di avere i poteri per impegnare la società).

Art. 10 — Trattamento dei Dati Personali
10.1 I dati personali forniti dal Candidato saranno trattati da Minerva Partners in conformità al Reg. UE 2016/679 (GDPR) per le finalità connesse all'esecuzione del presente accordo.
10.2 Il Candidato presta il proprio consenso al trattamento dei dati per le finalità di profilazione e valutazione dell'idoneità all'ingresso nella Rete Minerva.
10.3 I dati saranno conservati per un periodo di 5 (cinque) anni dalla conclusione del rapporto. Il Candidato può esercitare i diritti previsti dagli artt. 15-22 GDPR scrivendo a privacy@minervapartners.it.

Art. 11 — Disposizioni Generali
11.1 Il presente accordo costituisce l'intero accordo tra le Parti in merito all'oggetto dello stesso e sostituisce ogni precedente intesa, scritta o orale.
11.2 Eventuali modifiche al presente accordo dovranno essere concordate per iscritto da entrambe le Parti.
11.3 La nullità o inefficacia di una o più clausole non comporta la nullità dell'intero accordo.
11.4 Il Candidato non può cedere i diritti e gli obblighi derivanti dal presente accordo senza il preventivo consenso scritto di Minerva.

Art. 12 — Legge Applicabile e Foro Competente
12.1 Il presente accordo è regolato dalla legge italiana.
12.2 Per qualsiasi controversia derivante dal presente accordo sarà competente in via esclusiva il Foro di Milano, con esclusione di qualsiasi altro foro alternativo.

ACCETTAZIONE EX ART. 1341 C.C.
Ai sensi e per gli effetti degli artt. 1341 e 1342 del Codice Civile, il Candidato dichiara di aver preso specifica conoscenza e di approvare espressamente le seguenti clausole:
- Art. 4 (Durata indeterminata dell'obbligo di riservatezza)
- Art. 6 (Non-circumvention per 12 mesi)
- Art. 7 (Penali di EUR 50.000)
- Art. 8 (Restituzione obbligatoria delle informazioni)
- Art. 10.2-10.3 (Consenso al trattamento dati e profilazione)
- Art. 12.2 (Foro esclusivo di Milano)`

export function NdaTrialClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const scrollBoxRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    nome: profile.full_name ?? '',
    email: profile.email ?? '',
    telefono: profile.phone ?? '',
    codice_fiscale: '',
    indirizzo: '',
    e_persona_giuridica: false,
    ragione_sociale: '',
    piva: '',
  })

  const [step, setStep] = useState<'review' | 'data' | 'sign'>('review')
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [agreed1341, setAgreed1341] = useState(false)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize SignaturePad when entering sign step
  useEffect(() => {
    if (step === 'sign' && canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(248, 245, 240)',
        penColor: 'rgb(0, 18, 32)',
      })
    }
    return () => {
      if (step !== 'sign' && signaturePadRef.current) {
        signaturePadRef.current = null
      }
    }
  }, [step])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
      setScrolledToBottom(true)
    }
  }, [])

  const handleClearSignature = () => {
    signaturePadRef.current?.clear()
  }

  const canProceedData = form.nome.trim() && form.email.trim() && form.codice_fiscale.trim().length >= 11

  const handleSubmit = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError('Firma obbligatoria')
      return
    }
    if (!agreed1341) {
      setError('Devi accettare specificamente le clausole ex art. 1341 c.c.')
      return
    }

    setSigning(true)
    setError(null)

    try {
      let ip = 'unknown'
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipRes.json()
        ip = ipData.ip
      } catch { /* fallback */ }

      const signature_data_url = signaturePadRef.current.toDataURL()

      const res = await fetch('/api/nda-trial/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          signature_data_url,
          specifica_1341_approvata: agreed1341,
          ip_address: ip,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Errore sconosciuto' }))
        throw new Error(data.error || 'Errore durante la firma')
      }

      const { pdf_url } = await res.json()
      if (pdf_url) window.open(pdf_url, '_blank')
      router.push('/portal/onboarding?nda_signed=1')
    } catch (e: any) {
      setError(e.message || 'Errore di rete')
    } finally {
      setSigning(false)
    }
  }

  const stepIndex = ['review', 'data', 'sign'].indexOf(step)

  return (
    <div className="min-h-screen bg-[#001220] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/icon.webp" alt="Minerva" width={45} height={45} className="mx-auto mb-4" unoptimized />
          <h1 className="text-2xl font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-2">
            Accordo di Riservatezza — Trial 30 giorni
          </h1>
          <p className="text-[#D4AF37]/60 text-sm">
            Prima di accedere al portale, leggi e firma l'NDA preliminare.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['Lettura', 'Dati', 'Firma'].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${
                i <= stepIndex ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/20'
              }`} />
              <p className={`text-[10px] mt-1 text-center uppercase tracking-wider ${
                i <= stepIndex ? 'text-[#D4AF37]' : 'text-[#D4AF37]/30'
              }`}>{label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* STEP 1: Review NDA */}
        {step === 'review' && (
          <div className="bg-[#001220]/80 border border-[#D4AF37]/20 rounded-2xl p-6">
            <h2 className="text-lg font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-4">
              1. Leggi l'NDA integrale
            </h2>
            <div
              ref={scrollBoxRef}
              onScroll={handleScroll}
              className="h-[400px] overflow-y-auto bg-white/95 text-[#001220] p-6 rounded-xl text-sm leading-relaxed"
            >
              <pre className="whitespace-pre-wrap font-sans">{NDA_TEXT}</pre>
            </div>

            {!scrolledToBottom && (
              <p className="text-amber-400 text-sm mt-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 animate-bounce rotate-90" />
                Scorri fino alla fine per continuare
              </p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => { setStep('data'); setError(null) }}
                disabled={!scrolledToBottom}
                className={buttonPrimary + ' !bg-[#D4AF37] !text-[#001220] disabled:!opacity-30'}
              >
                Ho letto, continua
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Data */}
        {step === 'data' && (
          <div className="bg-[#001220]/80 border border-[#D4AF37]/20 rounded-2xl p-6">
            <h2 className="text-lg font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-2">
              2. Verifica i tuoi dati
            </h2>
            <p className="text-[#D4AF37]/50 text-sm mb-6">
              Pre-compilato dal tuo profilo. Verifica e correggi se necessario.
            </p>

            <div className="space-y-4">
              <div>
                <label className={labelClass + ' !text-[#D4AF37]/70'}>Nome e Cognome *</label>
                <input
                  className={inputClass}
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass + ' !text-[#D4AF37]/70'}>Email *</label>
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass + ' !text-[#D4AF37]/70'}>Telefono</label>
                  <input
                    className={inputClass}
                    value={form.telefono}
                    onChange={e => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass + ' !text-[#D4AF37]/70'}>Codice Fiscale *</label>
                  <input
                    className={inputClass}
                    value={form.codice_fiscale}
                    onChange={e => setForm({ ...form, codice_fiscale: e.target.value.toUpperCase() })}
                    maxLength={16}
                    placeholder="RSSMRA80A01F205Z"
                  />
                </div>
                <div>
                  <label className={labelClass + ' !text-[#D4AF37]/70'}>Indirizzo (Via, Città)</label>
                  <input
                    className={inputClass}
                    value={form.indirizzo}
                    onChange={e => setForm({ ...form, indirizzo: e.target.value })}
                    placeholder="Via Roma 1, Milano"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.e_persona_giuridica}
                  onChange={e => setForm({ ...form, e_persona_giuridica: e.target.checked })}
                  className="w-4 h-4 accent-[#D4AF37] rounded"
                />
                <span className="text-[#D4AF37]/80 text-sm">Firmo in qualità di legale rappresentante di persona giuridica</span>
              </label>

              {form.e_persona_giuridica && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                  <div>
                    <label className={labelClass + ' !text-[#D4AF37]/70'}>Ragione Sociale</label>
                    <input
                      className={inputClass}
                      value={form.ragione_sociale}
                      onChange={e => setForm({ ...form, ragione_sociale: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass + ' !text-[#D4AF37]/70'}>P. IVA</label>
                    <input
                      className={inputClass}
                      value={form.piva}
                      onChange={e => setForm({ ...form, piva: e.target.value })}
                      maxLength={11}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => { setStep('review'); setError(null) }} className={buttonSecondary}>
                <ChevronLeft className="w-4 h-4" /> Indietro
              </button>
              <button
                onClick={() => { setStep('sign'); setError(null) }}
                disabled={!canProceedData}
                className={buttonPrimary + ' !bg-[#D4AF37] !text-[#001220] disabled:!opacity-30'}
              >
                Procedi alla firma
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Sign */}
        {step === 'sign' && (
          <div className="bg-[#001220]/80 border border-[#D4AF37]/20 rounded-2xl p-6">
            <h2 className="text-lg font-[family-name:var(--font-cormorant)] text-[#D4AF37] mb-4">
              3. Firma e conferma
            </h2>

            {/* Summary */}
            <div className="bg-[#001220] border border-[#D4AF37]/10 rounded-xl p-4 mb-6">
              <p className="text-[10px] uppercase tracking-wider text-[#D4AF37]/50 mb-2">Firmando dichiari di essere</p>
              <p className="text-[#D4AF37] font-medium">{form.nome}</p>
              <p className="text-[#D4AF37]/70 text-sm">{form.email} · CF {form.codice_fiscale}</p>
              {form.e_persona_giuridica && (
                <p className="text-[#D4AF37]/70 text-sm mt-1">per {form.ragione_sociale} (P.IVA {form.piva})</p>
              )}
            </div>

            {/* 1341 acceptance */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed1341}
                onChange={e => setAgreed1341(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#D4AF37] rounded"
              />
              <span className="text-[#D4AF37]/80 text-sm leading-relaxed">
                <strong className="text-[#D4AF37]">Ex art. 1341 c.c.</strong> — Approvo specificamente:
                Art. 4 (Riservatezza indeterminata), Art. 6 (Non-circumvention 12 mesi),
                Art. 7 (Penali EUR 50.000), Art. 8 (Restituzione informazioni),
                Art. 10.2-10.3 (Consenso trattamento dati), Art. 12.2 (Foro esclusivo Milano).
              </span>
            </label>

            {/* Signature pad */}
            <div className="mb-6">
              <label className={labelClass + ' !text-[#D4AF37]/70 mb-2'}>Firma qui (mouse o dito su touch)</label>
              <canvas
                ref={canvasRef}
                className="w-full h-36 border-2 border-[#D4AF37]/30 rounded-xl bg-stone-50 cursor-crosshair"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleClearSignature}
                  className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] underline transition-colors"
                >
                  Cancella firma
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => { setStep('data'); setError(null) }} className={buttonSecondary}>
                <ChevronLeft className="w-4 h-4" /> Indietro
              </button>
              <button
                onClick={handleSubmit}
                disabled={signing || !agreed1341}
                className={buttonPrimary + ' !bg-[#D4AF37] !text-[#001220] disabled:!opacity-30'}
              >
                {signing ? (
                  <span className="animate-pulse">Generazione PDF...</span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Firma e accetta
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-[#D4AF37]/30 mt-8">
          La firma registrerà: timestamp, indirizzo IP e user agent del tuo browser.
        </p>
      </div>
    </div>
  )
}
