import { supabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { voyageEmbed, voyageEmbedBatch, isVoyageAvailable } from './voyage-wrapper'

interface SimilaritySearchOptions {
  query: string
  entityTypes?: string[]
  limit?: number
  threshold?: number
}

interface SimilarityResult {
  entity_id: string
  entity_type: string
  content: string
  similarity: number
  metadata?: Record<string, unknown>
}

interface EmbedResult {
  embedding: number[]
  provider: 'voyage' | 'openai'
  model: string
  inputTokens?: number
}

export async function embedText(text: string, opts: { inputType?: 'query' | 'document' } = {}): Promise<EmbedResult> {
  if (isVoyageAvailable()) {
    try {
      const r = await voyageEmbed(text, { inputType: opts.inputType })
      return { embedding: r.embedding, provider: 'voyage', model: r.model, inputTokens: r.inputTokens }
    } catch (err) {
      console.warn('[embeddings] Voyage failed, falling back to OpenAI:', err instanceof Error ? err.message : err)
    }
  }
  const embedding = await openaiEmbed(text)
  return { embedding, provider: 'openai', model: 'text-embedding-3-small' }
}

export async function embedAndStore(
  entityType: string,
  entityId: string,
  content: string,
  metadata?: Record<string, unknown>,
): Promise<{ id: string; provider: string }> {
  const { embedding, provider } = await embedText(content, { inputType: 'document' })
  const supabase = supabaseAdmin()

  await supabase.from('embeddings').delete().eq('entity_type', entityType).eq('entity_id', entityId)

  const { data, error } = await supabase
    .from('embeddings')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      content,
      embedding,
      metadata: metadata ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(`embedAndStore: ${error.message}`)
  return { id: data!.id, provider }
}

export async function reembedAll(
  items: { entityType: string; entityId: string; content: string; metadata?: Record<string, unknown> }[],
): Promise<{ count: number; provider: string }> {
  if (items.length === 0) return { count: 0, provider: 'none' }
  const supabase = supabaseAdmin()

  let provider: 'voyage' | 'openai' = 'openai'
  let embeddings: number[][] = []

  if (isVoyageAvailable()) {
    try {
      const chunks: typeof items[] = []
      for (let i = 0; i < items.length; i += 128) chunks.push(items.slice(i, i + 128))
      const allResults: number[][] = []
      for (const chunk of chunks) {
        const r = await voyageEmbedBatch(chunk.map(i => i.content), { inputType: 'document' })
        allResults.push(...r.map(x => x.embedding))
      }
      embeddings = allResults
      provider = 'voyage'
    } catch (err) {
      console.warn('[embeddings] Voyage batch failed, falling back to OpenAI per-item:', err instanceof Error ? err.message : err)
      embeddings = []
    }
  }

  if (embeddings.length === 0) {
    for (const item of items) {
      embeddings.push(await openaiEmbed(item.content))
    }
    provider = 'openai'
  }

  for (const item of items) {
    await supabase.from('embeddings').delete().eq('entity_type', item.entityType).eq('entity_id', item.entityId)
  }

  const rows = items.map((item, i) => ({
    entity_type: item.entityType,
    entity_id: item.entityId,
    content: item.content,
    embedding: embeddings[i],
    metadata: item.metadata ?? null,
  }))
  const { error } = await supabase.from('embeddings').insert(rows)
  if (error) throw new Error(`reembedAll: ${error.message}`)

  return { count: rows.length, provider }
}

export async function similaritySearch({
  query,
  entityTypes,
  limit = 5,
  threshold = 0.4,
}: SimilaritySearchOptions): Promise<SimilarityResult[]> {
  const supabase = await supabaseServer()
  // Force OpenAI embedding for query — DB chunks are OpenAI 1536 dim
  const embedding = await openaiEmbed(query)

  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_entity_types: entityTypes ?? null,
  })

  if (error) {
    console.error('[embeddings] Similarity search error:', error)
    return []
  }

  return (data ?? []).map((row: {
    entity_id: string
    entity_type: string
    content: string
    similarity: number
    metadata?: Record<string, unknown>
  }) => ({
    entity_id: row.entity_id,
    entity_type: row.entity_type,
    content: row.content,
    similarity: row.similarity,
    metadata: row.metadata,
  }))
}

async function openaiEmbed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for embeddings (Voyage fallback)')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  })

  if (!res.ok) {
    throw new Error(`OpenAI embeddings ${res.status}: ${await res.text().catch(() => '')}`)
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] }
  return json.data[0].embedding
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const r = await embedText(text)
  return r.embedding
}
