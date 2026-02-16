"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function RequestAccessButton({ dealId }: { dealId: string }) {
  const supabase = supabaseBrowser();
  const [state, setState] = useState<"loading" | "has_access" | "pending" | "none">("loading");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return setState("none");

    // 1) ha già accesso?
    const { data: acc, error: e1 } = await supabase
      .from("deal_access")
      .select("access_level")
      .eq("deal_id", dealId)
      .eq("user_id", uid)
      .maybeSingle();

    if (!e1 && acc) return setState("has_access");

    // 2) richiesta pending?
    const { data: req, error: e2 } = await supabase
      .from("deal_access_requests")
      .select("status")
      .eq("deal_id", dealId)
      .eq("user_id", uid)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!e2 && req?.status === "pending") return setState("pending");

    setState("none");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function request() {
    setMsg(null);
    const { data: me } = await supabase.auth.getUser();
    const uid = me.user?.id;
    if (!uid) return setMsg("Non autenticato.");

    const { error } = await supabase.from("deal_access_requests").insert({
      deal_id: dealId,
      user_id: uid,
      status: "pending",
    });

    if (error) {
      if ((error as any).code === "23505" || (error as any).status === 409) {
        setState("pending");
        return setMsg("Richiesta già inviata.");
      }
      return setMsg(error.message);
    }

    setState("pending");
    setMsg("Richiesta inviata.");
  }

  if (state === "loading") return <span className="text-xs text-slate-500">…</span>;

  if (state === "has_access") {
    return (
      <Link className="underline" href={`/portal/deals/${dealId}`}>
        Apri
      </Link>
    );
  }

  if (state === "pending") {
    return <span className="text-xs text-slate-500">Richiesta inviata</span>;
  }

  return (
    <div className="inline-flex flex-col items-end gap-2">
      <button
        onClick={request}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50"
      >
        Richiedi accesso
      </button>
      {msg && <div className="text-xs text-slate-600">{msg}</div>}
    </div>
  );
}
