export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import L2RequestClient from "./L2RequestClient";

export default async function L2RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, code")
    .eq("id", id)
    .single();

  if (!deal) redirect("/portal/board");

  // Fetch user's L1-approved request
  const { data: interest } = await supabase
    .from("deal_interest_requests")
    .select("id, anonymous_code, l1_status, l2_status, l1_expires_at, l2_client_name, l2_client_surname, l2_client_company, l2_client_email, l2_fee_from_client, l2_fee_from_minerva, l2_mandate_type, l2_mandate_file_url, l2_nda_file_url, l2_admin_notes")
    .eq("deal_id", id)
    .eq("requester_id", user.id)
    .eq("l1_status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!interest) redirect(`/portal/deals/${id}/l1-request`);

  return <L2RequestClient deal={deal} interest={interest} />;
}
