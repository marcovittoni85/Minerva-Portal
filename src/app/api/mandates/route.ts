// ============================================================
// app/api/mandates/route.ts
// GET: Lista mandati (filtro per deal_id opzionale)
// PATCH: Aggiorna status mandato
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

// GET — Lista mandati
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');

    let query = supabase
      .from('mandates')
      .select(`
        *,
        deal:deals(id, title, category),
        creator:profiles!created_by(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (dealId) {
      query = query.eq('deal_id', dealId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mandates: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH — Aggiorna status
export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { mandate_id, status, signed_document_url, notes } = await request.json();

    if (!mandate_id) {
      return NextResponse.json({ error: 'mandate_id richiesto' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (signed_document_url) updateData.signed_document_url = signed_document_url;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('mandates')
      .update(updateData)
      .eq('id', mandate_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mandate: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
