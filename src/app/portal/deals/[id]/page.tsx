export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DealDetailClient from "./DealDetailClient";

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

  if (!hasAccess) redirect("/portal/board");

  let originatorName = "";
  if (deal.originator_id) {
    const { data: origProf } = await supabase.from("profiles").select("full_name").eq("id", deal.originator_id).single();
    originatorName = origProf?.full_name || "";
  }

  const { data: comments } = await supabase
    .from("deal_comments")
    .select("id, message, created_at, user_id")
    .eq("deal_id", id)
    .order("created_at", { ascending: true });

  const commenterIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: commenterProfiles } = commenterIds.length > 0
    ? await supabase.from("profiles").select("id, full_name, role").in("id", commenterIds)
    : { data: [] };
  const commenterMap = Object.fromEntries((commenterProfiles ?? []).map((p) => [p.id, { name: p.full_name, role: p.role?.toString() }]));

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