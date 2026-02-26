export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import DeclarationForm from "./DeclarationForm";

export default async function DeclarationPage({ params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Service-role client to bypass RLS for authorization checks
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Check user is in the workgroup for this deal
  const { data: wgEntry } = await admin
    .from("deal_workgroup")
    .select("id")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wgEntry) redirect("/portal");

  // Check if already declared
  const { data: existingDecl } = await admin
    .from("deal_declarations")
    .select("id")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: deal } = await admin.from("deals").select("id, title, code, sector").eq("id", dealId).single();
  if (!deal) redirect("/portal");

  return (
    <DeclarationForm
      deal={deal}
      userId={user.id}
      userEmail={user.email || ""}
      alreadyDeclared={!!existingDecl}
    />
  );
}
