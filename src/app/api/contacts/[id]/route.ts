// ============================================================
// app/api/contacts/[id]/route.ts
// GET: Dettaglio contatto con timeline interazioni e deal
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { id } = await params;

    // Contatto
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        *,
        referrer:contacts!referred_by(id, full_name)
      `)
      .eq('id', id)
      .single();

    if (contactError) return NextResponse.json({ error: contactError.message }, { status: 404 });

    // Interazioni (timeline)
    const { data: interactions } = await supabase
      .from('interactions')
      .select(`
        *,
        deal:deals(id, title),
        creator:profiles!created_by(id, full_name)
      `)
      .eq('contact_id', id)
      .order('interaction_date', { ascending: false });

    // Deal collegati
    const { data: linkedDeals } = await supabase
      .from('contact_deals')
      .select(`
        *,
        deal:deals(id, title, category, estimated_ev)
      `)
      .eq('contact_id', id)
      .eq('is_active', true);

    // Follow-up pendenti
    const { data: pendingFollowups } = await supabase
      .from('interactions')
      .select('id, title, follow_up_date, follow_up_notes, deal_id')
      .eq('contact_id', id)
      .eq('follow_up_done', false)
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    return NextResponse.json({
      contact,
      interactions: interactions || [],
      linked_deals: linkedDeals || [],
      pending_followups: pendingFollowups || [],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
