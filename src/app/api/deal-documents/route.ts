import { supabaseServer, getAuthUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

// GET — list documents for a deal
export async function GET(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("deal_id");
  if (!dealId) return NextResponse.json({ error: "deal_id mancante" }, { status: 400 });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("deal_documents")
    .select("id, deal_id, file_name, file_url, file_size, file_type, uploaded_by, is_deleted, created_at")
    .eq("deal_id", dealId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve uploader names
  const uploaderIds = [...new Set((data ?? []).map(d => d.uploaded_by).filter(Boolean))];
  let nameMap: Record<string, string> = {};
  if (uploaderIds.length > 0) {
    const { data: profiles } = await admin.from("profiles").select("id, full_name").in("id", uploaderIds);
    nameMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
  }

  const docs = (data ?? []).map(d => ({
    ...d,
    uploaded_by_name: nameMap[d.uploaded_by] || "—",
  }));

  return NextResponse.json({ documents: docs });
}

// POST — upload a new document
export async function POST(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const formData = await req.formData();
  const dealId = formData.get("deal_id") as string;
  const file = formData.get("file") as File;

  if (!dealId || !file) {
    return NextResponse.json({ error: "deal_id e file sono obbligatori" }, { status: 400 });
  }

  const filePath = `deal-docs/${dealId}/${Date.now()}_${file.name}`;
  const admin = supabaseAdmin();

  // Upload to storage
  const { error: uploadError } = await admin.storage
    .from("deal-documents")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Errore upload: " + uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("deal-documents").getPublicUrl(filePath);

  // Insert record
  const { data: doc, error: insertError } = await admin.from("deal_documents").insert({
    deal_id: dealId,
    file_name: file.name,
    file_url: publicUrl,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user.id,
  }).select("id").single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, documentId: doc.id, fileUrl: publicUrl });
}

// DELETE — soft-delete a document
export async function DELETE(req: Request) {
  const { supabase, user } = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  // Admin check
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { documentId } = body as { documentId: string };
  if (!documentId) return NextResponse.json({ error: "documentId mancante" }, { status: 400 });

  const admin = supabaseAdmin();
  const { error } = await admin.from("deal_documents").update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
  }).eq("id", documentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
