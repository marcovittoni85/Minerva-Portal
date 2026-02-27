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

  // Get declaration data for workgroup members
  const { data: declarations } = wgUserIds.length > 0
    ? await supabase.from("deal_declarations").select("user_id, role_in_deal, has_mandate, mandate_counterparty, mandate_fee_type, mandate_fee_value, has_conflict, conflict_details, is_chain_mandate, chain_mandante_name, chain_mandante_company, chain_mandante_contact, chain_mandante_relationship, review_status, declared_at").eq("deal_id", id).in("user_id", wgUserIds)
    : { data: [] };
  const declMap: Record<string, "none" | "pending" | "conflict" | "approved"> = {};
  const declDataMap: Record<string, any> = {};
  (declarations ?? []).forEach(d => {
    if (d.has_conflict) declMap[d.user_id] = "conflict";
    else if (d.review_status === "approved") declMap[d.user_id] = "approved";
    else declMap[d.user_id] = "pending";
    declDataMap[d.user_id] = {
      roleInDeal: d.role_in_deal,
      hasMandate: d.has_mandate,
      mandateCounterparty: d.mandate_counterparty,
      mandateFeeType: d.mandate_fee_type,
      mandateFeeValue: d.mandate_fee_value,
      hasConflict: d.has_conflict,
      conflictDetails: d.conflict_details,
      isChainMandate: d.is_chain_mandate,
      chainMandanteName: d.chain_mandante_name,
      chainMandanteCompany: d.chain_mandante_company,
      chainMandanteContact: d.chain_mandante_contact,
      chainMandanteRelationship: d.chain_mandante_relationship,
      reviewStatus: d.review_status,
      declaredAt: d.declared_at,
    };
  });

  // Fetch activity log
  const { data: activityRows } = await supabase
    .from("deal_activity_log")
    .select("id, user_id, action, details, created_at")
    .eq("deal_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Resolve user names for activity log
  const activityUserIds = [...new Set((activityRows ?? []).map(r => r.user_id).filter(Boolean))];
  const { data: activityProfiles } = activityUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", activityUserIds)
    : { data: [] };
  const activityNameMap: Record<string, string> = Object.fromEntries(
    (activityProfiles ?? []).map(p => [p.id, p.full_name])
  );

  const activityLog = (activityRows ?? []).map(r => ({
    id: r.id,
    userName: activityNameMap[r.user_id] || "Sistema",
    action: r.action,
    details: r.details,
    createdAt: r.created_at,
  }));

  // Fetch signed mandate (for fee import)
  const { data: signedMandate } = await supabase
    .from("mandates")
    .select("id, status")
    .eq("deal_id", id)
    .eq("status", "signed")
    .limit(1)
    .maybeSingle();

  // Fetch presentation requests
  const { data: presentationRows } = await supabase
    .from("presentation_requests")
    .select("id, user_id, counterparty_name, counterparty_company, counterparty_role, notes, status, created_at")
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  const presUserIds = [...new Set((presentationRows ?? []).map(r => r.user_id).filter(Boolean))];
  const { data: presProfiles } = presUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", presUserIds)
    : { data: [] };
  const presNameMap: Record<string, string> = Object.fromEntries(
    (presProfiles ?? []).map(p => [p.id, p.full_name])
  );

  const presentationRequests = (presentationRows ?? []).map(r => {
    return {
      id: r.id,
      userName: presNameMap[r.user_id] || "Utente",
      userId: r.user_id,
      counterpartyName: r.counterparty_name || "",
      counterpartyCompany: r.counterparty_company || "",
      counterpartyRole: r.counterparty_role || "",
      notes: r.notes || "",
      status: r.status || "pending",
      createdAt: r.created_at,
    };
  });

  return (
    <DealManageClient
      deal={deal}
      originatorName={originatorName}
      accessMembers={(accessProfiles ?? []).map(p => ({ id: p.id, name: p.full_name, role: p.role }))}
      workgroupMembers={(wgProfiles ?? []).map(p => ({ id: p.id, name: p.full_name, role: p.role, roleInDeal: wgRoleMap[p.id] || "", declarationStatus: declMap[p.id] || "none", declaration: declDataMap[p.id] || null }))}
      adminId={user.id}
      activityLog={activityLog}
      presentationRequests={presentationRequests}
      signedMandateId={signedMandate?.id || null}
    />
  );
}
