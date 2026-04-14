// ============================================================
// app/api/cockpit/route.ts
// GET: Aggregated cockpit dashboard data in a single call
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, getAuthUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    // Parallel queries
    const [
      profileResult,
      todayTasksResult,
      upcomingTasksResult,
      overdueResult,
      activeDealsResult,
      keyContactsResult,
      weekInteractionsResult,
      recentInteractionsResult,
      followupResult,
    ] = await Promise.all([
      // User profile
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),

      // Tasks due today or earlier (not completed)
      supabase.from('tasks')
        .select('*, deal:deals(id, title), contact:contacts(id, full_name)')
        .eq('is_completed', false)
        .lte('due_date', today)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true }),

      // Tasks next 7 days (not completed, after today)
      supabase.from('tasks')
        .select('*, deal:deals(id, title), contact:contacts(id, full_name)')
        .eq('is_completed', false)
        .gt('due_date', today)
        .lte('due_date', nextWeek)
        .order('due_date', { ascending: true })
        .order('priority', { ascending: true }),

      // Overdue count
      supabase.from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', false)
        .lt('due_date', today),

      // Active deals
      supabase.from('deals')
        .select('id, title, deal_stage, sector, estimated_ev, deal_type')
        .eq('active', true)
        .not('deal_stage', 'in', '("closed_won","closed_lost")')
        .order('updated_at', { ascending: false })
        .limit(8),

      // Key contacts count
      supabase.from('contacts')
        .select('id', { count: 'exact', head: true })
        .in('strength', ['key', 'strong']),

      // Interactions this week count
      supabase.from('interactions')
        .select('id', { count: 'exact', head: true })
        .gte('interaction_date', weekAgo),

      // Recent interactions (last 10)
      supabase.from('interactions')
        .select('id, interaction_type, title, interaction_date, contact_id, contact:contacts(id, full_name, company)')
        .order('interaction_date', { ascending: false })
        .limit(10),

      // Pending follow-ups count
      supabase.from('interactions')
        .select('id', { count: 'exact', head: true })
        .eq('follow_up_done', false)
        .not('follow_up_date', 'is', null)
        .lte('follow_up_date', nextWeek),
    ]);

    // Build upcoming deadlines from tasks + follow-ups + fee deadlines
    const upcomingDeadlines: { type: string; title: string; due_date: string; deal_title?: string }[] = [];

    // Add upcoming task deadlines
    (upcomingTasksResult.data || []).forEach(t => {
      if (t.due_date) {
        upcomingDeadlines.push({
          type: t.category === 'follow_up' ? 'follow_up' : t.category === 'document' ? 'document' : 'task',
          title: t.title,
          due_date: t.due_date,
          deal_title: t.deal?.title,
        });
      }
    });

    // Format recent interactions
    const recentInteractions = (recentInteractionsResult.data || []).map((i: any) => ({
      id: i.id,
      interaction_type: i.interaction_type,
      title: i.title,
      interaction_date: i.interaction_date,
      contact_id: i.contact_id,
      contact_name: i.contact?.full_name || 'Sconosciuto',
      contact_company: i.contact?.company || '',
    }));

    return NextResponse.json({
      user_name: profileResult.data?.full_name || 'Utente',
      tasks_today: todayTasksResult.data || [],
      tasks_upcoming: upcomingTasksResult.data || [],
      overdue_count: overdueResult.count || 0,
      followup_count: followupResult.count || 0,
      active_deals: (activeDealsResult.data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        deal_stage: d.deal_stage,
        sector: d.sector,
        estimated_ev: d.estimated_ev || '',
        category: d.deal_type || d.sector,
      })),
      key_contacts_count: keyContactsResult.count || 0,
      interactions_this_week: weekInteractionsResult.count || 0,
      recent_interactions: recentInteractions,
      upcoming_deadlines: upcomingDeadlines.sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 10),
    });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
