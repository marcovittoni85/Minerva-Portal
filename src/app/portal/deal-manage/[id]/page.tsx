export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DealManageClient from "./DealManageClient";

export default async function DealManageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role === "admin";
  if (!isAdmin) redirect("/portal");

  const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();
  if (!deal) redirect("/portal/deal-manage");

  // Get originator name
  let originatorName = "—";
  if (deal.originator_id) {
    const { data: origProfile } = await supabase.from("profiles").select("full_name").eq("id", deal.originator_id).single();
    originatorName = origProfile?.full_name || "—";
  }

  // Get approved members (deal_access)
  const { data: accessRows } = await supabase.from("deal_access").select("user_id").eq("deal_id", id);
  const accessUserIds = (accessRows ?? []).map(r => r.user_id);
  const { data: accessProfiles } = accessUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, role").in("id", accessUserIds)
    : { data: [] };

  // Get workgroup members
  const { data: wgRows } = await supabase.from("deal_workgroup").select("user_id, role_in_deal").eq("deal_id", id);
  const wgUserIds = (wgRows ?? []).map(r => r.user_id);
  const { data: wgProfiles } = wgUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, role").in("id", wgUserIds)
    : { data: [] };

  const wgRoleMap = Object.fromEntries((wgRows ?? []).map(r => [r.user_id, r.role_in_deal]));

  // Get declaration statuses for workgroup members
  const { data: declarations } = wgUserIds.length > 0
    ? await supabase.from("deal_declarations").select("user_id, has_conflict, review_status").eq("deal_id", id).in("user_id", wgUserIds)
    : { data: [] };
  const declMap: Record<string, "none" | "pending" | "conflict" | "approved"> = {};
  (declarations ?? []).forEach(d => {
    if (d.has_conflict) declMap[d.user_id] = "conflict";
    else if (d.review_status === "approved") declMap[d.user_id] = "approved";
    else declMap[d.user_id] = "pending";
  });

  return (
    <DealManageClient
      deal={deal}
      originatorName={originatorName}
      accessMembers={(accessProfiles ?? []).map(p => ({ id: p.id, name: p.full_name, role: p.role }))}
      workgroupMembers={(wgProfiles ?? []).map(p => ({ id: p.id, name: p.full_name, role: p.role, roleInDeal: wgRoleMap[p.id] || "", declarationStatus: declMap[p.id] || "none" }))}
      adminId={user.id}
    />
  );
}
