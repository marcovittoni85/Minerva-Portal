import { supabaseServer } from "@/lib/supabase-server";
import { sendNotificationBulk } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { dealId, dealTitle, dealCode, hasConflict } = await req.json();

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  // Notify all admins
  const { data: admins } = await supabase.from("profiles").select("id").in("role", ["admin"]);
  const adminIds = (admins ?? []).map((a) => a.id);

  if (adminIds.length > 0) {
    await sendNotificationBulk(supabase, {
      userIds: adminIds,
      type: "declaration_received",
      title: "Dichiarazione Ricevuta",
      body: `Nuova dichiarazione per "${dealTitle}" (${dealCode})${hasConflict ? " — CONFLITTO SEGNALATO" : ""}`,
      link: `/portal/deal-manage/${dealId}`,
      dealTitle,
    });
  }

  return NextResponse.json({ ok: true });
}
