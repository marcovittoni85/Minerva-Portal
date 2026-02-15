"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function createDeal(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const sector = String(formData.get("sector") ?? "").trim() || null;
  const geography = String(formData.get("geography") ?? "").trim() || null;
  const confidentiality = String(formData.get("confidentiality") ?? "blind");
  const status = String(formData.get("status") ?? "active");

  if (!title) throw new Error("Titolo obbligatorio");

  const supabase = await supabaseServer();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { error } = await supabase.from("deals").insert({
    code,
    title,
    sector,
    geography,
    confidentiality,
    status,
    created_by: user?.id ?? null,
  });

  if (error) throw new Error(error.message);

  redirect("/portal/deals");
}
