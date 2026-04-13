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
  // Legacy stages (kept for backward compat)
  board:          { label: "Board",          classes: "bg-slate-100 text-slate-600" },
  in_review:      { label: "In Review",      classes: "bg-amber-50 text-amber-700" },
  under_nda:      { label: "Under NDA",      classes: "bg-blue-50 text-blue-700" },
  workgroup:      { label: "Workgroup",      classes: "bg-blue-50 text-blue-700" },
  in_progress:    { label: "In Progress",    classes: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  due_diligence:  { label: "Due Diligence",  classes: "bg-purple-50 text-purple-700" },
  negotiation:    { label: "Negotiation",    classes: "bg-orange-50 text-orange-700" },
  closing:        { label: "Closing",        classes: "bg-emerald-50 text-emerald-700" },
  closed:         { label: "Closed",         classes: "bg-green-100 text-green-800" },
  closed_won:     { label: "Closed Won",     classes: "bg-emerald-50 text-emerald-700" },
  closed_lost:    { label: "Closed Lost",    classes: "bg-red-50 text-red-600" },
  dead:           { label: "Dead",           classes: "bg-red-50 text-red-600" },

  // New L1/L2 pipeline stages
  proposed:           { label: "Proposto",            classes: "bg-slate-100 text-slate-600" },
  admin_review:       { label: "Revisione Admin",     classes: "bg-amber-50 text-amber-700" },
  on_board:           { label: "In Bacheca",          classes: "bg-blue-50 text-blue-700" },
  l1_requested:       { label: "L1 Richiesta",        classes: "bg-yellow-50 text-yellow-700" },
  l1_approved:        { label: "L1 Approvata",        classes: "bg-emerald-50 text-emerald-700" },
  l2_requested:       { label: "L2 Richiesta",        classes: "bg-yellow-50 text-yellow-700" },
  l2_admin_review:    { label: "L2 Verifica Admin",   classes: "bg-amber-50 text-amber-700" },
  l2_approved:        { label: "L2 Approvata",        classes: "bg-emerald-50 text-emerald-700" },
  in_negotiation:     { label: "In Trattativa",       classes: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  call_scheduled:     { label: "Call Schedulata",      classes: "bg-blue-50 text-blue-700" },
  fee_agreement:      { label: "Fee Agreement",       classes: "bg-purple-50 text-purple-700" },
  execution:          { label: "Esecuzione",           classes: "bg-[#D4AF37]/10 text-[#D4AF37]" },
  fee_distributed:    { label: "Fee Distribuita",      classes: "bg-green-100 text-green-800" },

  // Deal rejection statuses
  rejected_not_conforming: { label: "Non Conforme",    classes: "bg-red-50 text-red-600" },
  parked:                  { label: "Parcheggiato",    classes: "bg-orange-50 text-orange-700" },
  pending_integration:     { label: "Integrazioni",    classes: "bg-amber-50 text-amber-700" },
};

export function getStageBadgeConfig(stage: string | null | undefined): StageBadgeConfig {
  if (!stage) return stageMap.board;
  return stageMap[stage] ?? { label: stage.replace(/_/g, " "), classes: "bg-slate-100 text-slate-600" };
}

/* ─── Board status badge ─────────────────────────────────────── */

export interface BoardStatusConfig {
  label: string;
  classes: string;
}

const boardStatusMap: Record<string, BoardStatusConfig> = {
  active:           { label: "Attivo",          classes: "bg-emerald-50 text-emerald-700" },
  in_negotiation:   { label: "In Trattativa",   classes: "bg-[#D4AF37]/10 text-[#D4AF37] ring-1 ring-[#D4AF37]/30" },
  assigned:         { label: "Assegnato",        classes: "bg-slate-100 text-slate-500" },
  archived:         { label: "Archiviato",       classes: "bg-slate-50 text-slate-400" },
};

export function getBoardStatusConfig(status: string | null | undefined): BoardStatusConfig {
  if (!status) return boardStatusMap.active;
  return boardStatusMap[status] ?? boardStatusMap.active;
}

/* ─── L1/L2 interest request status badge ────────────────────── */

export interface InterestStatusConfig {
  label: string;
  classes: string;
}

const interestStatusMap: Record<string, InterestStatusConfig> = {
  // L1
  l1_pending:    { label: "L1 Pending",    classes: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200" },
  l1_approved:   { label: "L1 Approvata",  classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  l1_declined:   { label: "L1 Negata",     classes: "bg-red-50 text-red-600 ring-1 ring-red-200" },
  // L2
  l2_pending:    { label: "L2 Pending",    classes: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200" },
  l2_approved:   { label: "In Trattativa", classes: "bg-[#D4AF37]/10 text-[#D4AF37] ring-1 ring-[#D4AF37]/30" },
  l2_declined:   { label: "L2 Negata",     classes: "bg-red-50 text-red-600 ring-1 ring-red-200" },
  closing:       { label: "Closing",       classes: "bg-emerald-100 text-emerald-800" },
  closed:        { label: "Chiuso",        classes: "bg-slate-100 text-slate-500" },
};

export function getInterestStatusConfig(l1Status: string, l2Status: string): InterestStatusConfig {
  if (l2Status === "approved") return interestStatusMap.l2_approved;
  if (l2Status === "declined") return interestStatusMap.l2_declined;
  if (l2Status !== "not_requested") return interestStatusMap.l2_pending;
  if (l1Status === "approved") return interestStatusMap.l1_approved;
  if (l1Status === "declined") return interestStatusMap.l1_declined;
  return interestStatusMap.l1_pending;
}

/* ─── Asset class config ─────────────────────────────────────── */

export const ASSET_CLASS_OPTIONS = [
  { value: "m_and_a", label: "M&A (azienda)" },
  { value: "real_estate", label: "Real Estate (immobile)" },
  { value: "club_deal", label: "Club Deal / PE (investimento finanziario)" },
  { value: "strategy", label: "Strategy / Consulenza (mandato advisory)" },
  { value: "wealth_management", label: "Wealth Management" },
] as const;

export type AssetClass = typeof ASSET_CLASS_OPTIONS[number]["value"];

/* ─── Minerva services (Codice Retributivo) ──────────────────── */

export const MINERVA_SERVICES: Record<string, { name: string; feeRange: string; notes: string; noFondo?: boolean }> = {
  ma_investments:  { name: "M&A & Investments",     feeRange: "2-5%", notes: "Sell-side: 2-4%; Buy-side: 3-5%; Cross-border: +1%" },
  real_estate:     { name: "Real Estate Advisory",   feeRange: "1-5%", notes: "Transazionale: 3-5%; Portfolio AUM: 3-5%" },
  strategy:        { name: "Strategy Consulting",    feeRange: "1-5%", notes: "Project-based: 3-5%; Retainer: 4-5%" },
  wealth_management:{ name: "Wealth Management",     feeRange: "1-5%", notes: "UHNW: 3-5%; Advisory fee-only: 4-5%" },
  legal:           { name: "Legal Services",         feeRange: "2-4%", notes: "M&A legal: 2-4%; Corporate: 2-3%" },
  tax:             { name: "Tax & Accounting",       feeRange: "2-3%", notes: "Advisory: 2-3%; Compliance: 2-3%" },
  energy:          { name: "Energy & Infrastructure", feeRange: "1-4%", notes: "M&A: 2-3%; Project finance: 2-3%" },
  uhnw:            { name: "UHNW Services",          feeRange: "2-5%", notes: "Rimpatrio: 4-5%; Relocation: 4-5%" },
  tech_digital:    { name: "Technology & Digital",    feeRange: "2-5%", notes: "" },
  banking:         { name: "Banking Services",        feeRange: "2-5%", notes: "NO Fondo Strategico", noFondo: true },
  insurance:       { name: "Insurance Brokerage",     feeRange: "2-3%", notes: "NO Fondo Strategico", noFondo: true },
  cross_border:    { name: "Cross-Border Services",   feeRange: "3-4%", notes: "" },
};

export function calcFondoStrategico(feeLorda: number, minervaFee: number): number {
  const residuo = feeLorda - minervaFee;
  const pct = feeLorda <= 500000 ? 0.03 : 0.02;
  return residuo * pct;
}
