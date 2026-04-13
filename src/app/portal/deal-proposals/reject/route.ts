import { supabaseServer } from "@/lib/supabase-server";
import { sendNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const form = await req.formData();
  const dealId = String(form.get("dealId") ?? "");
  const rejectionType = String(form.get("rejectionType") ?? "rejected_not_conforming");
  const internalNote = String(form.get("internalNote") ?? "");
  const externalNote = String(form.get("externalNote") ?? "");
  const parkedMonths = parseInt(String(form.get("parkedMonths") ?? "3"), 10);

  if (!dealId) return NextResponse.json({ error: "dealId mancante" }, { status: 400 });

  const { data: deal } = await supabase
    .from("deals")
    .select("title, created_by")
    .eq("id", dealId)
    .single();

  const updateData: Record<string, any> = {
    rejection_type: rejectionType,
    rejection_note_internal: internalNote || null,
    rejection_note_external: externalNote || null,
  };

  if (rejectionType === "rejected_not_conforming") {
    updateData.status = "rejected";
    updateData.active = false;
  } else if (rejectionType === "parked") {
    updateData.status = "parked";
    updateData.active = false;
    const parkedUntil = new Date();
    parkedUntil.setMonth(parkedUntil.getMonth() + parkedMonths);
    updateData.parked_until = parkedUntil.toISOString().split("T")[0];
  } else if (rejectionType === "pending_integration") {
    updateData.status = "pending_integration";
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    updateData.integration_deadline = deadline.toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("deals")
    .update(updateData)
    .eq("id", dealId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send notification based on rejection type
  if (deal?.created_by) {
    let title = "Proposta Non Approvata";
    let body = `La tua proposta "${deal.title}" non è stata approvata.`;

    if (rejectionType === "rejected_not_conforming") {
      body = `La proposta "${deal.title}" non soddisfa i criteri di ammissione alla bacheca Minerva. Per maggiori dettagli, contatta l'admin.`;
    } else if (rejectionType === "parked") {
      title = "Proposta Parcheggiata";
      body = `La proposta "${deal.title}" è stata valutata. In questo momento non è prioritaria. Potrai ripresentarla tra ${parkedMonths} mesi.`;
    } else if (rejectionType === "pending_integration") {
      title = "Richiesta Integrazioni";
      body = `La proposta "${deal.title}" richiede integrazioni prima di poter essere valutata. Dettaglio: ${externalNote || "Contatta l'admin per maggiori dettagli."}`;
    }

    await sendNotification(supabase, {
      userId: deal.created_by,
      type: "deal_proposal_rejected",
      title,
      body,
      link: rejectionType === "pending_integration" ? `/portal/propose-deal` : "/portal/board",
      dealTitle: deal.title,
    });
  }

  return NextResponse.redirect(new URL("/portal/deal-proposals", req.url), { status: 303 });
}
