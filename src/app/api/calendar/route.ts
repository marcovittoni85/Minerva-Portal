// ============================================================
// app/api/calendar/route.ts
// GET: Lista eventi (range date, deal_id, contact_id)
// POST: Crea evento
// PATCH: Aggiorna evento
// DELETE: Elimina/cancella evento
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const dealId = searchParams.get('deal_id');
    const contactId = searchParams.get('contact_id');

    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        deal:deals(id, title),
        contact:contacts(id, full_name, company)
      `)
      .eq('is_cancelled', false)
      .order('start_at', { ascending: true });

    if (startDate) query = query.gte('start_at', `${startDate}T00:00:00`);
    if (endDate) query = query.lte('start_at', `${endDate}T23:59:59`);

    if (!startDate && !endDate) {
      const now = new Date();
      const fourWeeks = new Date(now.getTime() + 28 * 86400000);
      query = query
        .gte('start_at', now.toISOString())
        .lte('start_at', fourWeeks.toISOString());
    }

    if (dealId) query = query.eq('deal_id', dealId);
    if (contactId) query = query.eq('contact_id', contactId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const events = (data || []).map((e: any) => ({
      ...e,
      deal_title: e.deal?.title,
      contact_name: e.contact?.full_name,
      contact_company: e.contact?.company,
      deal: undefined,
      contact: undefined,
    }));

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();

    if (!body.end_at && body.start_at && !body.all_day) {
      const start = new Date(body.start_at);
      start.setHours(start.getHours() + 1);
      body.end_at = start.toISOString();
    }

    if (!body.color && body.event_type) {
      const typeColors: Record<string, string> = {
        meeting: '#3B82F6', call: '#10B981', video_call: '#8B5CF6',
        event: '#F5A623', deadline: '#EF4444', reminder: '#64748B',
      };
      body.color = typeColors[body.event_type] || '#3B82F6';
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ ...body, created_by: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data });
  } catch {
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
      .from('calendar_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event: data });
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

    const { error } = await supabase
      .from('calendar_events')
      .update({ is_cancelled: true })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
