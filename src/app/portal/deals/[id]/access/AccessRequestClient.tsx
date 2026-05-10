'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { inputClass, textareaClass, labelClass, buttonPrimary, errorTextClass } from '@/components/ui/form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const FormSchema = z.object({
  motivazione: z.string().min(50, 'Minimo 50 caratteri').max(500, 'Massimo 500 caratteri'),
  tipologia: z.enum(['per_cliente', 'per_me', 'per_altro']),
  cliente_generico: z.string().optional(),
  tempistica: z.enum(['immediata', '30gg', '60gg', 'oltre']),
  conferma_codici: z.literal(true, {
    error: 'Devi confermare di aver letto i Codici'
  }),
}).refine(
  data => data.tipologia !== 'per_cliente' || (data.cliente_generico && data.cliente_generico.length > 5),
  { message: 'Specifica nome generico cliente (min 6 caratteri)', path: ['cliente_generico'] }
)

type FormData = z.infer<typeof FormSchema>

export function AccessRequestClient({ deal, profile }: { deal: any; profile: any }) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<FormData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = FormSchema.safeParse(form)
    if (!result.success) {
      const errs: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        errs[err.path.map(String).join('.')] = err.message
      })
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/deal-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          interestMessage: result.data.motivazione,
          interestType: result.data.tipologia,
          clientGenericName: result.data.cliente_generico,
          urgency: result.data.tempistica,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Errore durante l\'invio')
      }
      const { requestId } = await response.json()
      router.push(`/portal/access-requests/${requestId}/pending`)
    } catch (e: any) {
      setErrors({ _form: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8">
      <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al deal
      </Link>

      {/* Deal recap */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Codice deal</div>
        <h2 className="text-xl font-bold text-slate-900">{deal.code || deal.codice_anonimo}</h2>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <span className="text-slate-400">Settore:</span>
            <span className="text-slate-700 ml-2">{deal.sector || deal.settore}</span>
          </div>
          <div>
            <span className="text-slate-400">Area:</span>
            <span className="text-slate-700 ml-2">{deal.geography || deal.area_geografica}</span>
          </div>
          <div>
            <span className="text-slate-400">Operazione:</span>
            <span className="text-slate-700 ml-2">{deal.side || deal.tipo_operazione}</span>
          </div>
          <div>
            <span className="text-slate-400">EV Range:</span>
            <span className="text-slate-700 ml-2">{deal.ev_range || deal.range_fatturato || '—'}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <h1 className="text-xl font-bold text-slate-900">Richiedi accesso L1</h1>

        {/* Motivazione */}
        <div>
          <label className={labelClass}>Motivazione interesse *</label>
          <textarea
            className={textareaClass}
            rows={4}
            value={form.motivazione ?? ''}
            onChange={e => setForm({ ...form, motivazione: e.target.value })}
            placeholder="Spiega perché questo deal ti interessa (minimo 50 caratteri)"
          />
          <div className="flex justify-between mt-1">
            {errors.motivazione && <span className={errorTextClass}>{errors.motivazione}</span>}
            <span className="text-xs text-slate-400 ml-auto">
              {(form.motivazione ?? '').length}/500
            </span>
          </div>
        </div>

        {/* Tipologia */}
        <div>
          <label className={labelClass}>Tipologia richiedente *</label>
          <div className="space-y-2">
            {[
              { v: 'per_cliente', l: 'Per un mio cliente' },
              { v: 'per_me', l: 'Per me stesso (interesse personale)' },
              { v: 'per_altro', l: 'Per altro soggetto (specifica nelle note)' },
            ].map(opt => (
              <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipologia"
                  value={opt.v}
                  checked={form.tipologia === opt.v}
                  onChange={e => setForm({ ...form, tipologia: e.target.value as any })}
                  className="accent-[#D4AF37]"
                />
                <span className="text-sm text-slate-700">{opt.l}</span>
              </label>
            ))}
          </div>
          {errors.tipologia && <span className={errorTextClass}>{errors.tipologia}</span>}
        </div>

        {/* Cliente generico (se per_cliente) */}
        {form.tipologia === 'per_cliente' && (
          <div>
            <label className={labelClass}>Nome generico cliente *</label>
            <input
              className={inputClass}
              value={form.cliente_generico ?? ''}
              onChange={e => setForm({ ...form, cliente_generico: e.target.value })}
              placeholder="es. industriale meccanica Brescia, family office UHNW Milano"
            />
            {errors.cliente_generico && <span className={errorTextClass}>{errors.cliente_generico}</span>}
          </div>
        )}

        {/* Tempistica */}
        <div>
          <label className={labelClass}>Tempistica attesa *</label>
          <div className="space-y-2">
            {[
              { v: 'immediata', l: 'Immediata' },
              { v: '30gg', l: 'Entro 30 giorni' },
              { v: '60gg', l: 'Entro 60 giorni' },
              { v: 'oltre', l: 'Oltre 60 giorni' },
            ].map(opt => (
              <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tempistica"
                  value={opt.v}
                  checked={form.tempistica === opt.v}
                  onChange={e => setForm({ ...form, tempistica: e.target.value as any })}
                  className="accent-[#D4AF37]"
                />
                <span className="text-sm text-slate-700">{opt.l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Conferma Codici */}
        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.conferma_codici ?? false}
              onChange={e => setForm({ ...form, conferma_codici: e.target.checked as any })}
              className="mt-0.5 accent-[#D4AF37]"
            />
            <span className="text-sm text-slate-600">
              Confermo di aver letto e di rispettare i{' '}
              <a href="/portal/onboarding" className="text-[#D4AF37] underline">Codici Minerva</a>{' '}
              in materia di confidenzialità e non-circumvention
            </span>
          </label>
          {errors.conferma_codici && <span className={errorTextClass}>{errors.conferma_codici}</span>}
        </div>

        {/* Submit */}
        {errors._form && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {errors._form}
          </div>
        )}

        <button type="submit" disabled={submitting} className={buttonPrimary + ' w-full justify-center'}>
          {submitting ? 'Invio in corso...' : 'Invia richiesta L1'}
        </button>
      </form>
    </div>
  )
}
