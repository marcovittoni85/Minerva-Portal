// ============================================================
// app/api/tasks/route.ts
// GET: Lista task (filtri: priority, category, deal_id, is_completed)
// POST: Crea task
// PATCH: Aggiorna task (toggle complete, edit)
// DELETE: Elimina task
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const dealId = searchParams.get('deal_id');
    const contactId = searchParams.get('contact_id');
    const completed = searchParams.get('completed');
    const sortBy = searchParams.get('sort') || 'due_date';
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('tasks')
      .select(`
        *,
        deal:deals(id, title),
        contact:contacts(id, full_name)
      `, { count: 'exact' });

    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (dealId) query = query.eq('deal_id', dealId);
    if (contactId) query = query.eq('contact_id', contactId);
    if (completed === 'true') query = query.eq('is_completed', true);
    else if (completed === 'false') query = query.eq('is_completed', false);

    if (sortBy === 'priority') {
      query = query.order('priority', { ascending: true }).order('due_date', { ascending: true, nullsFirst: false });
    } else if (sortBy === 'title') {
      query = query.order('title', { ascending: true });
    } else {
      query = query.order('due_date', { ascending: true, nullsFirst: false }).order('priority', { ascending: true });
    }

    query = query.limit(limit);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data, total: count });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...body, created_by: user.id, assigned_to: body.assigned_to || user.id })
      .select(`*, deal:deals(id, title), contact:contacts(id, full_name)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { id, ids, ...updates } = await request.json();

    // Bulk complete
    if (ids && Array.isArray(ids)) {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    // Auto-set completed_at
    if (updates.is_completed === true && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    if (updates.is_completed === false) {
      updates.completed_at = null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`*, deal:deals(id, title), contact:contacts(id, full_name)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: data });
  } catch {
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

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
