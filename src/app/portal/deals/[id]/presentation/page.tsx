export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import PresentationClient from "./PresentationClient";

export default async function PresentationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") redirect("/portal");

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!deal) redirect("/portal/pipeline");

  let originatorName = "";
  if (deal.originator_id) {
    const { data: orig } = await supabase.from("profiles").select("full_name").eq("id", deal.originator_id).single();
    originatorName = orig?.full_name || "";
  }

  return <PresentationClient deal={deal} originatorName={originatorName} />;
}
