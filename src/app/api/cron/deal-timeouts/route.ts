import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";
import { createClient } from "@supabase/supabase-js";

/**
 * Cron job: handles all deal-related timeouts.
 * Should be called periodically (e.g., every hour via Vercel Cron or external scheduler).
 *
 * 1. L1→L2 timeout: reminder at day 7, revoke at day 10 (14 calendar days)
 * 2. Negotiation 5-day expiry: move deal to "assigned"
 * 3. Integration deadline: reminder at 25 days, archive at 30 days
 * 4. Parked deal reminders: notify originator when parked_until is reached
 * 5. Post-5-day originator 72h timeout
 */
export async function GET(req: Request) {
  // Verify cron secret if set
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date();
  const results: string[] = [];

  // ─── 1. L1 Expiry (reminder + revoke) ──────────────────────
  {
    // Reminder: L1 approved, not reminded, expires in <= 3 days
    const reminderCutoff = new Date(now);
    reminderCutoff.setDate(reminderCutoff.getDate() + 3);

    const { data: needsReminder } = await admin
      .from("deal_interest_requests")
      .select("id, requester_id, deal_id, l1_expires_at, deals!inner(title)")
      .eq("l1_status", "approved")
      .eq("l2_status", "not_requested")
      .eq("l1_reminder_sent", false)
      .lte("l1_expires_at", reminderCutoff.toISOString())
      .gt("l1_expires_at", now.toISOString());

    for (const r of needsReminder ?? []) {
      const deal = r.deals as any;
      await sendNotification(admin as any, {
        userId: r.requester_id,
        type: "l1_reminder",
        title: "Reminder: Autorizzazione L1 in scadenza",
        body: `Hai 3 giorni per procedere con la richiesta L2 per "${deal.title}". Dopo la scadenza, l'accesso L1 decade.`,
        link: `/portal/deals/${r.deal_id}/l2-request`,
        dealTitle: deal.title,
      });
      await admin.from("deal_interest_requests").update({ l1_reminder_sent: true }).eq("id", r.id);
      results.push(`L1 reminder sent: ${r.id}`);
    }

    // Revoke: L1 approved, expired, L2 not started
    const { data: expired } = await admin
      .from("deal_interest_requests")
      .select("id, requester_id, deal_id, deals!inner(title)")
      .eq("l1_status", "approved")
      .eq("l2_status", "not_requested")
      .lte("l1_expires_at", now.toISOString());

    for (const r of expired ?? []) {
      const deal = r.deals as any;
      await admin.from("deal_interest_requests").update({ l1_status: "declined", l1_decline_reason: "Scaduto — nessuna richiesta L2 entro il termine" }).eq("id", r.id);
      await sendNotification(admin as any, {
        userId: r.requester_id,
        type: "l1_expired",
        title: "Autorizzazione L1 Scaduta",
        body: `L'autorizzazione L1 per "${deal.title}" è scaduta. Puoi ripresentare una nuova richiesta.`,
        link: `/portal/deals/${r.deal_id}`,
        dealTitle: deal.title,
      });
      await admin.from("deal_activity_log").insert({
        deal_id: r.deal_id,
        user_id: r.requester_id,
        action: "l1_expired",
        details: { request_id: r.id },
      });
      results.push(`L1 expired: ${r.id}`);
    }
  }

  // ─── 2. Negotiation 5-day expiry ──────────────────────────
  {
    const { data: expiredNegotiations } = await admin
      .from("deals")
      .select("id, title, originator_id")
      .eq("board_status", "in_negotiation")
      .lte("negotiation_expires_at", now.toISOString());

    for (const deal of expiredNegotiations ?? []) {
      await admin.from("deals").update({
        board_status: "assigned",
      }).eq("id", deal.id);

      await admin.from("deal_activity_log").insert({
        deal_id: deal.id,
        user_id: deal.originator_id,
        action: "deal_assigned_auto",
        details: { reason: "5-day negotiation period expired" },
      });

      await sendNotification(admin as any, {
        userId: deal.originator_id,
        type: "deal_assigned",
        title: "Deal Assegnato",
        body: `"${deal.title}" è passato allo stato "Assegnato" dopo il periodo di trattativa.`,
        link: `/portal/deals/${deal.id}`,
        dealTitle: deal.title,
      });
      results.push(`Negotiation expired, deal assigned: ${deal.id}`);
    }
  }

  // ─── 3. Integration deadline (25-day reminder + 30-day archive) ─
  {
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + 5); // 25 days = deadline - 5

    // 25-day reminder
    const { data: needsIntegrationReminder } = await admin
      .from("deals")
      .select("id, title, created_by, integration_deadline")
      .eq("status", "pending_integration")
      .lte("integration_deadline", reminderDate.toISOString().split("T")[0])
      .gt("integration_deadline", now.toISOString().split("T")[0]);

    for (const deal of needsIntegrationReminder ?? []) {
      if (deal.created_by) {
        await sendNotification(admin as any, {
          userId: deal.created_by,
          type: "deal_integration_reminder",
          title: "Reminder: Integrazioni in scadenza",
          body: `La proposta "${deal.title}" scade il ${deal.integration_deadline}. Completa le integrazioni richieste.`,
          link: "/portal/propose-deal",
          dealTitle: deal.title,
        });
      }
      // Also notify admins
      const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
      for (const a of admins ?? []) {
        await sendNotification(admin as any, {
          userId: a.id,
          type: "deal_integration_reminder",
          title: "Deal senza integrazioni da 25 giorni",
          body: `"${deal.title}" non ha ricevuto integrazioni. Scadenza: ${deal.integration_deadline}.`,
          link: "/portal/deal-proposals",
          dealTitle: deal.title,
        });
      }
      results.push(`Integration reminder: ${deal.id}`);
    }

    // 30-day archive
    const { data: expiredIntegrations } = await admin
      .from("deals")
      .select("id, title, created_by")
      .eq("status", "pending_integration")
      .lte("integration_deadline", now.toISOString().split("T")[0]);

    for (const deal of expiredIntegrations ?? []) {
      await admin.from("deals").update({
        status: "rejected",
        active: false,
        rejection_type: "integration_expired",
      }).eq("id", deal.id);

      if (deal.created_by) {
        await sendNotification(admin as any, {
          userId: deal.created_by,
          type: "deal_proposal_rejected",
          title: "Proposta Archiviata",
          body: `La proposta "${deal.title}" è stata archiviata per mancate integrazioni entro 30 giorni.`,
          link: "/portal/propose-deal",
          dealTitle: deal.title,
        });
      }
      results.push(`Integration expired, archived: ${deal.id}`);
    }
  }

  // ─── 4. Parked deal reminders ──────────────────────────────
  {
    const { data: parkedReady } = await admin
      .from("deals")
      .select("id, title, created_by, parked_until")
      .eq("status", "parked")
      .lte("parked_until", now.toISOString().split("T")[0]);

    for (const deal of parkedReady ?? []) {
      if (deal.created_by) {
        await sendNotification(admin as any, {
          userId: deal.created_by,
          type: "deal_parked_reminder",
          title: "Proposta Ripresentabile",
          body: `Il periodo di attesa per "${deal.title}" è terminato. Puoi ripresentare la proposta.`,
          link: "/portal/propose-deal",
          dealTitle: deal.title,
        });
      }
      // Update status so we don't notify again
      await admin.from("deals").update({ status: "parked_notified" }).eq("id", deal.id);
      results.push(`Parked reminder: ${deal.id}`);
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, details: results });
}
