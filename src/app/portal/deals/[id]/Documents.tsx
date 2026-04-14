"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  Trash2,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

const CATEGORIES = [
  { value: "nda", label: "NDA" },
  { value: "teaser", label: "Teaser" },
  { value: "info_memo", label: "Info Memo" },
  { value: "financial_model", label: "Financial Model" },
  { value: "legale", label: "Legale" },
  { value: "other", label: "Altro" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];

export interface DocRow {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  category: Category;
  created_at: string;
  uploader_id: string;
  uploader_name?: string;
}

function fileIcon(mime: string) {
  if (mime?.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
  if (mime === "application/pdf") return <FileText className="w-4 h-4 text-red-500" />;
  if (mime?.includes("spreadsheet") || mime?.includes("excel") || mime?.includes("csv"))
    return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function Documents({
  dealId,
  dealTitle,
  userId,
  isAdmin,
  initialDocs,
}: {
  dealId: string;
  dealTitle: string;
  userId: string;
  isAdmin: boolean;
  initialDocs: DocRow[];
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocRow[]>(initialDocs);
  const [category, setCategory] = useState<Category>("other");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filteredDocs = filterCat === "all" ? docs : docs.filter((d) => d.category === filterCat);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      setUploadProgress(0);

      const { data: { session } } = await supabase.auth.getSession(); const userRes = { user: session?.user };
      const user = userRes?.user;
      if (!user) {
        setUploading(false);
        return;
      }

      const totalFiles = files.length;
      const newDocs: DocRow[] = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        setUploadProgress(Math.round(((i) / totalFiles) * 100));

        const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
        const storagePath = `${dealId}/${crypto.randomUUID()}_${safeName}`;

        const { error: upErr } = await supabase.storage
          .from("deal-documents")
          .upload(storagePath, file, { contentType: file.type });

        if (upErr) continue;

        const { data: inserted, error: insErr } = await supabase
          .from("deal_documents")
          .insert({
            deal_id: dealId,
            uploader_id: user.id,
            file_name: file.name,
            storage_path: storagePath,
            mime_type: file.type,
            size_bytes: file.size,
            category,
          })
          .select()
          .single();

        if (!insErr && inserted) {
          newDocs.push({ ...inserted, uploader_name: "Tu" });
        }

        // Activity log (fire-and-forget)
        supabase.from("deal_activity_log").insert({
          deal_id: dealId,
          user_id: user.id,
          action: "document_uploaded",
          details: { deal_title: dealTitle, file_name: file.name },
        });

        // Notification (fire-and-forget)
        fetch("/api/notifications/document-uploaded", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, dealTitle, userId: user.id, fileName: file.name }),
        }).catch(() => {});
      }

      setUploadProgress(100);
      if (newDocs.length > 0) {
        setDocs((prev) => [...newDocs, ...prev]);
      }

      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 600);
    },
    [supabase, dealId, dealTitle, category]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    },
    [uploadFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    uploadFiles(files);
    e.currentTarget.value = "";
  };

  const openPreview = async (doc: DocRow) => {
    const canPreview =
      doc.mime_type === "application/pdf" || doc.mime_type?.startsWith("image/");
    if (!canPreview) return;

    const form = new FormData();
    form.append("doc_id", doc.id);

    const res = await fetch(`/portal/deals/${dealId}/documents/signed`, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    if (res.ok && json.url) {
      setPreviewDoc(doc);
      setPreviewUrl(json.url);
    }
  };

  const downloadDoc = async (doc: DocRow) => {
    const form = new FormData();
    form.append("doc_id", doc.id);

    const res = await fetch(`/portal/deals/${dealId}/documents/signed`, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    if (res.ok && json.url) {
      window.open(json.url, "_blank");
    }
  };

  const deleteDoc = async (doc: DocRow) => {
    if (!confirm("Eliminare il documento?")) return;

    const { error: delErr } = await supabase.from("deal_documents").delete().eq("id", doc.id);
    if (delErr) return;

    await supabase.storage.from("deal-documents").remove([doc.storage_path]);

    supabase.from("deal_activity_log").insert({
      deal_id: dealId,
      user_id: userId,
      action: "document_deleted",
      details: { deal_title: dealTitle, file_name: doc.file_name },
    });

    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
  };

  const canDelete = (doc: DocRow) => isAdmin || doc.uploader_id === userId;

  return (
    <div className="flex flex-col h-full">
      {/* Upload area */}
      <div className="p-5 border-b border-slate-100 space-y-3">
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">
            Categoria upload
          </span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors " +
            (dragging
              ? "border-[#D4AF37] bg-[#D4AF37]/5"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50")
          }
        >
          <Upload className={"w-5 h-5 " + (dragging ? "text-[#D4AF37]" : "text-slate-400")} />
          <p className="text-xs text-slate-500">
            {dragging ? "Rilascia per caricare" : "Trascina i file qui o clicca per selezionare"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {uploading && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
              <span>Caricamento in corso… {uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category filter pills */}
      <div className="px-5 pt-4 pb-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterCat("all")}
          className={
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors " +
            (filterCat === "all"
              ? "bg-[#D4AF37] text-white"
              : "bg-slate-50 text-slate-500 hover:bg-slate-100")
          }
        >
          Tutti ({docs.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = docs.filter((d) => d.category === c.value).length;
          return (
            <button
              key={c.value}
              onClick={() => setFilterCat(c.value)}
              className={
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors " +
                (filterCat === c.value
                  ? "bg-[#D4AF37] text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100")
              }
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        {filteredDocs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-12">Nessun documento.</p>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 group"
            >
              {fileIcon(doc.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.file_name}</p>
                <p className="text-[10px] text-slate-400">
                  {doc.uploader_name || "Utente"} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {doc.size_bytes ? ` · ${formatSize(doc.size_bytes)}` : ""}
                </p>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold hidden sm:block">
                {CATEGORIES.find((c) => c.value === doc.category)?.label || doc.category}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(doc.mime_type === "application/pdf" || doc.mime_type?.startsWith("image/")) && (
                  <button
                    onClick={() => openPreview(doc)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Anteprima"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
                <button
                  onClick={() => downloadDoc(doc)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Scarica"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                </button>
                {canDelete(doc) && (
                  <button
                    onClick={() => deleteDoc(doc)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview modal */}
      {previewDoc && previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                {fileIcon(previewDoc.mime_type)}
                <p className="text-sm font-bold text-slate-900 truncate">{previewDoc.file_name}</p>
              </div>
              <button
                onClick={() => {
                  setPreviewDoc(null);
                  setPreviewUrl(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewDoc.mime_type === "application/pdf" ? (
                <iframe src={previewUrl} className="w-full h-full min-h-[60vh]" />
              ) : (
                <div className="flex items-center justify-center p-8 h-full">
                  <img
                    src={previewUrl}
                    alt={previewDoc.file_name}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
