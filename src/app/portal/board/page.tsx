import { supabaseServer } from "@/lib/supabase-server";
import BoardClient from "./BoardClient";

export default async function BoardPage() {
  const supabase = await supabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;

  if (!uid) return <div className="p-6 text-slate-400">Non autenticato.</div>;

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  const role = String(prof?.role ?? "");
  const isAdmin = role === "admin";

  const { data: deals, error } = await supabase.rpc("get_board_deals");

  // Filter out deals hidden from board (is_visible_board = false)
  let visibleDeals = (deals ?? []).filter((d: any) => d.is_visible_board !== false);

  // For admins, batch-fetch originator names
  let originatorMap: Record<string, string> = {};
  if (isAdmin && visibleDeals.length > 0) {
    const originatorIds = [...new Set(visibleDeals.map((d: any) => d.originator_id).filter(Boolean))] as string[];
    if (originatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", originatorIds);
      if (profiles) {
        for (const p of profiles) {
          originatorMap[p.id] = p.full_name || "N/A";
        }
      }
    }
  }

  return <BoardClient deals={visibleDeals} isAdmin={isAdmin} originatorMap={originatorMap} error={error?.message} />;
}
