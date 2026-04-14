export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PipelineClient from "./PipelineClient";

export default async function PipelinePage() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") redirect("/portal");

  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title, sector, deal_stage, originator_id, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  // Originator names
  const originatorIds = [...new Set((deals ?? []).map(d => d.originator_id).filter(Boolean))];
  const { data: originatorProfiles } = originatorIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", originatorIds)
    : { data: [] };
  const originatorMap: Record<string, string> = Object.fromEntries(
    (originatorProfiles ?? []).map(p => [p.id, p.full_name])
  );

  // Workgroup member counts
  const dealIds = (deals ?? []).map(d => d.id);
  const { data: wgRows } = dealIds.length > 0
    ? await supabase.from("deal_workgroup").select("deal_id").in("deal_id", dealIds)
    : { data: [] };
  const wgCounts: Record<string, number> = {};
  (wgRows ?? []).forEach((r: any) => { wgCounts[r.deal_id] = (wgCounts[r.deal_id] || 0) + 1; });

  // Enrich deals
  const enrichedDeals = (deals ?? []).map(d => ({
    id: d.id,
    code: d.code,
    title: d.title,
    sector: d.sector,
    deal_stage: d.deal_stage || "board",
    originator: originatorMap[d.originator_id] || "—",
    wgCount: wgCounts[d.id] || 0,
  }));

  return <PipelineClient deals={enrichedDeals} />;
}
