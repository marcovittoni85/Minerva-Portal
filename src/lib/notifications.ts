import { SupabaseClient } from "@supabase/supabase-js";
import { sendNotificationEmail } from "./send-notification-email";

export type NotificationType =
  | "access_request"
  | "access_approved"
  | "access_rejected"
  | "workgroup_added"
  | "declaration_received"
  | "stage_changed"
  | "deal_proposal_approved"
  | "deal_proposal_rejected"
  | "new_deal_board";

// Maps notification types to the preference column prefix
const typeToPreferenceKey: Record<NotificationType, string> = {
  access_request: "access_request",
  access_approved: "access_approved",
  access_rejected: "access_rejected",
  workgroup_added: "workgroup_added",
  declaration_received: "declaration_received",
  stage_changed: "stage_changed",
  deal_proposal_approved: "deal_proposal_approved",
  deal_proposal_rejected: "deal_proposal_rejected",
  new_deal_board: "new_deal_board",
};

export async function sendNotification(
  supabase: SupabaseClient,
  {
    userId,
    type,
    title,
    body,
    link,
    dealTitle,
  }: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    dealTitle?: string;
  }
) {
  const prefKey = typeToPreferenceKey[type];
  const appCol = `${prefKey}_app`;
  const emailCol = `${prefKey}_email`;

  // Fetch user preferences (defaults: app=true, email=false)
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(`${appCol}, ${emailCol}`)
    .eq("user_id", userId)
    .maybeSingle();

  const prefsObj = prefs as Record<string, boolean> | null;
  const appEnabled = prefsObj?.[appCol] ?? true;
  const emailEnabled = prefsObj?.[emailCol] ?? false;

  // In-app notification
  if (appEnabled) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      link: link || null,
    });
  }

  // Email notification
  if (emailEnabled) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profile?.email) {
      await sendNotificationEmail({
        to: profile.email,
        recipientName: profile.full_name || undefined,
        title,
        body,
        link,
      });
    }
  }
}

/** Send the same notification to multiple users */
export async function sendNotificationBulk(
  supabase: SupabaseClient,
  {
    userIds,
    type,
    title,
    body,
    link,
    dealTitle,
  }: {
    userIds: string[];
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    dealTitle?: string;
  }
) {
  await Promise.all(
    userIds.map((userId) =>
      sendNotification(supabase, { userId, type, title, body, link, dealTitle })
    )
  );
}
