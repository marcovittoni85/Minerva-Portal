"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function Comments({ dealId }: { dealId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("deal_comments")
        .select(`id, content, created_at, profiles:user_id(full_name)`)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    }
    load();
  }, [dealId, supabase]);

  return (
    <div className="space-y-4 mt-4">
      {comments.map((c) => (
        <div key={c.id} className="p-3 bg-slate-50 rounded-lg border">
          <p className="text-xs font-bold">{c.profiles?.full_name || "Utente"}</p>
          <p className="text-sm">{c.content}</p>
        </div>
      ))}
    </div>
  );
}