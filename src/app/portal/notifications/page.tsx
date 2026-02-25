"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Key,
  Briefcase,
  FileText,
  Users,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Megaphone,
  Bell,
  Trash2,
  Loader2,
} from "lucide-react";

const PAGE_SIZE = 20;

const typeConfig: Record<string, { icon: typeof Bell; label: string; filter: string }> = {
  access_request: { icon: Key, label: "Richiesta accesso", filter: "accesso" },
  access_approved: { icon: CheckCircle, label: "Accesso approvato", filter: "accesso" },
  access_rejected: { icon: XCircle, label: "Accesso rifiutato", filter: "accesso" },
  workgroup_added: { icon: Users, label: "Gruppo di lavoro", filter: "deal" },
  declaration_received: { icon: FileText, label: "Dichiarazione", filter: "dichiarazioni" },
  step_changed: { icon: FileText, label: "Dichiarazione", filter: "dichiarazioni" },
  stage_changed: { icon: ArrowRightLeft, label: "Cambio stage", filter: "deal" },
  deal_proposal_approved: { icon: CheckCircle, label: "Proposta approvata", filter: "deal" },
  deal_proposal_rejected: { icon: XCircle, label: "Proposta rifiutata", filter: "deal" },
  new_deal_board: { icon: Megaphone, label: "Nuovo deal", filter: "deal" },
};

const tabs = [
  { key: "tutte", label: "Tutte" },
  { key: "non_lette", label: "Non Lette" },
  { key: "accesso", label: "Accesso" },
  { key: "deal", label: "Deal" },
  { key: "dichiarazioni", label: "Dichiarazioni" },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Adesso";
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} giorni fa`;
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tutte");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadNotifications = useCallback(async (offset = 0, append = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE);

    if (!error && data) {
      setNotifs(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length > PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [supabase]);

  useEffect(() => {
    loadNotifications();
    // Mark all as read
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
      }
    })();
  }, [loadNotifications]);

  const loadMore = async () => {
    setLoadingMore(true);
    await loadNotifications(notifs.length, true);
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const deleteAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);
    setNotifs(prev => prev.filter(n => !n.is_read));
  };

  // Filter notifications based on active tab
  const filtered = notifs.filter(n => {
    if (activeTab === "tutte") return true;
    if (activeTab === "non_lette") return !n.is_read;
    const config = typeConfig[n.type];
    return config?.filter === activeTab;
  });

  const readCount = notifs.filter(n => n.is_read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-8 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifiche</h1>
            <p className="text-slate-500 text-sm mt-2">Aggiornamenti e richieste</p>
          </div>
          {readCount > 0 && (
            <button
              onClick={deleteAllRead}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Elimina lette
            </button>
          )}
        </div>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[#D4AF37] text-white"
                : "bg-slate-50 text-slate-500 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nessuna notifica{activeTab !== "tutte" ? " in questa categoria" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const config = typeConfig[n.type] || { icon: Bell, label: n.type };
            const Icon = config.icon;
            return (
              <div
                key={n.id}
                className={`group bg-white border rounded-2xl p-4 transition-colors hover:shadow-sm ${
                  !n.is_read ? "border-l-[4px] border-l-[#D4AF37] border-t-slate-100 border-r-slate-100 border-b-slate-100" : "border-slate-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.is_read ? "bg-[#D4AF37]/10" : "bg-slate-50"}`}>
                    <Icon className={`w-4 h-4 ${!n.is_read ? "text-[#D4AF37]" : "text-slate-400"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">{config.label}</span>
                      <span className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.link ? (
                      <a href={n.link} className="text-sm font-bold text-slate-900 hover:text-[#D4AF37] transition-colors">
                        {n.title}
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    )}
                    {n.body && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.body}</p>}
                  </div>

                  <button
                    onClick={() => deleteNotif(n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Carica altre"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
