import { z } from 'zod'

export const PatternDetectionSchema = z.object({
  detected_patterns: z.array(z.object({
    code: z.string(),
    name: z.string(),
    score: z.number().min(0).max(100),
    confidence: z.enum(['high', 'medium', 'low']),
    evidence: z.string(),
    suggested_action: z.string().optional(),
  })),
  no_patterns_note: z.string().optional(),
})

export type PatternDetection = z.infer<typeof PatternDetectionSchema>
