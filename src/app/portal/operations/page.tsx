export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import OperationsClient from "./OperationsClient";

export default async function OperationsPage() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  // Get deals where user is in workgroup AND stage is active
  const { data: wgRows } = await supabase
    .from("deal_workgroup")
    .select("deal_id, role_in_deal")
    .eq("user_id", user.id);

  const dealIds = [...new Set((wgRows ?? []).map((r) => r.deal_id))];
  if (dealIds.length === 0) {
    return <OperationsClient deals={[]} userId={user.id} />;
  }

  const myRoleMap: Record<string, string> = Object.fromEntries(
    (wgRows ?? []).map((r) => [r.deal_id, r.role_in_deal || "member"])
  );

  // Fetch active deals
  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title, sector, side, deal_stage, description")
    .in("id", dealIds)
    .in("deal_stage", ["workgroup", "in_progress", "closing"])
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (!deals || deals.length === 0) {
    return <OperationsClient deals={[]} userId={user.id} />;
  }

  const activeDealIds = deals.map((d) => d.id);

  // Get all workgroup members for these deals
  const { data: allWgRows } = await supabase
    .from("deal_workgroup")
    .select("deal_id, user_id")
    .in("deal_id", activeDealIds);

  const allUserIds = [
    ...new Set((allWgRows ?? []).map((r) => r.user_id).filter(Boolean)),
  ];
  const { data: profiles } =
    allUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", allUserIds)
      : { data: [] };
  const nameMap: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name || "Utente"])
  );

  // Group workgroup members per deal (exclude current user)
  const teamMap: Record<string, string[]> = {};
  (allWgRows ?? []).forEach((r) => {
    if (r.user_id === user.id) return;
    if (!teamMap[r.deal_id]) teamMap[r.deal_id] = [];
    const name = nameMap[r.user_id] || "Utente";
    if (!teamMap[r.deal_id].includes(name)) teamMap[r.deal_id].push(name);
  });

  // Check declaration status for current user
  const { data: declRows } = await supabase
    .from("deal_declarations")
    .select("deal_id")
    .eq("user_id", user.id)
    .in("deal_id", activeDealIds);
  const declaredSet = new Set((declRows ?? []).map((r) => r.deal_id));

  // Get last activity per deal
  const { data: actRows } = await supabase
    .from("deal_activity_log")
    .select("deal_id, action, created_at")
    .in("deal_id", activeDealIds)
    .order("created_at", { ascending: false });

  const lastActivityMap: Record<string, { action: string; created_at: string }> = {};
  (actRows ?? []).forEach((r) => {
    if (!lastActivityMap[r.deal_id]) {
      lastActivityMap[r.deal_id] = { action: r.action, created_at: r.created_at };
    }
  });

  // Build final data
  const enrichedDeals = deals.map((d) => ({
    id: d.id,
    code: d.code,
    title: d.title,
    sector: d.sector,
    side: d.side,
    deal_stage: d.deal_stage,
    description: d.description,
    myRole: myRoleMap[d.id] || "member",
    declared: declaredSet.has(d.id),
    team: teamMap[d.id] || [],
    lastActivity: lastActivityMap[d.id] || null,
  }));

  return <OperationsClient deals={enrichedDeals} userId={user.id} />;
}
