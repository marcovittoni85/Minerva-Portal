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

// Maps deal side values to user preference operation types
function mapSideToOperationType(side: string): string | null {
  const s = (side || "").toUpperCase();
  if (s.includes("BUY")) return "Buy-side";
  if (s.includes("SELL")) return "Sell-side";
  if (s.includes("DEBT")) return "Debt";
  if (s.includes("CLUB")) return "Club Deal";
  return null;
}

interface DealForMatching {
  id: string;
  title: string;
  sector?: string | null;
  side?: string | null;
  geography?: string | null;
}

interface UserPreferences {
  sectors?: string[];
  operation_types?: string[];
  ev_min?: number | null;
  ev_max?: number | null;
  geographies?: string[];
}

/**
 * Notify users whose deal preferences match a newly published deal.
 * Users with no preferences set receive the notification (interested in everything).
 */
export async function notifyMatchingUsers(
  supabase: SupabaseClient,
  deal: DealForMatching
) {
  // Fetch all partners/friends with their preferences
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, preferences")
    .in("role", ["partner", "friend"]);

  if (!profiles || profiles.length === 0) return;

  const dealOpType = deal.side ? mapSideToOperationType(deal.side) : null;

  const matchedIds: string[] = [];

  for (const profile of profiles) {
    const prefs = profile.preferences as UserPreferences | null;

    // No preferences set → matches everything
    if (!prefs) {
      matchedIds.push(profile.id);
      continue;
    }

    const hasSectors = prefs.sectors && prefs.sectors.length > 0;
    const hasOpTypes = prefs.operation_types && prefs.operation_types.length > 0;
    const hasGeo = prefs.geographies && prefs.geographies.length > 0;

    // If user has no preferences in any category, match all
    if (!hasSectors && !hasOpTypes && !hasGeo) {
      matchedIds.push(profile.id);
      continue;
    }

    // Check each category — user must match ALL categories they've set
    let matches = true;

    if (hasSectors && deal.sector) {
      if (!prefs.sectors!.includes(deal.sector)) matches = false;
    }

    if (hasOpTypes && dealOpType) {
      if (!prefs.operation_types!.includes(dealOpType)) matches = false;
    }

    if (hasGeo && deal.geography) {
      if (!prefs.geographies!.includes(deal.geography)) matches = false;
    }

    if (matches) {
      matchedIds.push(profile.id);
    }
  }

  if (matchedIds.length === 0) return;

  await sendNotificationBulk(supabase, {
    userIds: matchedIds,
    type: "new_deal_board",
    title: "Nuovo Deal Compatibile",
    body: `Una nuova opportunità compatibile con le tue preferenze: "${deal.title}" — ${deal.sector || "N/A"}`,
    link: `/portal/deals/${deal.id}`,
    dealTitle: deal.title,
  });
}
