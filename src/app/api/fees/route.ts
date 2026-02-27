// ============================================================
// app/api/fees/route.ts
// GET: Lista fee streams (filtro per deal_id)
// POST: Crea nuovo fee stream
// PATCH: Aggiorna fee stream
// DELETE: Elimina fee stream
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET — Lista fee streams
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('deal_id');
    const status = searchParams.get('status');
    const includeSummary = searchParams.get('summary') === 'true';

    // Se richiesto il summary dashboard
    if (includeSummary && !dealId) {
      const { data, error } = await supabase
        .from('fee_dashboard_summary')
        .select('*');

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ summary: data });
    }

    // Query fee streams
    let query = supabase
      .from('fee_streams')
      .select(`
        *,
        deal:deals(id, title, category),
        mandate:mandates(id, client_company_name),
        payments:fee_payments(*),
        distributions:fee_distributions(
          *,
          recipient:profiles!recipient_id(id, full_name, avatar_url)
        )
      `)
      .order('created_at', { ascending: false });

    if (dealId) query = query.eq('deal_id', dealId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se per un deal specifico, includi anche il summary
    let summary = null;
    if (dealId) {
      const { data: summData } = await supabase
        .from('fee_dashboard_summary')
        .select('*')
        .eq('deal_id', dealId)
        .single();
      summary = summData;
    }

    return NextResponse.json({ fee_streams: data, summary });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST — Crea fee stream
export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
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

    const body = await request.json();

    // Calcola VAT
    if (body.accrued_amount && body.vat_rate) {
      body.vat_amount = Math.round(body.accrued_amount * (body.vat_rate / 100) * 100) / 100;
    }

    const { data, error } = await supabase
      .from('fee_streams')
      .insert({ ...body, created_by: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fee_stream: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH — Aggiorna fee stream
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    // Ricalcola VAT se necessario
    if (updates.accrued_amount !== undefined && updates.vat_rate !== undefined) {
      updates.vat_amount = Math.round(updates.accrued_amount * (updates.vat_rate / 100) * 100) / 100;
    }

    // Se viene settata una base_amount con percentage, calcola accrued
    if (updates.base_amount && updates.percentage && !updates.accrued_amount) {
      updates.accrued_amount = Math.round(updates.base_amount * (updates.percentage / 100) * 100) / 100;
    }

    const { data, error } = await supabase
      .from('fee_streams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fee_stream: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE — Elimina fee stream
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    const { error } = await supabase.from('fee_streams').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
