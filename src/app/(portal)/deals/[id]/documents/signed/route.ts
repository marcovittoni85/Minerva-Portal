import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: any) {
  const supabase = await supabaseServer();
  const { id: dealId } = params;

  const form = await req.formData();
  const docId = String(form.get("doc_id") ?? "");

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // ruolo globale
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = (prof?.role ?? "").toLowerCase() === "admin";

  // accesso editor sul deal
  const { data: du } = await supabase
    .from("deal_users")
    .select("role_on_deal")
    .eq("deal_id", dealId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isEditor = (du?.role_on_deal ?? "").toLowerCase() === "editor";

  if (!isAdmin && !isEditor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // leggi metadata documento
  const { data: doc } = await supabase
    .from("deal_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("deal_id", dealId)
    .single();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // signed url
  const { data: signed, error } = await supabase.storage
    .from("deal-documents")
    .createSignedUrl(doc.storage_path, 60 * 5); // 5 minuti

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? "Signed URL error" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
