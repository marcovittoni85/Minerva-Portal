import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'default';

    const { searchParams } = new URL(request.url);
    const requestedRole = searchParams.get('role');
    const targetRole = (profile?.role === 'admin' && requestedRole) ? requestedRole : userRole;

    if (profile?.role === 'admin' && requestedRole === 'all') {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .order('role');
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ configs: data });
    }

    let { data } = await supabase
      .from('dashboard_configs')
      .select('*')
      .eq('role', targetRole)
      .eq('is_active', true)
      .single();

    if (!data) {
      const fallback = await supabase
        .from('dashboard_configs')
        .select('*')
        .eq('role', 'default')
        .single();
      data = fallback.data;
    }

    if (!data) return NextResponse.json({ error: 'Nessuna configurazione trovata' }, { status: 404 });
    return NextResponse.json({ config: data, user_role: userRole });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Solo admin' }, { status: 403 });
    }

    const { role, name, layout } = await request.json();
    if (!role || !layout) {
      return NextResponse.json({ error: 'role e layout richiesti' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dashboard_configs')
      .upsert({
        role,
        name: name || `Dashboard ${role}`,
        layout,
        updated_by: user.id,
        is_active: true,
      }, { onConflict: 'role' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ config: data });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
