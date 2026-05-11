import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import CommsTemplatesClient, { type Template } from "./CommsTemplatesClient";

export const dynamic = "force-dynamic";

export default async function CommsTemplatesPage() {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/portal");

  const { data: templates, error } = await supabaseAdmin()
    .from("comms_templates")
    .select(
      "id, slug, subject, body, channel, version, is_active, created_at, updated_at"
    )
    .order("slug", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    console.error("[comms-templates page] load error:", error);
  }

  return (
    <div className="min-h-screen bg-[#001220] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 md:px-10 md:py-12">
        <header className="mb-10">
          <h1 className="font-cormorant text-4xl md:text-5xl text-[#D4AF37] tracking-tight">
            Comms Templates
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Gestione template multi-canale
          </p>
        </header>

        <CommsTemplatesClient initialTemplates={(templates as Template[]) ?? []} />
      </div>
    </div>
  );
}
