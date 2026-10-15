import type { ReactNode } from "react";

type Tone = "zinc" | "emerald" | "amber" | "rose" | "sky" | "indigo";

const TONES: Record<Tone, string> = {
  zinc: "bg-slate-100 text-slate-600 border-slate-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  rose: "bg-rose-100 text-rose-700 border-rose-200",
  sky: "bg-sky-100 text-sky-700 border-sky-200",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export function Badge({
  children,
  tone = "zinc",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        TONES[tone]
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
