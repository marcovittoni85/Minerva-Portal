export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import NDAGeneratorClient from "./NDAGeneratorClient";

export default async function NDAGeneratorPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify user has approved presentation request
  const { data: presRequest } = await supabase
    .from("presentation_requests")
    .select("id, status, counterparty_name, counterparty_company, counterparty_role")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!presRequest) {
    redirect("/portal/my-deals");
  }

  // Fetch deal info
  const { data: deal } = await supabase.from("deals").select("id, code, title").eq("id", dealId).single();
  if (!deal) redirect("/portal/my-deals");

  return (
    <NDAGeneratorClient
      deal={{ id: deal.id, code: deal.code, title: deal.title }}
      counterparty={{
        name: presRequest.counterparty_name || "",
        company: presRequest.counterparty_company || "",
        role: presRequest.counterparty_role || "",
      }}
      userId={user.id}
    />
  );
}
