// ============================================================
// app/api/fees/import-from-mandate/route.ts
// POST: Importa fee streams da un mandato esistente
// Crea automaticamente retainer + success fee dal mandato
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
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { mandate_id } = await request.json();
    if (!mandate_id) {
      return NextResponse.json({ error: 'mandate_id richiesto' }, { status: 400 });
    }

    // Recupera mandato
    const { data: mandate, error: mandateError } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', mandate_id)
      .single();

    if (mandateError || !mandate) {
      return NextResponse.json({ error: 'Mandato non trovato' }, { status: 404 });
    }

    const feeStreams = [];
    let retainerStreamId: string | null = null;

    // 1. Crea Retainer Fee (se presente)
    if (
      (mandate.fee_type === 'retainer_success' || mandate.fee_type === 'flat_fee') &&
      mandate.retainer_amount
    ) {
      const retainerData = {
        deal_id: mandate.deal_id,
        mandate_id: mandate.id,
        created_by: user.id,
        fee_type: 'retainer',
        label: mandate.retainer_description
          ? `Retainer Fee — ${mandate.retainer_description}`
          : 'Retainer Fee',
        description: `Da mandato ${mandate.client_short_name || mandate.client_company_name}`,
        projected_amount: mandate.retainer_amount,
        accrued_amount: mandate.retainer_amount, // Retainer matura alla firma
        percentage: null,
        calculation_base: null,
        base_amount: null,
        status: mandate.status === 'signed' ? 'accrued' : 'projected',
        accrual_date: mandate.status === 'signed' ? new Date().toISOString().split('T')[0] : null,
        vat_rate: 22.00,
        vat_amount: Math.round(mandate.retainer_amount * 0.22 * 100) / 100,
        currency: 'EUR',
      };

      const { data: retainer, error: retError } = await supabase
        .from('fee_streams')
        .insert(retainerData)
        .select()
        .single();

      if (retError) {
        return NextResponse.json({ error: `Errore retainer: ${retError.message}` }, { status: 500 });
      }

      retainerStreamId = retainer.id;
      feeStreams.push(retainer);
    }

    // 2. Crea Success Fee (se presente)
    if (
      (mandate.fee_type === 'retainer_success' || mandate.fee_type === 'success_only') &&
      mandate.success_fee_percentage
    ) {
      // Stima projected amount se abbiamo importi operazione
      let projectedAmount = null;
      if (mandate.operation_amount_max) {
        projectedAmount = Math.round(
          mandate.operation_amount_max * (mandate.success_fee_percentage / 100) * 100
        ) / 100;
      }

      const successData: Record<string, unknown> = {
        deal_id: mandate.deal_id,
        mandate_id: mandate.id,
        created_by: user.id,
        fee_type: 'success',
        label: `Success Fee ${mandate.success_fee_percentage}%`,
        description: mandate.success_fee_description ||
          `${mandate.success_fee_percentage}% su ${mandate.success_fee_base || 'Enterprise Value'}`,
        projected_amount: projectedAmount,
        accrued_amount: null, // Success fee matura al closing
        percentage: mandate.success_fee_percentage,
        calculation_base: mandate.success_fee_base || 'Enterprise Value',
        base_amount: null, // Sarà compilato quando si conosce l'EV effettivo
        deductible_from: null,
        deduction_amount: mandate.retainer_deductible && mandate.retainer_amount
          ? mandate.retainer_amount
          : 0,
        status: 'projected',
        vat_rate: 22.00,
        currency: 'EUR',
      };

      // Se retainer detraibile, collega
      if (mandate.retainer_deductible && retainerStreamId) {
        successData.deductible_from = retainerStreamId;
      }

      const { data: success, error: sucError } = await supabase
        .from('fee_streams')
        .insert(successData)
        .select()
        .single();

      if (sucError) {
        return NextResponse.json({ error: `Errore success: ${sucError.message}` }, { status: 500 });
      }

      feeStreams.push(success);
    }

    // 3. Fee custom (se presente)
    if (mandate.fee_type === 'custom' && mandate.custom_fee_text) {
      const customData = {
        deal_id: mandate.deal_id,
        mandate_id: mandate.id,
        created_by: user.id,
        fee_type: 'custom',
        label: 'Fee Personalizzata',
        description: mandate.custom_fee_text,
        status: 'projected',
        vat_rate: 22.00,
        currency: 'EUR',
      };

      const { data: custom, error: custError } = await supabase
        .from('fee_streams')
        .insert(customData)
        .select()
        .single();

      if (!custError) feeStreams.push(custom);
    }

    return NextResponse.json({
      success: true,
      fee_streams: feeStreams,
      imported_count: feeStreams.length,
    });
  } catch (error) {
    console.error('Import from mandate error:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
