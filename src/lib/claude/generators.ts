import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface GenerateStructuredOptions {
  useCase: string
  systemPrompt: string
  userPrompt: string
  schema: z.ZodType<any>
  dealId: string
  userId: string
  maxTokens?: number
}

export async function generateStructured({
  useCase,
  systemPrompt,
  userPrompt,
  schema,
  dealId,
  userId,
  maxTokens = 4000,
}: GenerateStructuredOptions) {
  const startTime = Date.now()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const durationMs = Date.now() - startTime

  const textBlock = message.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // Extract JSON from response (may be wrapped in ```json```)
  let rawJson = textBlock.text
  const jsonMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) rawJson = jsonMatch[1]

  const parsed = JSON.parse(rawJson.trim())
  const validated = schema.parse(parsed)

  // Track cost in ai_generations
  const supabase = await supabaseServer()
  await supabase.from('ai_generations').insert({
    deal_id: dealId,
    use_case: useCase,
    model: 'claude-sonnet-4-20250514',
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
    duration_ms: durationMs,
    created_by: userId,
  }).then(() => {}, () => {}) // silent fail for tracking

  return validated
}
