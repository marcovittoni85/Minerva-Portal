import { z } from 'zod'

const ValuationRange = z.object({
  low: z.number(),
  mid: z.number(),
  high: z.number(),
})

export const TVASchema = z.object({
  metadata: z.object({
    company_name: z.string(),
    sector: z.string(),
    valuation_date: z.string(),
    base_currency: z.string().default('EUR'),
  }),
  metodologie: z.object({
    ebitda_multiple: z.object({
      ebitda_eur: z.number(),
      multiple_low: z.number(),
      multiple_high: z.number(),
      range: ValuationRange,
      benchmark_source: z.string(),
      notes: z.string(),
    }),
    revenue_multiple: z.object({
      revenue_eur: z.number(),
      multiple_low: z.number(),
      multiple_high: z.number(),
      range: ValuationRange,
      benchmark_source: z.string(),
      notes: z.string(),
    }),
    dcf: z.object({
      forecast_years: z.number().default(5),
      wacc_pct: z.number(),
      terminal_growth_pct: z.number(),
      range: ValuationRange,
      key_assumptions: z.array(z.string()),
      notes: z.string(),
    }),
    comparables: z.object({
      transactions: z.array(z.object({
        date: z.string(),
        target: z.string(),
        sector: z.string(),
        ev_ebitda: z.number().optional(),
        ev_revenue: z.number().optional(),
        notes: z.string().optional(),
      })).min(2).max(5),
      range: ValuationRange,
      notes: z.string(),
    }),
    asset_based: z.object({
      applicable: z.boolean(),
      net_asset_value_eur: z.number().optional(),
      range: ValuationRange.optional(),
      notes: z.string(),
    }),
  }),
  consolidated_range: ValuationRange,
  narrative: z.object({
    why_valuation: z.string(),
    value_drivers: z.array(z.string()),
    key_risks: z.array(z.string()),
    sensitivities: z.array(z.string()),
  }),
})

export type TVA = z.infer<typeof TVASchema>
