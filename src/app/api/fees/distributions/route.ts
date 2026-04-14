// ============================================================
// app/api/fees/distributions/route.ts
// POST: Crea distribuzione
// PATCH: Aggiorna distribuzione
// DELETE: Elimina distribuzione
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const body = await request.json();

    // Calcola importo se c'è percentuale e la fee stream ha accrued
    if (body.percentage && body.fee_stream_id && !body.calculated_amount) {
      const { data: stream } = await supabase
        .from('fee_streams')
        .select('accrued_amount')
        .eq('id', body.fee_stream_id)
        .single();

      if (stream?.accrued_amount) {
        body.calculated_amount = Math.round(
          stream.accrued_amount * (body.percentage / 100) * 100
        ) / 100;
      }
    }

    const { data, error } = await supabase
      .from('fee_distributions')
      .insert(body)
      .select(`*, recipient:profiles!recipient_id(id, full_name, avatar_url)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ distribution: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    const { data, error } = await supabase
      .from('fee_distributions')
      .update(updates)
      .eq('id', id)
      .select(`*, recipient:profiles!recipient_id(id, full_name, avatar_url)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ distribution: data });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id richiesto' }, { status: 400 });

    const { error } = await supabase.from('fee_distributions').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
