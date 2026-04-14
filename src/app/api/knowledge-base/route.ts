import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sector = searchParams.get('sector');
    const tag = searchParams.get('tag');
    const dealId = searchParams.get('deal_id');
    const contactId = searchParams.get('contact_id');
    const pinned = searchParams.get('pinned');
    const mine = searchParams.get('mine');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('kb_items')
      .select(`
        *,
        creator:profiles!created_by(id, full_name),
        deal:deals(id, title)
      `, { count: 'exact' })
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (sector) query = query.eq('sector', sector);
    if (tag) query = query.contains('tags', [tag]);
    if (dealId) query = query.eq('deal_id', dealId);
    if (contactId) query = query.eq('contact_id', contactId);
    if (pinned === 'true') query = query.eq('is_pinned', true);
    if (mine === 'true') query = query.eq('created_by', user.id);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,content.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ items: data, total: count });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';

    let itemData: any;
    let fileBuffer: Buffer | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const jsonData = formData.get('data') as string;
      itemData = JSON.parse(jsonData);

      if (file) {
        fileBuffer = Buffer.from(await file.arrayBuffer());
        fileName = file.name;
        fileType = file.type;
      }
    } else {
      itemData = await request.json();
    }

    if (fileBuffer && fileName) {
      const storagePath = `knowledge-base/${user.id}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: fileType || 'application/octet-stream',
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(storagePath);

        itemData.file_url = urlData.publicUrl;
        itemData.file_name = fileName;
        itemData.file_type = fileType;
        itemData.file_size = fileBuffer.length;
      }
    }

    const { data, error } = await supabase
      .from('kb_items')
      .insert({ ...itemData, created_by: user.id })
      .select(`*, creator:profiles!created_by(id, full_name)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
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
      .from('kb_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
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
      .from('kb_items')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
