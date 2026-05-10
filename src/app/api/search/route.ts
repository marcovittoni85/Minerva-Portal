import { getAuthUser } from '@/lib/supabase/server'
import { similaritySearch } from '@/lib/embeddings/pipeline'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) {
    return NextResponse.json({ deals: [], contacts: [], documents: [], semantic: [] })
  }

  const { supabase, user } = await getAuthUser()
  if (!user) {
    return NextResponse.json({ deals: [], contacts: [], documents: [], semantic: [] })
  }

  const pattern = `%${q}%`

  // Traditional ILIKE search (parallel)
  const [deals, contacts, documents] = await Promise.all([
    supabase
      .from('deals')
      .select('id, codice_anonimo, settore, nome_azienda')
      .or(
        `codice_anonimo.ilike.${pattern},settore.ilike.${pattern},nome_azienda.ilike.${pattern}`
      )
      .limit(5),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(5),
    supabase
      .from('deal_documents')
      .select('id, file_name')
      .ilike('file_name', pattern)
      .limit(5),
  ])

  const dealsData = deals.data ?? []
  const contactsData = contacts.data ?? []
  const documentsData = documents.data ?? []

  // Semantic search (only for queries >= 4 chars)
  let semanticResults: {
    id: string
    type: string
    content: string
    similarity: string
  }[] = []

  if (q.length >= 4) {
    try {
      const raw = await similaritySearch({
        query: q,
        limit: 8,
        threshold: 0.5,
      })

      // Build a set of IDs already present in traditional results to filter duplicates
      const existingIds = new Set<string>([
        ...dealsData.map((d: any) => d.id),
        ...contactsData.map((c: any) => c.id),
        ...documentsData.map((doc: any) => doc.id),
      ])

      semanticResults = raw
        .filter((r) => !existingIds.has(r.entity_id))
        .map((r) => ({
          id: r.entity_id,
          type: r.entity_type,
          content:
            r.content.length > 150 ? r.content.slice(0, 150) + '...' : r.content,
          similarity: (r.similarity * 100).toFixed(1) + '%',
        }))
    } catch (err) {
      // Graceful failure — semantic search is optional
      console.error('Semantic search failed:', err)
    }
  }

  return NextResponse.json({
    deals: dealsData,
    contacts: contactsData,
    documents: documentsData,
    semantic: semanticResults,
  })
}
