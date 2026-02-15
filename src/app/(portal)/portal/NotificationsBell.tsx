"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function NotificationsBell() {
  const supabase = supabaseBrowser();
  const [count, setCount] = useState(0);

  async function refresh() {
    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return;

    const { count: c, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false);

    if (!error) setCount(c ?? 0);
  }

  useEffect(() => {
    let channel: any;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;

      await refresh();

      channel = supabase
        .channel(`notif-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications" },
          () => refresh()
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link
      href="/portal/notifications"
      className="relative inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50"
      title="Notifiche"
    >
      <span className={count > 0 ? "animate-[wiggle_0.35s_ease-in-out_infinite]" : ""}>
        🔔
      </span>
      <span>Notifiche</span>

      {count > 0 && (
        <span className="ml-1 inline-flex min-w-6 items-center justify-center rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white animate-pulse">
          {count}
        </span>
      )}
    </Link>
  );
}
