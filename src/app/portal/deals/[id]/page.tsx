export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DealDetailClient from "./DealDetailClient";
import DealPreview from "./DealPreview";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role?.toString() === "admin";

  const { data: access } = await supabase.from("deal_access").select("*").eq("deal_id", id).eq("user_id", user.id).maybeSingle();
  const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();

  if (!deal) redirect("/portal/my-deals");

  const isOriginator = deal.originator_id === user.id;

  // Check L1/L2 interest request status
  const { data: interestRequest } = await supabase
    .from("deal_interest_requests")
    .select("id, anonymous_code, l1_status, l2_status, l1_expires_at, l1_decline_forwarded_text, l2_decline_forwarded_text")
    .eq("deal_id", id)
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasL1 = interestRequest?.l1_status === "approved";
  const hasL2 = interestRequest?.l2_status === "approved";
  const hasLegacyAccess = !!access;
  const hasAccess = isAdmin || isOriginator || hasLegacyAccess || hasL1 || hasL2;

  // Show preview for non-approved users instead of redirecting
  if (!hasAccess) {
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
          blind_description: deal.blind_description,
          teaser_description: deal.teaser_description,
          asset_class: deal.asset_class,
          board_status: deal.board_status,
        }}
        interestStatus={
          interestRequest?.l1_status === "pending" ? "l1_pending" :
          interestRequest?.l1_status === "declined" ? "l1_declined" : "none"
        }
        declineMessage={interestRequest?.l1_decline_forwarded_text || undefined}
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

  // Fetch documents with uploader names
  const { data: rawDocs } = await supabase
    .from("deal_documents")
    .select("id, file_name, storage_path, mime_type, size_bytes, category, created_at, uploader_id")
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  const uploaderIds = [...new Set((rawDocs ?? []).map((d) => d.uploader_id))];
  const { data: uploaderProfiles } = uploaderIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", uploaderIds)
    : { data: [] };
  const uploaderMap = Object.fromEntries((uploaderProfiles ?? []).map((p) => [p.id, p.full_name]));

  const initialDocs = (rawDocs ?? []).map((d) => ({
    ...d,
    uploader_name: d.uploader_id === user.id ? "Tu" : (uploaderMap[d.uploader_id] || "Utente"),
  }));

  // Fetch presentation request status
  const { data: presentationEntry } = await supabase
    .from("presentation_requests")
    .select("id, status")
    .eq("deal_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const presentationStatus: "none" | "pending" | "approved" | "rejected" =
    presentationEntry?.status === "pending" ? "pending" :
    presentationEntry?.status === "approved" ? "approved" :
    presentationEntry?.status === "rejected" ? "rejected" : "none";

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
      initialDocs={initialDocs}
      presentationStatus={presentationStatus}
      authLevel={hasL2 ? "l2" : hasL1 ? "l1" : (isAdmin || isOriginator || hasLegacyAccess) ? "full" : "blind"}
      interestRequest={interestRequest ? {
        id: interestRequest.id,
        anonymousCode: interestRequest.anonymous_code,
        l1Status: interestRequest.l1_status,
        l2Status: interestRequest.l2_status,
        l1ExpiresAt: interestRequest.l1_expires_at,
      } : undefined}
    />
  );
}