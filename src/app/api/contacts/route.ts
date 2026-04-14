// ============================================================
// app/api/contacts/route.ts
// GET: Lista contatti (filtri: strength, type, search, tags)
// POST: Crea contatto
// PATCH: Aggiorna contatto
// DELETE: Elimina contatto
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const strength = searchParams.get('strength');
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');
    const dealId = searchParams.get('deal_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort') || 'score';
    const sortDir = searchParams.get('dir') || 'desc';

    let query = supabase
      .from('contacts')
      .select(`
        *,
        referrer:contacts!referred_by(id, full_name)
      `, { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (strength) query = query.eq('strength', strength);
    if (type) query = query.eq('relationship_type', type);
    if (tag) query = query.contains('tags', [tag]);

    // Ordinamento
    if (sortBy === 'score') query = query.order('score', { ascending: false });
    else if (sortBy === 'name') query = query.order('full_name', { ascending: true });
    else if (sortBy === 'last_interaction') query = query.order('last_interaction_at', { ascending: false, nullsFirst: false });
    else if (sortBy === 'company') query = query.order('company', { ascending: true });
    else query = query.order('score', { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se filtro per deal, prendiamo solo i contatti collegati
    if (dealId) {
      const { data: linkedIds } = await supabase
        .from('contact_deals')
        .select('contact_id')
        .eq('deal_id', dealId)
        .eq('is_active', true);

      const ids = new Set(linkedIds?.map(l => l.contact_id) || []);
      const filtered = data?.filter(c => ids.has(c.id)) || [];
      return NextResponse.json({ contacts: filtered, total: filtered.length });
    }

    return NextResponse.json({ contacts: data, total: count });
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
      .from('contacts')
      .insert({ ...body, created_by: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
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
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contact: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
