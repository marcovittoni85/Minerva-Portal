export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import L2ReviewClient from "./L2ReviewClient";

export default async function L2ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role === "admin";

  const { data: deal } = await supabase
    .from("deals")
    .select("id, title, code, originator_id")
    .eq("id", id)
    .single();

  if (!deal) redirect("/portal/board");

  const isOriginator = deal.originator_id === user.id;
  if (!isOriginator && !isAdmin) redirect("/portal/board");

  return <L2ReviewClient dealId={deal.id} dealTitle={deal.title} dealCode={deal.code} isAdmin={isAdmin} isOriginator={isOriginator} />;
}
