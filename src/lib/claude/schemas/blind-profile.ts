import { z } from 'zod'

export const BlindProfileSchema = z.object({
  settore: z.string().describe('Settore generico, es. "Meccanica industriale"'),
  area_geografica: z.string().describe('Macro-area, es. "Nord Italia"'),
  range_fatturato: z.string().describe('Range, es. "€10-25M"'),
  range_ebitda: z.string().describe('Range, es. "€2-5M"'),
  tipo_operazione: z.string().describe('MBO/Cessione/Build-up/Carve-out/etc.'),
  razionale_strategico: z.string().describe('2-3 frasi, anonimo'),
  perche_interessante: z.string().describe('2-3 frasi punti di forza'),
  blind_title: z.string().describe('Titolo blind anonimizzato, max 80 caratteri'),
  blind_description: z.string().describe('Descrizione blind 2-3 righe, max 300 caratteri'),
  campi_mancanti: z.array(z.object({
    campo: z.string(),
    motivo: z.string(),
    documento_suggerito: z.string(),
  })).describe('Lista campi non determinabili dai docs'),
})

export type BlindProfile = z.infer<typeof BlindProfileSchema>
