// ============================================================
// app/api/mandates/generate/route.ts
// POST: Genera il DOCX del mandato e lo salva su Supabase Storage
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';
import { generateMandateDocx } from '@/lib/generate-mandate-docx';
import type { MandateData } from '@/types/mandate';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // Verifica ruolo admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo gli admin possono generare mandati' }, { status: 403 });
    }

    const body = await request.json();
    const { mandate_id, mandate_data } = body as {
      mandate_id?: string;
      mandate_data: MandateData;
    };

    // Genera il DOCX
    const buffer = await generateMandateDocx(mandate_data);

    // Nome file
    const clientSlug = mandate_data.client_short_name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '') || 'cliente';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `mandato_${clientSlug}_${dateStr}.docx`;
    const storagePath = `mandates/${mandate_data.deal_id}/${fileName}`;

    // Upload su Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Errore upload documento' }, { status: 500 });
    }

    // URL pubblico (o signed)
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    const documentUrl = urlData.publicUrl;

    // Salva o aggiorna il mandato nel DB
    if (mandate_id) {
      // Aggiorna mandato esistente
      const { data: updated, error: updateError } = await supabase
        .from('mandates')
        .update({
          ...mandate_data,
          document_url: documentUrl,
          document_version: mandate_data.document_version
            ? mandate_data.document_version + 1
            : 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mandate_id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json({ error: 'Errore aggiornamento mandato' }, { status: 500 });
      }

      // Audit log
      await supabase.from('mandate_audit_log').insert({
        mandate_id,
        user_id: user.id,
        action: 'generated',
        details: { version: updated.document_version, file: fileName },
      });

      return NextResponse.json({
        success: true,
        mandate: updated,
        document_url: documentUrl,
        file_name: fileName,
      });
    } else {
      // Crea nuovo mandato
      const { data: created, error: createError } = await supabase
        .from('mandates')
        .insert({
          ...mandate_data,
          created_by: user.id,
          document_url: documentUrl,
          document_version: 1,
        })
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        return NextResponse.json({ error: 'Errore creazione mandato' }, { status: 500 });
      }

      // Audit log
      await supabase.from('mandate_audit_log').insert({
        mandate_id: created.id,
        user_id: user.id,
        action: 'created',
        details: { file: fileName },
      });

      return NextResponse.json({
        success: true,
        mandate: created,
        document_url: documentUrl,
        file_name: fileName,
      });
    }
  } catch (error) {
    console.error('Mandate generation error:', error);
    return NextResponse.json(
      { error: 'Errore interno generazione mandato' },
      { status: 500 }
    );
  }
}
