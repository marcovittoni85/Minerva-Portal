import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const formData = await req.formData();
  
  const requestId = formData.get("requestId");
  const dealId = formData.get("dealId");

  if (!requestId) return NextResponse.json({ error: "ID mancante" }, { status: 400 });

  // Registra il timestamp del click "Accetto"
  await supabase
    .from("deal_access_requests")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("id", requestId);

  // Rimanda l'utente alla pagina del deal (il modal ora sarà sparito)
  return NextResponse.redirect(new URL(`/portal/deals/${dealId}`, req.url), { status: 303 });
}