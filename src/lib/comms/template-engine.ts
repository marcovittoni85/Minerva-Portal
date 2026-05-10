// P37 — Template engine per comms_templates (merge tag interpolation)
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface TemplateRender {
  subject: string
  body: string
}

export interface CommsTemplate {
  id: string
  slug: string
  subject: string | null
  body: string
  channel: 'email' | 'whatsapp' | 'pec' | 'in_app'
  version: number
  is_active: boolean
}

const MERGE_TAG_RE = /\{\{(\w+)\}\}/g

/**
 * Interpola i merge tag {{key}} dentro subject + body. Tag mancante → stringa vuota.
 */
export function renderTemplate(
  template: { subject: string | null; body: string },
  variables: Record<string, string | number | undefined | null> = {},
): TemplateRender {
  if (template.body === undefined || template.body === null) {
    throw new Error('renderTemplate: body is required')
  }
  const replacer = (text: string) =>
    text.replace(MERGE_TAG_RE, (_full, key: string) => {
      const v = variables[key]
      return v === undefined || v === null ? '' : String(v)
    })
  return {
    subject: replacer(template.subject ?? ''),
    body: replacer(template.body),
  }
}

/**
 * Estrae merge tag unici da un testo, ordinati per prima apparizione.
 */
export function extractMergeTags(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const match of text.matchAll(MERGE_TAG_RE)) {
    const tag = match[1]
    if (!seen.has(tag)) {
      seen.add(tag)
      out.push(tag)
    }
  }
  return out
}

/**
 * Recupera template attivo per slug (ultima versione).
 */
export async function getTemplateBySlug(slug: string): Promise<CommsTemplate | null> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('comms_templates')
    .select('id, slug, subject, body, channel, version, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[template-engine] getTemplateBySlug error:', error)
    return null
  }
  return (data as CommsTemplate) ?? null
}

/**
 * Lookup + render in una chiamata. Ritorna null se template non trovato.
 */
export async function renderBySlug(
  slug: string,
  variables: Record<string, string | number | undefined | null> = {},
): Promise<(TemplateRender & { channel: CommsTemplate['channel'] }) | null> {
  const tpl = await getTemplateBySlug(slug)
  if (!tpl) return null
  const rendered = renderTemplate(tpl, variables)
  return { ...rendered, channel: tpl.channel }
}
