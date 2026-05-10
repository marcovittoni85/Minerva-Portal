import { z } from 'zod'

export const PitchDeckSchema = z.object({
  cover: z.object({
    company_name: z.string(),
    tagline: z.string(),
  }),
  investment_thesis: z.object({
    headline: z.string(),
    bullets: z.array(z.string()).min(3).max(5),
  }),
  company_overview: z.object({
    founded: z.string().optional(),
    hq: z.string(),
    employees: z.number().optional(),
    description: z.string(),
  }),
  market_opportunity: z.object({
    headline: z.string(),
    tam_eur: z.string().optional(),
    growth_drivers: z.array(z.string()),
  }),
  business_model: z.object({
    revenue_streams: z.array(z.object({ name: z.string(), pct: z.number().optional() })),
    description: z.string(),
  }),
  traction: z.object({
    key_metrics: z.array(z.object({ label: z.string(), value: z.string() })),
    growth_narrative: z.string(),
  }),
  financials: z.object({
    revenue_3y: z.array(z.object({ year: z.number(), value_eur: z.number() })),
    ebitda_3y: z.array(z.object({ year: z.number(), value_eur: z.number() })),
    forecast_note: z.string().optional(),
  }),
  management_team: z.object({
    members: z.array(z.object({
      name: z.string(),
      role: z.string(),
      background: z.string(),
    })).min(1).max(6),
  }),
  competitive_landscape: z.object({
    headline: z.string(),
    competitors: z.array(z.object({ name: z.string(), positioning: z.string() })),
    moat: z.string(),
  }),
  transaction_structure: z.object({
    type: z.string(),
    target_stake_pct: z.string().optional(),
    use_of_proceeds: z.array(z.string()),
  }),
  valuation: z.object({
    range_eur_low: z.number(),
    range_eur_high: z.number(),
    methodology: z.string(),
    multiples: z.array(z.object({ metric: z.string(), value: z.string() })),
  }),
  risk_factors: z.array(z.string()).min(3).max(6),
  next_steps: z.array(z.string()).min(3).max(5),
  contacts: z.object({
    lead_advisor: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
})

export type PitchDeck = z.infer<typeof PitchDeckSchema>
