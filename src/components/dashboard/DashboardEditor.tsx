'use client';

import { useState, useEffect } from 'react';
import {
  WidgetPosition, WidgetConfig, DashboardConfig,
  WIDGET_CATALOG, WIDGET_CATEGORIES, KPI_ITEMS_CATALOG,
} from '@/types/dashboard-builder';
import {
  X, Plus, ChevronUp, ChevronDown, Settings, Save, Eye, Trash2,
  BarChart3, Briefcase, CheckSquare, Users, CircleDollarSign, Calendar, FileText,
  Flame, LayoutGrid, ListTodo, MessageSquare, Clock, Star, UserMinus,
  Coins, CalendarDays, AlertTriangle, BookOpen, Type, Bell, GitBranch,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart3, Briefcase, CheckSquare, Users, CircleDollarSign, Calendar, FileText,
  Flame, LayoutGrid, ListTodo, MessageSquare, Clock, Star, UserMinus,
  Coins, CalendarDays, AlertTriangle, BookOpen, Type, Bell, GitBranch,
};

const ROLES = ['admin', 'partner', 'advisor', 'friend'] as const;
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', partner: 'Partner', advisor: 'Advisor', friend: 'Friend',
};

export default function DashboardEditor() {
  const [configs, setConfigs] = useState<DashboardConfig[]>([]);
  const [activeRole, setActiveRole] = useState<string>('admin');
  const [layout, setLayout] = useState<WidgetPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Config modal
  const [configWidget, setConfigWidget] = useState<WidgetPosition | null>(null);

  // Preview mode
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard-config?role=all');
        const data = await res.json();
        setConfigs(data.configs || []);
        const adminConfig = (data.configs || []).find((c: DashboardConfig) => c.role === 'admin');
        if (adminConfig) setLayout(adminConfig.layout || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function switchRole(role: string) {
    setActiveRole(role);
    const config = configs.find(c => c.role === role);
    setLayout(config?.layout || []);
  }

  function addWidget(widgetKey: string) {
    const def = WIDGET_CATALOG.find(w => w.key === widgetKey);
    if (!def) return;

    const maxY = layout.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    const newWidget: WidgetPosition = {
      id: `w${Date.now()}`,
      widget: widgetKey,
      x: 0,
      y: maxY,
      w: def.defaultW,
      h: def.defaultH,
      config: { ...def.defaultConfig },
    };
    setLayout([...layout, newWidget]);
  }

  function removeWidget(id: string) {
    setLayout(layout.filter(w => w.id !== id));
  }

  function moveWidget(id: string, dir: 'up' | 'down') {
    const idx = layout.findIndex(w => w.id === id);
    if (idx === -1) return;
    const newLayout = [...layout];
    if (dir === 'up' && idx > 0) {
      [newLayout[idx], newLayout[idx - 1]] = [newLayout[idx - 1], newLayout[idx]];
      // Swap y positions
      const tempY = newLayout[idx].y;
      newLayout[idx].y = newLayout[idx - 1].y;
      newLayout[idx - 1].y = tempY;
    }
    if (dir === 'down' && idx < layout.length - 1) {
      [newLayout[idx], newLayout[idx + 1]] = [newLayout[idx + 1], newLayout[idx]];
      const tempY = newLayout[idx].y;
      newLayout[idx].y = newLayout[idx + 1].y;
      newLayout[idx + 1].y = tempY;
    }
    setLayout(newLayout);
  }

  function updateWidgetConfig(id: string, updates: Partial<WidgetConfig>) {
    setLayout(layout.map(w => w.id === id ? { ...w, config: { ...w.config, ...updates } } : w));
  }

  function updateWidgetSize(id: string, w: number) {
    setLayout(layout.map(widget => widget.id === id ? { ...widget, w: Math.min(12, Math.max(1, w)) } : widget));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch('/api/dashboard-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          name: `Dashboard ${ROLE_LABELS[activeRole]}`,
          layout,
        }),
      });
      // Update local configs
      setConfigs(prev => {
        const exists = prev.find(c => c.role === activeRole);
        if (exists) return prev.map(c => c.role === activeRole ? { ...c, layout } : c);
        return [...prev, { id: '', role: activeRole, name: '', layout, is_active: true, created_at: '', updated_at: '' }];
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group catalog by category
  const catalogByCategory: Record<string, typeof WIDGET_CATALOG> = {};
  WIDGET_CATALOG.forEach(w => {
    if (!catalogByCategory[w.category]) catalogByCategory[w.category] = [];
    catalogByCategory[w.category].push(w);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#001220]">Dashboard Builder</h1>
          <p className="text-sm text-slate-400 mt-1">Configura la dashboard per ogni ruolo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors border " + (
              preview ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-200 text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37]'
            )}
          >
            <Eye size={14} /> {preview ? 'Editor' : 'Anteprima'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-5 py-2 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva'}
          </button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden w-fit">
        {ROLES.map(role => (
          <button
            key={role}
            onClick={() => switchRole(role)}
            className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeRole === role ? 'bg-[#D4AF37] text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {preview ? (
        /* Preview mode - import DynamicDashboard inline */
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4">Anteprima — {ROLE_LABELS[activeRole]}</p>
          <div className="grid grid-cols-12 gap-4">
            {[...layout].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x).map(w => {
              const def = WIDGET_CATALOG.find(d => d.key === w.widget);
              const Icon = def ? (ICON_MAP[def.icon] || FileText) : FileText;
              return (
                <div key={w.id} style={{ gridColumn: `span ${w.w}` }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[80px]">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">{w.config.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{def?.label} · span {w.w}/12</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget list (editor area) */}
          <div className="lg:col-span-2 space-y-3">
            {layout.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-lg font-bold text-slate-400">Nessun widget</p>
                <p className="text-sm text-slate-400 mt-1">Aggiungi widget dal pannello laterale</p>
              </div>
            ) : (
              layout.map((widget, idx) => {
                const def = WIDGET_CATALOG.find(d => d.key === widget.widget);
                const Icon = def ? (ICON_MAP[def.icon] || FileText) : FileText;

                return (
                  <div key={widget.id} className="bg-white border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className="text-slate-500" />
                      </div>

                      {/* Title + info */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={widget.config.title}
                          onChange={e => updateWidgetConfig(widget.id, { title: e.target.value })}
                          className="text-sm font-bold text-slate-900 bg-transparent border-none outline-none w-full focus:bg-slate-50 rounded px-1 -ml-1 transition-colors"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{def?.label}</span>
                          <span className="text-[9px] text-slate-300">span {widget.w}/12</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveWidget(widget.id, 'up')} disabled={idx === 0}
                          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                          <ChevronUp size={14} className="text-slate-500" />
                        </button>
                        <button onClick={() => moveWidget(widget.id, 'down')} disabled={idx === layout.length - 1}
                          className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-20 transition-colors">
                          <ChevronDown size={14} className="text-slate-500" />
                        </button>
                        <button onClick={() => setConfigWidget(widget)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          <Settings size={14} className="text-slate-500" />
                        </button>
                        <button onClick={() => removeWidget(widget.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Widget catalog sidebar */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden h-fit sticky top-4">
            <div className="px-5 py-3 border-b border-slate-50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggiungi Widget</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {Object.entries(catalogByCategory).map(([catKey, widgets]) => {
                const catCfg = WIDGET_CATEGORIES[catKey];
                const CatIcon = ICON_MAP[catCfg?.icon || 'FileText'] || FileText;
                return (
                  <div key={catKey}>
                    <div className="px-4 py-2 bg-slate-50 flex items-center gap-2">
                      <CatIcon size={12} className="text-slate-400" />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{catCfg?.label || catKey}</span>
                    </div>
                    {widgets.map(w => {
                      const available = w.availableFor.includes(activeRole);
                      const WIcon = ICON_MAP[w.icon] || FileText;
                      const alreadyAdded = layout.some(l => l.widget === w.key);
                      return (
                        <button
                          key={w.key}
                          onClick={() => available && addWidget(w.key)}
                          disabled={!available}
                          className={"w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-b border-slate-50 " + (
                            !available ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
                          )}
                        >
                          <WIcon size={14} className="text-slate-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700">{w.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{w.description}</p>
                          </div>
                          {alreadyAdded ? (
                            <span className="text-[8px] font-bold text-slate-400">AGGIUNTO</span>
                          ) : available ? (
                            <Plus size={14} className="text-[#D4AF37] flex-shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {configWidget && (() => {
        const def = WIDGET_CATALOG.find(d => d.key === configWidget.widget);
        const isKpi = configWidget.widget === 'kpi_strip';
        const isWelcome = configWidget.widget === 'welcome_text';

        return (
          <>
            <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setConfigWidget(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Configura Widget</h3>
                  <button onClick={() => setConfigWidget(null)} className="p-2 rounded-lg hover:bg-slate-100">
                    <X size={14} className="text-slate-500" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Titolo</label>
                    <input
                      type="text"
                      value={configWidget.config.title}
                      onChange={e => {
                        const updated = { ...configWidget, config: { ...configWidget.config, title: e.target.value } };
                        setConfigWidget(updated);
                        updateWidgetConfig(configWidget.id, { title: e.target.value });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  {/* Width */}
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">
                      Larghezza ({configWidget.w}/12 colonne)
                    </label>
                    <input
                      type="range"
                      min={def?.minW || 1}
                      max={def?.maxW || 12}
                      value={configWidget.w}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setConfigWidget({ ...configWidget, w: val });
                        updateWidgetSize(configWidget.id, val);
                      }}
                      className="w-full accent-[#D4AF37]"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>{def?.minW || 1}</span>
                      <span>{def?.maxW || 12}</span>
                    </div>
                  </div>

                  {/* Limit */}
                  {configWidget.config.limit !== undefined && (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Max Items</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={configWidget.config.limit || 5}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 5;
                          setConfigWidget({ ...configWidget, config: { ...configWidget.config, limit: val } });
                          updateWidgetConfig(configWidget.id, { limit: val });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors"
                      />
                    </div>
                  )}

                  {/* KPI items selector */}
                  {isKpi && (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">KPI da mostrare</label>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {Object.entries(KPI_ITEMS_CATALOG).map(([key, kpi]) => {
                          const available = kpi.availableFor.includes(activeRole);
                          const selected = (configWidget.config.items || []).includes(key);
                          return (
                            <label
                              key={key}
                              className={"flex items-center gap-3 px-3 py-2 rounded-lg transition-colors " + (
                                !available ? 'opacity-30' : selected ? 'bg-[#D4AF37]/5' : 'hover:bg-slate-50'
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                disabled={!available}
                                onChange={() => {
                                  const items = configWidget.config.items || [];
                                  const newItems = selected ? items.filter((i: string) => i !== key) : [...items, key];
                                  setConfigWidget({ ...configWidget, config: { ...configWidget.config, items: newItems } });
                                  updateWidgetConfig(configWidget.id, { items: newItems });
                                }}
                                className="accent-[#D4AF37]"
                              />
                              <span className="text-xs font-medium text-slate-700">{kpi.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Welcome text content */}
                  {isWelcome && (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Contenuto</label>
                      <textarea
                        value={configWidget.config.content || ''}
                        onChange={e => {
                          setConfigWidget({ ...configWidget, config: { ...configWidget.config, content: e.target.value } });
                          updateWidgetConfig(configWidget.id, { content: e.target.value });
                        }}
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setConfigWidget(null)}
                    className="bg-[#D4AF37] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
