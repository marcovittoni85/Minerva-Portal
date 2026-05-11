/**
 * Voyage AI embeddings wrapper.
 * Voyage AI è il provider primary per embeddings nel progetto Minerva.
 * Fallback a OpenAI text-embedding-3-small se Voyage non disponibile.
 *
 * Modello default: voyage-large-2 → 1536 dim (compatibile col schema pgvector embeddings.embedding vector(1536)).
 */

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_DEFAULT_MODEL = 'voyage-large-2' // 1536 dim

export interface VoyageEmbedResult {
  embedding: number[]
  model: string
  provider: 'voyage'
  inputTokens: number
}

/**
 * Genera embedding tramite Voyage AI.
 * Throw se VOYAGE_API_KEY mancante.
 */
export async function voyageEmbed(
  text: string,
  options: { model?: string; inputType?: 'query' | 'document' } = {},
): Promise<VoyageEmbedResult> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY not configured')
  }

  const model = options.model ?? VOYAGE_DEFAULT_MODEL
  const inputType = options.inputType ?? 'document'

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [text.slice(0, 32000)], // max ~32k chars per Voyage
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Voyage API ${res.status}: ${errBody.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[]
    model: string
    usage: { total_tokens: number }
  }

  const embedding = json.data?.[0]?.embedding
  if (!Array.isArray(embedding)) {
    throw new Error('Voyage: missing embedding in response')
  }

  return {
    embedding,
    model: json.model,
    provider: 'voyage',
    inputTokens: json.usage?.total_tokens ?? 0,
  }
}

/**
 * Batch embed: utile per re-embedding di documenti foundation.
 * Voyage supporta fino a 128 input per richiesta.
 */
export async function voyageEmbedBatch(
  texts: string[],
  options: { model?: string; inputType?: 'query' | 'document' } = {},
): Promise<VoyageEmbedResult[]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY not configured')
  if (texts.length === 0) return []
  if (texts.length > 128) {
    throw new Error('Voyage batch size limited to 128. Chunk before calling.')
  }

  const model = options.model ?? VOYAGE_DEFAULT_MODEL
  const inputType = options.inputType ?? 'document'

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: texts.map(t => t.slice(0, 32000)),
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Voyage batch ${res.status}: ${errBody.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[]
    model: string
    usage: { total_tokens: number }
  }

  return json.data
    .sort((a, b) => a.index - b.index)
    .map(d => ({
      embedding: d.embedding,
      model: json.model,
      provider: 'voyage' as const,
      inputTokens: Math.floor((json.usage?.total_tokens ?? 0) / json.data.length),
    }))
}

export function isVoyageAvailable(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY)
}
