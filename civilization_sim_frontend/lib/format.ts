import type { BuildingType, Job } from "./types";

export const JOB_COLORS: Record<Job, string> = {
  Farmer: "text-emerald-400",
  Merchant: "text-amber-400",
  Unemployed: "text-zinc-400",
};

export const JOB_DOTS: Record<Job, string> = {
  Farmer: "bg-emerald-400",
  Merchant: "bg-amber-400",
  Unemployed: "bg-zinc-500",
};

export const BUILDING_GLYPHS: Record<BuildingType, string> = {
  House: "H",
  Farm: "F",
  Market: "M",
};

export const BUILDING_COLORS: Record<BuildingType, string> = {
  House: "bg-indigo-500/80 border-indigo-300/60",
  Farm: "bg-emerald-500/80 border-emerald-300/60",
  Market: "bg-amber-500/80 border-amber-300/60",
};

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function meterColor(value: number): string {
  if (value >= 66) return "bg-emerald-500";
  if (value >= 33) return "bg-amber-500";
  return "bg-rose-500";
}

export function eventTone(type: string): string {
  if (/shortage|yieldlow|sick|leftjob/i.test(type)) return "text-rose-300";
  if (/boom|trade|bought/i.test(type)) return "text-amber-300";
  if (/arrived|built|approved|created/i.test(type)) return "text-emerald-300";
  if (/jobchanged|policyproposed/i.test(type)) return "text-sky-300";
  return "text-zinc-300";
}
