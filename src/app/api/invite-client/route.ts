import { NextResponse } from "next/server";
import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendNotification } from "@/lib/notifications";

/**
 * POST — Invite a client to the portal (Mod 9)
 * Body: { dealId, clientName, clientSurname, clientEmail, clientCompany }
 */
export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const admin = supabaseAdmin();

  // Check if user is admin or has L2 access on this deal
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  const body = await req.json();
  const { dealId, clientName, clientSurname, clientEmail, clientCompany } = body;

  if (!dealId || !clientName || !clientSurname || !clientEmail) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  if (!isAdmin) {
    // Check if user has L2 approved for this deal
    const { data: interest } = await admin
      .from("deal_interest_requests")
      .select("id")
      .eq("deal_id", dealId)
      .eq("requester_id", user.id)
      .eq("l2_status", "approved")
      .maybeSingle();

    if (!interest) {
      return NextResponse.json({ error: "Non autorizzato a invitare clienti per questo deal" }, { status: 403 });
    }
  }

  const { data: deal } = await admin.from("deals").select("id, title, originator_id").eq("id", dealId).single();
  if (!deal) return NextResponse.json({ error: "Deal non trovato" }, { status: 404 });

  // Check if client already exists by email
  let clientProfileId: string;
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", clientEmail.trim().toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    clientProfileId = existingProfile.id;
  } else {
    // Create auth user + profile with client role
    const { data: newUser, error: authError } = await admin.auth.admin.createUser({
      email: clientEmail.trim().toLowerCase(),
      email_confirm: false,
      user_metadata: { full_name: `${clientName} ${clientSurname}` },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
    clientProfileId = newUser.user.id;

    // Create profile
    await admin.from("profiles").upsert({
      id: clientProfileId,
      email: clientEmail.trim().toLowerCase(),
      full_name: `${clientName} ${clientSurname}`,
      role: "client",
    });
  }

  // Create deal_clients link
  const { error: linkError } = await admin.from("deal_clients").insert({
    deal_id: dealId,
    client_profile_id: clientProfileId,
    invited_by: user.id,
    originator_id: deal.originator_id,
  });

  if (linkError && !linkError.message.includes("duplicate")) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // Also add to CRM contacts if exists
  await admin.from("crm_contacts").upsert({
    email: clientEmail.trim().toLowerCase(),
    first_name: clientName,
    last_name: clientSurname,
    company: clientCompany || null,
    source: "portal_invite",
  }, { onConflict: "email" }).select().maybeSingle();

  // Link CRM contact to deal
  const { data: crmContact } = await admin
    .from("crm_contacts")
    .select("id")
    .eq("email", clientEmail.trim().toLowerCase())
    .maybeSingle();

  if (crmContact) {
    await admin.from("crm_contact_deals").upsert({
      contact_id: crmContact.id,
      deal_id: dealId,
    }, { onConflict: "contact_id,deal_id" });
  }

  // Audit log
  await admin.from("deal_activity_log").insert({
    deal_id: dealId,
    user_id: user.id,
    action: "client_invited",
    details: { client_name: `${clientName} ${clientSurname}`, client_email: clientEmail, client_company: clientCompany },
  });

  // Notify client (invite email)
  await sendNotification(supabase, {
    userId: clientProfileId,
    type: "client_invited",
    title: "Benvenuto su Minerva Partners",
    body: `Sei stato invitato a seguire l'avanzamento dell'operazione "${deal.title}". Accedi al portale per i dettagli.`,
    link: `/portal/my-deals`,
    dealTitle: deal.title,
  });

  return NextResponse.json({ ok: true, clientProfileId });
}
