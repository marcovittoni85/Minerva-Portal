"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export type AccessStatus = "loading" | "none" | "pending" | "approved" | "rejected";

export function useAccessStatus(dealId: string, isAdmin: boolean): AccessStatus {
  const supabase = createClient();
  const [status, setStatus] = useState<AccessStatus>("loading");

  useEffect(() => {
    if (isAdmin) { setStatus("approved"); return; }
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: access } = await supabase
        .from("deal_access").select("id").eq("deal_id", dealId).eq("user_id", user.id).maybeSingle();
      if (access) { setStatus("approved"); return; }
      const { data: request } = await supabase
        .from("deal_access_requests").select("status").eq("deal_id", dealId).eq("user_id", user.id).maybeSingle();
      if (request) {
        setStatus(request.status === "ACCESS_APPROVED" ? "approved" : request.status as AccessStatus);
      } else {
        setStatus("none");
      }
    }
    check();
  }, [dealId, supabase, isAdmin]);

  return status;
}
