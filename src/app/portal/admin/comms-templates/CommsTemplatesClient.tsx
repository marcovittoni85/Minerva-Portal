"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { extractMergeTags } from "@/lib/comms/template-engine";
import {
  inputClass,
  textareaClass,
  selectClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export type TemplateChannel = "email" | "whatsapp" | "pec" | "in_app";

export interface Template {
  id: string;
  slug: string;
  subject: string | null;
  body: string;
  channel: TemplateChannel;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type ChannelFilter = "all" | TemplateChannel;

interface SlugGroup {
  slug: string;
  versions: Template[];
  active: Template;
}

const CHANNELS: TemplateChannel[] = ["email", "whatsapp", "pec", "in_app"];

const CHANNEL_LABEL: Record<TemplateChannel, string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  pec: "PEC",
  in_app: "In-app",
};

function groupBySlug(templates: Template[]): SlugGroup[] {
  const map = new Map<string, Template[]>();
  for (const t of templates) {
    const arr = map.get(t.slug) ?? [];
    arr.push(t);
    map.set(t.slug, arr);
  }
  const groups: SlugGroup[] = [];
  for (const [slug, versions] of map) {
    const sorted = [...versions].sort((a, b) => b.version - a.version);
    const active = sorted.find((v) => v.is_active) ?? sorted[0];
    groups.push({ slug, versions: sorted, active });
  }
  groups.sort((a, b) => a.slug.localeCompare(b.slug));
  return groups;
}

export default function CommsTemplatesClient({
  initialTemplates,
}: {
  initialTemplates: Template[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<{
    subject: string;
    body: string;
    channel: TemplateChannel;
  }>({ subject: "", body: "", channel: "email" });

  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  const groups = useMemo(() => groupBySlug(initialTemplates), [initialTemplates]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (channelFilter !== "all" && g.active.channel !== channelFilter) return false;
      if (q && !g.slug.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [groups, search, channelFilter]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.slug === selectedSlug) ?? null,
    [groups, selectedSlug]
  );

  // Deselect if filtered out
  useEffect(() => {
    if (!selectedSlug) return;
    if (!filteredGroups.find((g) => g.slug === selectedSlug)) {
      setSelectedSlug(null);
    }
  }, [filteredGroups, selectedSlug]);

  // Load editForm when selection changes
  useEffect(() => {
    if (!selectedGroup) return;
    setEditForm({
      subject: selectedGroup.active.subject ?? "",
      body: selectedGroup.active.body,
      channel: selectedGroup.active.channel,
    });
    setTestVariables({});
    setFeedback(null);
  }, [selectedGroup?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const mergeTags = useMemo(
    () => extractMergeTags(`${editForm.subject}\n${editForm.body}`),
    [editForm.subject, editForm.body]
  );

  const toggleHistory = (slug: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleTestSend = async () => {
    if (!selectedGroup) return;
    setTesting(true);
    setFeedback(null);
    try {
      // Coerce empty values to placeholders so missing inputs are still readable
      const variables: Record<string, string> = {};
      for (const tag of mergeTags) {
        variables[tag] = testVariables[tag] ?? "";
      }
      const res = await fetch("/api/comms-templates/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: selectedGroup.slug, variables }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({
          kind: "error",
          message: json.error || `Errore (${res.status})`,
        });
      } else if (json.recipient) {
        setFeedback({
          kind: "success",
          message: `Email di test inviata a ${json.recipient}`,
        });
      } else {
        setFeedback({
          kind: "success",
          message: json.message || "Test eseguito",
        });
      }
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Errore di rete",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedGroup) return;
    if (editForm.channel !== "in_app" && !editForm.subject.trim()) {
      setFeedback({ kind: "error", message: "Subject obbligatorio per questo canale" });
      return;
    }
    if (!editForm.body.trim()) {
      setFeedback({ kind: "error", message: "Body obbligatorio" });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/comms-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedGroup.slug,
          subject: editForm.subject || null,
          body: editForm.body,
          channel: editForm.channel,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFeedback({
          kind: "error",
          message: json.error || `Errore (${res.status})`,
        });
      } else {
        setFeedback({
          kind: "success",
          message: `Versione ${json.template?.version ?? ""} salvata`,
        });
        router.refresh();
      }
    } catch (err) {
      setFeedback({
        kind: "error",
        message: err instanceof Error ? err.message : "Errore di rete",
      });
    } finally {
      setSaving(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a1a30] p-10 text-center text-slate-300">
        Nessun template trovato
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-6">
      {/* LEFT — list */}
      <aside className="space-y-4">
        <input
          type="text"
          placeholder="Cerca slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />

        <div className="flex flex-wrap gap-2">
          {(["all", ...CHANNELS] as ChannelFilter[]).map((c) => {
            const active = channelFilter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setChannelFilter(c)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                  active
                    ? "bg-[#D4AF37] text-[#001220] border-[#D4AF37]"
                    : "bg-[#0a1a30] text-slate-300 border-[#D4AF37]/20 hover:border-[#D4AF37]/50"
                )}
              >
                {c === "all" ? "Tutti" : CHANNEL_LABEL[c]}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {filteredGroups.length === 0 && (
            <div className="text-sm text-slate-400 py-6 text-center">
              Nessun template trovato
            </div>
          )}
          {filteredGroups.map((g) => {
            const isSelected = selectedSlug === g.slug;
            const expanded = expandedHistory.has(g.slug);
            return (
              <div
                key={g.slug}
                className={cn(
                  "rounded-lg bg-[#0a1a30] border transition-all",
                  isSelected
                    ? "border-[#D4AF37]"
                    : "border-[#D4AF37]/20 hover:border-[#D4AF37]/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => setSelectedSlug(g.slug)}
                  className="w-full text-left px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-white truncate">
                      {g.slug}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {CHANNEL_LABEL[g.active.channel]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>v{g.active.version}</span>
                    <span>·</span>
                    <span>
                      {g.versions.length} version{g.versions.length === 1 ? "e" : "i"}
                    </span>
                  </div>
                </button>
                {g.versions.length > 1 && (
                  <div className="px-4 pb-3 -mt-1">
                    <button
                      type="button"
                      onClick={() => toggleHistory(g.slug)}
                      className="text-[11px] text-[#D4AF37]/80 hover:text-[#D4AF37]"
                    >
                      {expanded ? "Nascondi" : "Vedi"} storia ({g.versions.length} versioni)
                    </button>
                    {expanded && (
                      <ul className="mt-2 space-y-1">
                        {g.versions.map((v) => (
                          <li
                            key={v.id}
                            className={cn(
                              "text-xs px-2 py-1 rounded flex items-center justify-between gap-2",
                              v.is_active
                                ? "text-slate-200"
                                : "text-slate-500 opacity-70"
                            )}
                          >
                            <span>
                              v{v.version} ·{" "}
                              {new Date(v.updated_at).toLocaleDateString("it-IT")}
                            </span>
                            {v.is_active ? (
                              <span className="text-[9px] uppercase tracking-wider text-[#D4AF37]">
                                attiva
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-slate-700/40 px-1.5 py-0.5 rounded">
                                archiviata
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT — editor */}
      <section>
        {!selectedGroup ? (
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a1a30] p-10 text-center text-slate-400 text-sm">
            Seleziona un template dalla lista per modificarlo
          </div>
        ) : (
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a1a30] p-6 md:p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-cormorant text-2xl text-white">
                {selectedGroup.slug}
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full">
                v{selectedGroup.active.version} attiva
              </span>
            </div>

            <div className="bg-white rounded-lg p-5 space-y-4">
              <div>
                <label className={labelClass}>Canale</label>
                <select
                  value={editForm.channel}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      channel: e.target.value as TemplateChannel,
                    }))
                  }
                  className={selectClass}
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {CHANNEL_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Subject{" "}
                  {editForm.channel !== "in_app" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={editForm.subject}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  className={inputClass}
                  placeholder={
                    editForm.channel === "in_app"
                      ? "Opzionale per in-app"
                      : "Oggetto del messaggio"
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Body</label>
                <textarea
                  value={editForm.body}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, body: e.target.value }))
                  }
                  className={cn(textareaClass, "h-64 font-mono text-xs")}
                  placeholder="Usa {{variabile}} per i merge tag"
                />
              </div>

              {mergeTags.length > 0 && (
                <div>
                  <div className={labelClass}>Merge tag rilevati</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mergeTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                      >
                        {`{{${tag}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Test send block */}
            <div className="rounded-lg border border-[#D4AF37]/20 bg-[#001220]/60 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">
                  Test send
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anteprima inviata a marvittoni@gmail.com (solo email in v1)
                </p>
              </div>

              {mergeTags.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mergeTags.map((tag) => (
                    <div key={tag}>
                      <label className="block text-xs text-slate-300 mb-1">
                        {`{{${tag}}}`}
                      </label>
                      <input
                        type="text"
                        value={testVariables[tag] ?? ""}
                        onChange={(e) =>
                          setTestVariables((v) => ({
                            ...v,
                            [tag]: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder={`Valore di test per ${tag}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleTestSend}
                disabled={testing}
                className={buttonSecondary}
              >
                {testing ? "Invio..." : "Test send a marvittoni@gmail.com"}
              </button>
            </div>

            {feedback && (
              <div
                className={cn(
                  "rounded-lg px-4 py-3 text-sm",
                  feedback.kind === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/10 text-red-300 border border-red-500/30"
                )}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-[#D4AF37]/10">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={buttonPrimary}
              >
                {saving ? "Salvataggio..." : "Salva nuova versione"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
