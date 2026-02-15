import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const form = await req.formData();

  console.log("=== RICHIESTA ACCESSO (REQUEST ROUTE) ===");
  console.log("FORM KEYS:", Array.from(form.keys()));
  console.log("dealId raw:", form.get("dealId"));
  console.log("userId raw:", form.get("userId"));

  const dealId = String(form.get("dealId") || "").trim();
  const reason = String(form.get("reason") || "").trim();

  if (!dealId || dealId === "undefined" || dealId === "null") {
    return NextResponse.json({ error: "dealId mancante" }, { status: 400 });
  }

  const { error } = await supabase.from("deal_access_requests").insert({
    deal_id: dealId,
    user_id: user.id,
    status: "pending",
    reason: reason || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath(`/portal/deals/${dealId}`);
  return NextResponse.redirect(new URL(`/portal/deals/${dealId}`, new URL(req.url).origin), { status: 303 });
}
