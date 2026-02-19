import { supabaseServer } from "@/lib/supabase-server";
import BoardClient from "./BoardClient";

export default async function BoardPage() {
  const supabase = await supabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;

  if (!uid) return <div className="p-6 text-slate-400">Non autenticato.</div>;

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  const role = String(prof?.role ?? "");
  const isAdmin = role === "admin" || role === "equity_partner";

  const { data: deals, error } = await supabase.rpc("get_board_deals");

  return <BoardClient deals={deals ?? []} isAdmin={isAdmin} error={error?.message} />;
}