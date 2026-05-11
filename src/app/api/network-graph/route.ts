import { supabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await supabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch nodes (profiles)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, partner_line, ruolo_enumerato')

  console.log('Profiles count:', profiles?.length, 'Error:', profilesError?.message ?? 'none')

  // Auto-generate edges from deal co-participation
  const autoEdges: Array<{
    contact_a: string
    contact_b: string
    relationship_type: string
    strength: number
  }> = []

  // Edges from invited_by (if column exists)
  try {
    const { data: profilesWithInviter } = await supabase
      .from('profiles')
      .select('id, invited_by')
      .not('invited_by', 'is', null)

    for (const p of profilesWithInviter ?? []) {
      autoEdges.push({
        contact_a: p.id,
        contact_b: p.invited_by,
        relationship_type: 'introduced_by',
        strength: 3,
      })
    }
  } catch {
    // invited_by column may not exist
  }

  // Edges from deal co-access
  try {
    const { data: dealAccess } = await supabase
      .from('deal_access')
      .select('user_id, deal_id')

    if (dealAccess && dealAccess.length > 0) {
      // Group by deal
      const dealUsers = new Map<string, string[]>()
      for (const da of dealAccess) {
        const users = dealUsers.get(da.deal_id) || []
        users.push(da.user_id)
        dealUsers.set(da.deal_id, users)
      }

      // Create edges between users sharing deal access
      for (const users of dealUsers.values()) {
        for (let i = 0; i < users.length; i++) {
          for (let j = i + 1; j < users.length; j++) {
            autoEdges.push({
              contact_a: users[i],
              contact_b: users[j],
              relationship_type: 'co_dealing',
              strength: 2,
            })
          }
        }
      }
    }
  } catch {
    // deal_access table may not be accessible
  }

  // Try explicit contact_relationships table
  let explicitEdges: Array<{
    contact_a: string
    contact_b: string
    relationship_type: string
    strength: number
  }> = []
  try {
    const { data } = await supabase
      .from('contact_relationships')
      .select('contact_a, contact_b, relationship_type, strength')
    if (data) explicitEdges = data
  } catch {
    // Table may not exist
  }

  const allEdges = [...explicitEdges, ...autoEdges]
  const dedupedEdges = dedupeEdges(allEdges)

  return NextResponse.json({
    nodes: profiles ?? [],
    edges: dedupedEdges,
  })
}

function dedupeEdges(edges: Array<{ contact_a: string; contact_b: string; relationship_type: string; strength: number }>) {
  const seen = new Set<string>()
  return edges.filter(e => {
    const [a, b] = [e.contact_a, e.contact_b].sort()
    const key = `${a}-${b}-${e.relationship_type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
