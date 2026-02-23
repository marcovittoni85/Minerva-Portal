export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DealDetailClient from "./DealDetailClient";
import DealPreview from "./DealPreview";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role?.toString() === "admin";

  const { data: access } = await supabase.from("deal_access").select("*").eq("deal_id", id).eq("user_id", user.id).maybeSingle();
  const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();

  if (!deal) redirect("/portal/my-deals");

  const isOriginator = deal.originator_id === user.id;
  const hasAccess = isAdmin || isOriginator || !!access;

  // Show preview for non-approved users instead of redirecting
  if (!hasAccess) {
    const { data: request } = await supabase
      .from("deal_access_requests")
      .select("status")
      .eq("deal_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const accessStatus: "none" | "pending" | "rejected" =
      request?.status === "pending" ? "pending" :
      request?.status === "rejected" ? "rejected" : "none";

    return (
      <DealPreview
        deal={{
          id: deal.id,
          code: deal.code,
          title: deal.title,
          sector: deal.sector,
          sub_sector: deal.sub_sector,
          deal_type: deal.deal_type,
          side: deal.side,
          ev_range: deal.ev_range,
          geography: deal.geography,
          thematic_area: deal.thematic_area,
        }}
        accessStatus={accessStatus}
      />
    );
  }

  let originatorName = "";
  if (isAdmin && deal.originator_id) {
    const { data: origProf } = await supabase.from("profiles").select("full_name").eq("id", deal.originator_id).single();
    originatorName = origProf?.full_name || "";
  }

 const { data: comments } = await supabase
    .from("deal_comments")
    .select("id, content, created_at, user_id")
    .eq("deal_id", id)
    .order("created_at", { ascending: true });

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commenterProfiles } = commenterIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, role").in("id", commenterIds)
    : { data: [] };
  const commenterMap = Object.fromEntries((commenterProfiles ?? []).map((p) => [p.id, { name: p.full_name, role: p.role?.toString() }]));

  // Log deal_viewed activity
  await supabase.from("deal_activity_log").insert({
    deal_id: id,
    user_id: user.id,
    action: "deal_viewed",
    details: { deal_title: deal.title },
  });

  return (
    <DealDetailClient
      deal={deal}
      comments={comments ?? []}
      commenterMap={commenterMap}
      originatorName={originatorName}
      isAdmin={isAdmin}
      isOriginator={isOriginator}
      userId={user.id}
    />
  );
}