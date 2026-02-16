import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const requestId = params.id;

  // 1) recupera richiesta
  const { data: request } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) {
    return NextResponse.redirect(new URL("/portal/hub/requests", req.url));
  }

  // 2) inserisci in deal_users
  // profilo richiedente
const { data: prof } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", request.requester_id)
  .single();

const r = (prof?.role ?? "").toLowerCase();

// partner/friend = editor, advisor = viewer
const roleOnDeal = r === "advisor" ? "viewer" : "editor";

await supabase.from("deal_users").insert({
  deal_id: request.deal_id,
  user_id: request.requester_id,
  role_on_deal: roleOnDeal,
});

  // 3) aggiorna stato
  await supabase
    .from("access_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  return NextResponse.redirect(new URL("/portal/hub/requests", req.url));
}
