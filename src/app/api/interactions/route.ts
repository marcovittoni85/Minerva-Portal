// ============================================================
// app/api/interactions/route.ts
// GET: Lista interazioni (filtri: contact_id, deal_id, type, pending_followups)
// POST: Crea interazione
// PATCH: Aggiorna interazione (es. mark follow_up_done)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');
    const dealId = searchParams.get('deal_id');
    const type = searchParams.get('type');
    const pendingOnly = searchParams.get('pending_followups') === 'true';

    let query = supabase
      .from('interactions')
      .select(`
        *,
        contact:contacts(id, full_name, company),
        deal:deals(id, title),
        creator:profiles!created_by(id, full_name)
      `)
      .order('interaction_date', { ascending: false })
      .limit(100);

    if (contactId) query = query.eq('contact_id', contactId);
    if (dealId) query = query.eq('deal_id', dealId);
    if (type) query = query.eq('interaction_type', type);
    if (pendingOnly) {
      query = query
        .eq('follow_up_done', false)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date', { ascending: true });
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ interactions: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
      .from('interactions')
      .insert({ ...body, created_by: user.id })
      .select(`
        *,
        contact:contacts(id, full_name, company),
        deal:deals(id, title)
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ interaction: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    const { data, error } = await supabase
      .from('interactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ interaction: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
