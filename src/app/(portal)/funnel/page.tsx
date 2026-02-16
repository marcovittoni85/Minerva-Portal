import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import FunnelBoard from "./FunnelBoard";

const STAGES = [
  "Origination",
  "Screening",
  "NDA",
  "DD",
  "Negotiation",
  "Signing",
  "Closed",
  "Dropped",
] as const;

export default async function FunnelPage() {
  const supabase = await supabaseServer();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-red-600">Non autenticato.</div>
      </div>
    );
  }

  // Recupera ruolo DOPO aver verificato user
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = String(prof?.role ?? "").toLowerCase();

  // Advisor completamente bloccato
  if (userRole === "advisor") {
    return (
      <div className="p-6 space-y-3">
        <Link href="/portal" className="underline">
          ← Torna
        </Link>
        <div className="rounded-xl border bg-white p-4">
          Accesso non consentito (Advisor).
        </div>
      </div>
    );
  }

  const { data: funnelRows, error } = await supabase
    .from("deal_funnel")
    .select("deal_id, stage, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error.message}</div>
      </div>
    );
  }

  const dealIds = Array.from(
    new Set((funnelRows ?? []).map((r: any) => r.deal_id))
  );

  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title")
    .in("id", dealIds);

  const dealMap = new Map((deals ?? []).map((d: any) => [d.id, d]));

  const initialRows = (funnelRows ?? [])
    .map((r: any) => {
      const d = dealMap.get(r.deal_id);
      if (!d) return null;

      const stage = STAGES.includes(r.stage as any)
        ? r.stage
        : "Origination";

      return { ...r, stage, deal: d };
    })
    .filter(Boolean) as any[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Funnel</h1>
          <p className="text-slate-600">
            Visibile solo ad Admin, Partner ed Editor.
          </p>
        </div>

        <Link className="underline" href="/portal/deals">
          Vai alle opportunità
        </Link>
      </div>

      <FunnelBoard initialRows={initialRows} />
    </div>
  );
}
