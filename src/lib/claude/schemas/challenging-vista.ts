import { z } from 'zod'

const SingleViewSchema = z.object({
  perspective: z.string(),
  reading: z.string().describe('2-3 paragrafi: come questa persona legge la situazione'),
  proposed_solutions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).min(2).max(3),
  trade_offs: z.array(z.string()),
  tensions_with_others: z.array(z.string()).describe('Punti di frizione con altre prospettive'),
})

export const ChallengingVistaSchema = z.object({
  marco_view: SingleViewSchema,
  enrico_view: SingleViewSchema,
  cliente_view: SingleViewSchema,
  consolidated_tensions: z.array(z.string()).describe('Tensioni esplicitate tra le 3 prospettive'),
  recommendation: z.string().describe('Raccomandazione finale che bilancia le 3 prospettive'),
})

export type ChallengingVista = z.infer<typeof ChallengingVistaSchema>
