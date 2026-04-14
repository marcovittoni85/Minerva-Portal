export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AuditLogClient from "./AuditLogClient";

export default async function AuditLogPage() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") redirect("/portal");

  // Fetch all deals for the filter dropdown
  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title")
    .eq("active", true)
    .order("code");

  return <AuditLogClient deals={deals ?? []} />;
}
