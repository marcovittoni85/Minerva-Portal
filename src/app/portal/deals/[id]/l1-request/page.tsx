export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import L1RequestClient from "./L1RequestClient";

export default async function L1RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, code, sector, side, ev_range, geography, blind_description, teaser_description, asset_class, board_status")
    .eq("id", id)
    .single();

  if (!deal) redirect("/portal/board");

  // Check if user already has an active request
  const { data: existing } = await supabase
    .from("deal_interest_requests")
    .select("id, l1_status, l2_status, anonymous_code")
    .eq("deal_id", id)
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <L1RequestClient
      deal={deal}
      existingRequest={existing}
    />
  );
}
