import {
  Building2, Factory, Zap, Landmark, FileStack, HardHat,
  ArrowRightLeft, ShoppingCart, HandCoins, TrendingUp, RefreshCw, Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Category (sector → macro) ─────────────────────────────────── */

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;   // text color
  bg: string;       // background
}

const categoryMap: Record<string, CategoryConfig> = {
  "Real estate & hospitality": { label: "Real Estate", icon: Building2, color: "text-emerald-700", bg: "bg-emerald-50" },
  "Macchinari industriali":    { label: "Corporate M&A", icon: Factory, color: "text-blue-700", bg: "bg-blue-50" },
  "Healthcare":                { label: "Corporate M&A", icon: Factory, color: "text-blue-700", bg: "bg-blue-50" },
  "Chimica":                   { label: "Corporate M&A", icon: Factory, color: "text-blue-700", bg: "bg-blue-50" },
  "Sports goods":              { label: "Corporate M&A", icon: Factory, color: "text-blue-700", bg: "bg-blue-50" },
  "Utility e rinnovabili":     { label: "Energy", icon: Zap, color: "text-amber-700", bg: "bg-amber-50" },
  "Petrolio e gas":            { label: "Energy", icon: Zap, color: "text-amber-700", bg: "bg-amber-50" },
  "Servizi finanziari":        { label: "Capital Markets", icon: Landmark, color: "text-purple-700", bg: "bg-purple-50" },
  "NPL/UTP":                   { label: "NPL / UTP", icon: FileStack, color: "text-rose-700", bg: "bg-rose-50" },
  "Infrastrutture":            { label: "Infrastructure", icon: HardHat, color: "text-cyan-700", bg: "bg-cyan-50" },
};

const defaultCategory: CategoryConfig = { label: "Corporate M&A", icon: Factory, color: "text-blue-700", bg: "bg-blue-50" };

export function getCategoryConfig(sector: string | null | undefined): CategoryConfig {
  if (!sector) return defaultCategory;
  return categoryMap[sector] ?? defaultCategory;
}

/** All distinct macro-category labels for dropdown filter */
export const CATEGORY_OPTIONS = [
  "Real Estate", "Corporate M&A", "Energy", "Capital Markets", "NPL / UTP", "Infrastructure",
] as const;

/* ─── Deal type / side → badge ───────────────────────────────────── */

export interface TypeBadgeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const typeMap: Record<string, TypeBadgeConfig> = {
  "Sell-side":       { label: "Sell-side",       icon: ArrowRightLeft, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
  "Buy-side":        { label: "Buy-side",        icon: ShoppingCart,   color: "text-[#001220]", bg: "bg-slate-100" },
  "Debt Advisory":   { label: "Debt Advisory",   icon: HandCoins,      color: "text-indigo-700", bg: "bg-indigo-50" },
  "Capital Raise":   { label: "Capital Raise",   icon: TrendingUp,     color: "text-emerald-700", bg: "bg-emerald-50" },
  "Restructuring":   { label: "Restructuring",   icon: RefreshCw,      color: "text-orange-700", bg: "bg-orange-50" },
  "Joint Venture":   { label: "Joint Venture",   icon: Handshake,      color: "text-teal-700", bg: "bg-teal-50" },
};

const defaultType: TypeBadgeConfig = { label: "Advisory", icon: ArrowRightLeft, color: "text-slate-600", bg: "bg-slate-50" };

export function getTypeBadgeConfig(dealType: string | null | undefined, side: string | null | undefined): TypeBadgeConfig {
  if (dealType && typeMap[dealType]) return typeMap[dealType];
  if (side) {
    const s = side.toLowerCase();
    if (s.includes("sell")) return typeMap["Sell-side"];
    if (s.includes("buy")) return typeMap["Buy-side"];
  }
  return defaultType;
}

/* ─── Stage badge ────────────────────────────────────────────────── */

export interface StageBadgeConfig {
  label: string;
  classes: string; // combined bg + text
}

const stageMap: Record<string, StageBadgeConfig> = {
  board:        { label: "Board",        classes: "bg-slate-100 text-slate-600" },
  in_review:    { label: "In Review",    classes: "bg-amber-50 text-amber-700" },
  under_nda:    { label: "Under NDA",    classes: "bg-blue-50 text-blue-700" },
  due_diligence:{ label: "Due Diligence",classes: "bg-purple-50 text-purple-700" },
  negotiation:  { label: "Negotiation",  classes: "bg-orange-50 text-orange-700" },
  closing:      { label: "Closing",      classes: "bg-emerald-50 text-emerald-700" },
  closed:       { label: "Closed",       classes: "bg-green-100 text-green-800" },
  dead:         { label: "Dead",         classes: "bg-red-50 text-red-600" },
};

export function getStageBadgeConfig(stage: string | null | undefined): StageBadgeConfig {
  if (!stage) return stageMap.board;
  return stageMap[stage] ?? { label: stage.replace(/_/g, " "), classes: "bg-slate-100 text-slate-600" };
}
