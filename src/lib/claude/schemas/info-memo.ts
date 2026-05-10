import { z } from 'zod'

export const InfoMemoSchema = z.object({
  executive_summary: z.string(),
  business_overview: z.object({
    description: z.string(),
    key_products: z.array(z.string()),
    main_markets: z.array(z.string()),
    business_model: z.string(),
  }),
  market_position: z.object({
    market_size_eur: z.string().optional(),
    growth_rate: z.string().optional(),
    competitive_position: z.string(),
    key_competitors: z.array(z.string()),
  }),
  financial_highlights: z.object({
    revenue_last_3y: z.array(z.object({ year: z.number(), amount_eur: z.number() })),
    ebitda_last_3y: z.array(z.object({ year: z.number(), amount_eur: z.number(), margin_pct: z.number() })),
    key_kpi: z.array(z.string()),
  }),
  transaction_rationale: z.array(z.string()),
  valuation_range: z.object({
    methodology: z.string(),
    range_eur_low: z.number(),
    range_eur_high: z.number(),
    notes: z.string(),
  }),
  next_steps: z.array(z.string()),
})

export type InfoMemo = z.infer<typeof InfoMemoSchema>
