import {
  Building2, Briefcase, Zap, TrendingUp, ShieldAlert, Landmark,
  ArrowUpRight, ArrowDownLeft, DollarSign, Repeat, Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Category (sector → macro) ─────────────────────────────────── */

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;      // text color for icon
  bg: string;          // background for icon circle
  borderColor: string; // left bar color (hex)
}

const categoryMap: Record<string, CategoryConfig> = {
  "Real estate & hospitality": { label: "Real Estate",     icon: Building2,   color: "text-blue-600",    bg: "bg-blue-50",    borderColor: "#3B82F6" },
  "Macchinari industriali":    { label: "Corporate M&A",   icon: Briefcase,   color: "text-violet-600",  bg: "bg-violet-50",  borderColor: "#8B5CF6" },
  "Healthcare":                { label: "Corporate M&A",   icon: Briefcase,   color: "text-violet-600",  bg: "bg-violet-50",  borderColor: "#8B5CF6" },
  "Chimica":                   { label: "Corporate M&A",   icon: Briefcase,   color: "text-violet-600",  bg: "bg-violet-50",  borderColor: "#8B5CF6" },
  "Sports goods":              { label: "Corporate M&A",   icon: Briefcase,   color: "text-violet-600",  bg: "bg-violet-50",  borderColor: "#8B5CF6" },
  "Utility e rinnovabili":     { label: "Energy",          icon: Zap,         color: "text-amber-600",   bg: "bg-amber-50",   borderColor: "#F59E0B" },
  "Petrolio e gas":            { label: "Energy",          icon: Zap,         color: "text-amber-600",   bg: "bg-amber-50",   borderColor: "#F59E0B" },
  "Servizi finanziari":        { label: "Capital Markets", icon: TrendingUp,  color: "text-emerald-600", bg: "bg-emerald-50", borderColor: "#10B981" },
  "NPL/UTP":                   { label: "NPL / UTP",      icon: ShieldAlert, color: "text-red-500",     bg: "bg-red-50",     borderColor: "#EF4444" },
  "Infrastrutture":            { label: "Infrastructure",  icon: Landmark,    color: "text-cyan-600",    bg: "bg-cyan-50",    borderColor: "#06B6D4" },
};

const defaultCategory: CategoryConfig = { label: "Corporate M&A", icon: Briefcase, color: "text-violet-600", bg: "bg-violet-50", borderColor: "#8B5CF6" };

export function getCategoryConfig(sector: string | null | undefined): CategoryConfig {
  if (!sector) return defaultCategory;
  return categoryMap[sector] ?? defaultCategory;
}

/** All distinct macro-category labels for filter pills */
export const CATEGORY_OPTIONS: { label: string; icon: LucideIcon; color: string; bg: string; activeRing: string }[] = [
  { label: "Real Estate",     icon: Building2,   color: "text-blue-600",    bg: "bg-blue-50",    activeRing: "ring-blue-300" },
  { label: "Corporate M&A",   icon: Briefcase,   color: "text-violet-600",  bg: "bg-violet-50",  activeRing: "ring-violet-300" },
  { label: "Energy",          icon: Zap,         color: "text-amber-600",   bg: "bg-amber-50",   activeRing: "ring-amber-300" },
  { label: "Capital Markets", icon: TrendingUp,  color: "text-emerald-600", bg: "bg-emerald-50", activeRing: "ring-emerald-300" },
  { label: "NPL / UTP",      icon: ShieldAlert, color: "text-red-500",     bg: "bg-red-50",     activeRing: "ring-red-300" },
  { label: "Infrastructure",  icon: Landmark,    color: "text-cyan-600",    bg: "bg-cyan-50",    activeRing: "ring-cyan-300" },
];

/* ─── Deal type / side → badge ───────────────────────────────────── */

export interface TypeBadgeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const typeMap: Record<string, TypeBadgeConfig> = {
  "Sell-side":       { label: "Sell-side",       icon: ArrowUpRight,  color: "text-red-600",     bg: "bg-red-50" },
  "Buy-side":        { label: "Buy-side",        icon: ArrowDownLeft, color: "text-blue-600",    bg: "bg-blue-50" },
  "Debt Advisory":   { label: "Debt Advisory",   icon: DollarSign,    color: "text-amber-700",   bg: "bg-amber-50" },
  "Capital Raise":   { label: "Capital Raise",   icon: TrendingUp,    color: "text-emerald-700", bg: "bg-emerald-50" },
  "Restructuring":   { label: "Restructuring",   icon: Repeat,        color: "text-violet-700",  bg: "bg-violet-50" },
  "Joint Venture":   { label: "Joint Venture",   icon: Handshake,     color: "text-cyan-700",    bg: "bg-cyan-50" },
};

const defaultType: TypeBadgeConfig = { label: "Advisory", icon: ArrowUpRight, color: "text-slate-600", bg: "bg-slate-50" };

export function getTypeBadgeConfig(dealType: string | null | undefined, side: string | null | undefined): TypeBadgeConfig {
  if (dealType && typeMap[dealType]) return typeMap[dealType];
  if (side) {
    const s = side.toLowerCase();
    if (s.includes("sell")) return typeMap["Sell-side"];
    if (s.includes("buy")) return typeMap["Buy-side"];
  }
  return defaultType;
}

/** Type options for admin dropdown */
export const DEAL_TYPE_OPTIONS = [
  "Sell-side", "Buy-side", "Debt Advisory", "Capital Raise", "Restructuring", "Joint Venture",
] as const;

/* ─── Stage badge ────────────────────────────────────────────────── */

export interface StageBadgeConfig {
  label: string;
  classes: string;
}

const stageMap: Record<string, StageBadgeConfig> = {
  board:        { label: "Board",        classes: "bg-slate-100 text-slate-600" },
  in_review:    { label: "In Review",    classes: "bg-amber-50 text-amber-700" },
  under_nda:    { label: "Under NDA",    classes: "bg-blue-50 text-blue-700" },
  workgroup:    { label: "Workgroup",    classes: "bg-blue-50 text-blue-700" },
  in_progress:  { label: "In Progress",  classes: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  due_diligence:{ label: "Due Diligence",classes: "bg-purple-50 text-purple-700" },
  negotiation:  { label: "Negotiation",  classes: "bg-orange-50 text-orange-700" },
  closing:      { label: "Closing",      classes: "bg-emerald-50 text-emerald-700" },
  closed:       { label: "Closed",       classes: "bg-green-100 text-green-800" },
  closed_won:   { label: "Closed Won",   classes: "bg-emerald-50 text-emerald-700" },
  closed_lost:  { label: "Closed Lost",  classes: "bg-red-50 text-red-600" },
  dead:         { label: "Dead",         classes: "bg-red-50 text-red-600" },
};

export function getStageBadgeConfig(stage: string | null | undefined): StageBadgeConfig {
  if (!stage) return stageMap.board;
  return stageMap[stage] ?? { label: stage.replace(/_/g, " "), classes: "bg-slate-100 text-slate-600" };
}
