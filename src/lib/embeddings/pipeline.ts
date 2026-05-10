import { supabaseServer } from '@/lib/supabase/server'

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
  metadata?: Record<string, any>
}

/**
 * Semantic similarity search using pgvector embeddings.
 * Generates embedding for query via Supabase's pg_net + OpenAI, or
 * falls back to a Supabase RPC that handles embedding generation.
 */
export async function similaritySearch({
  query,
  entityTypes,
  limit = 5,
  threshold = 0.5,
}: SimilaritySearchOptions): Promise<SimilarityResult[]> {
  const supabase = await supabaseServer()

  // Generate embedding for query using Supabase edge function or RPC
  const embedding = await generateEmbedding(query)

  // Call pgvector similarity search RPC
  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_entity_types: entityTypes ?? null,
  })

  if (error) {
    console.error('Similarity search error:', error)
    return []
  }

  return (data ?? []).map((row: any) => ({
    entity_id: row.entity_id,
    entity_type: row.entity_type,
    content: row.content,
    similarity: row.similarity,
    metadata: row.metadata,
  }))
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Use OpenAI embeddings API (text-embedding-3-small)
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for embeddings')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    }),
  })

  if (!res.ok) {
    throw new Error(`Embedding API error: ${res.status}`)
  }

  const json = await res.json()
  return json.data[0].embedding
}
