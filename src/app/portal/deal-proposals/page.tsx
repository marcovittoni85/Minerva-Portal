import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DealProposalsClient from "./DealProposalsClient";

export default async function DealProposalsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "admin") redirect("/portal");

  const { data: proposals } = await supabase
    .from("deals")
    .select("id, title, sector, side, geography, ev_range, description, min_ticket, status, created_at, created_by, asset_class, checklist_completeness, rejection_type, parked_until")
    .in("status", ["pending_review", "pending_integration"])
    .order("created_at", { ascending: false });

  const userIds = [...new Set((proposals ?? []).map(p => p.created_by).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));

  return <DealProposalsClient proposals={proposals ?? []} profileMap={profileMap} />;
}