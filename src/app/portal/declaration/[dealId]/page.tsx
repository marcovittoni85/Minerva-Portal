export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DeclarationForm from "./DeclarationForm";

export default async function DeclarationPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check user is in the workgroup for this deal
  const { data: wgEntry } = await supabase
    .from("deal_workgroup")
    .select("id")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wgEntry) redirect("/portal");

  // Check if already declared
  const { data: existingDecl } = await supabase
    .from("deal_declarations")
    .select("id")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: deal } = await supabase.from("deals").select("id, title, code, sector").eq("id", dealId).single();
  if (!deal) redirect("/portal");

  return (
    <DeclarationForm
      deal={deal}
      userId={user.id}
      alreadyDeclared={!!existingDecl}
    />
  );
}
