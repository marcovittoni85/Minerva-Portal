"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function Documents({ dealId }: { dealId: string }) {
  const supabase = createClient();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function loadDocs() {
    const { data, error } = await supabase
      .from("deal_documents")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false });

    if (!error) setDocs(data ?? []);
  }

  async function uploadFile(file: File) {
    setLoading(true);

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const user = userRes?.user;

    if (userErr || !user) {
      setLoading(false);
      alert("Non autenticato");
      return;
    }

    const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
    const storagePath = `${dealId}/${crypto.randomUUID()}_${safeName}`;

    // 1) upload su storage
    const up = await supabase.storage
      .from("deal-documents")
      .upload(storagePath, file, { contentType: file.type });

    if (up.error) {
      setLoading(false);
      alert(up.error.message);
      return;
    }

    // 2) salva metadata su tabella
    const ins = await supabase.from("deal_documents").insert({
      deal_id: dealId,
      uploader_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (ins.error) {
      setLoading(false);
      alert(ins.error.message);
      return;
    }

    // 3) audit log
    await supabase.from("deal_activity").insert({
      deal_id: dealId,
      actor_id: user.id,
      action: "document_uploaded",
      meta: { file_name: file.name, size_bytes: file.size },
    });

    setLoading(false);
    loadDocs();
  }

  async function downloadDoc(docId: string) {
    const form = new FormData();
    form.append("doc_id", docId);

    const res = await fetch(`/portal/deals/${dealId}/documents/signed`, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "Errore download");
      return;
    }

    window.open(json.url, "_blank");
  }

  async function removeDoc(doc: any) {
    if (!confirm("Eliminare il documento?")) return;

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    // 1) elimina row
    const delRow = await supabase.from("deal_documents").delete().eq("id", doc.id);
    if (delRow.error) return alert(delRow.error.message);

    // 2) elimina file storage
    const delObj = await supabase.storage
      .from("deal-documents")
      .remove([doc.storage_path]);

    if (delObj.error) return alert(delObj.error.message);

    // 3) audit log
    if (user) {
      await supabase.from("deal_activity").insert({
        deal_id: dealId,
        actor_id: user.id,
        action: "document_deleted",
        meta: { file_name: doc.file_name },
      });
    }

    loadDocs();
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold">Documenti</h2>
          <div className="text-sm text-slate-500">
            Data room (solo editor/admin).
          </div>
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
              e.currentTarget.value = "";
            }}
            disabled={loading}
          />
          <span className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">
            Carica
          </span>
        </label>
      </div>

      <div className="mt-4 space-y-2">
        {docs.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between border rounded-xl px-3 py-2 text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{d.file_name}</div>
              <div className="text-xs text-slate-500">
                {new Date(d.created_at).toLocaleString("it-IT")}
                {d.size_bytes
                  ? ` • ${(d.size_bytes / 1024 / 1024).toFixed(2)} MB`
                  : ""}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="underline" onClick={() => downloadDoc(d.id)}>
                Scarica
              </button>
              <button
                className="underline text-red-700"
                onClick={() => removeDoc(d)}
              >
                Elimina
              </button>
            </div>
          </div>
        ))}

        {docs.length === 0 && (
          <div className="text-sm text-slate-500">Nessun documento.</div>
        )}
      </div>
    </div>
  );
}
