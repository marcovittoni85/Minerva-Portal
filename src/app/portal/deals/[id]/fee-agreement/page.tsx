export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import FeeAgreementClient from "./FeeAgreementClient";

export default async function FeeAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") redirect("/portal");

  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, code, originator_id, ev_range, asset_class")
    .eq("id", id)
    .single();

  if (!deal) redirect("/portal/pipeline");

  // Fetch originator name
  let originatorName = "";
  if (deal.originator_id) {
    const { data: orig } = await supabase.from("profiles").select("full_name").eq("id", deal.originator_id).single();
    originatorName = orig?.full_name || "";
  }

  // Fetch existing fee agreement if any
  const { data: existing } = await supabase
    .from("deal_fee_agreements")
    .select("*")
    .eq("deal_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch L2-approved requests for party info
  const { data: l2Requests } = await supabase
    .from("deal_interest_requests")
    .select("id, anonymous_code, requester_id, l2_client_name, l2_client_surname, l2_client_company, l2_fee_from_client, l2_fee_from_minerva")
    .eq("deal_id", id)
    .eq("l2_status", "approved");

  const requesterIds = (l2Requests ?? []).map(r => r.requester_id);
  const { data: requesterProfiles } = requesterIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", requesterIds)
    : { data: [] };
  const requesterMap = Object.fromEntries((requesterProfiles ?? []).map(p => [p.id, p.full_name]));

  return (
    <FeeAgreementClient
      deal={deal}
      originatorName={originatorName}
      existing={existing}
      l2Requests={(l2Requests ?? []).map(r => ({
        ...r,
        requester_name: requesterMap[r.requester_id] || "Sconosciuto",
      }))}
      userId={user.id}
    />
  );
}
