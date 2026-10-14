import type { ReactNode } from "react";

type Tone = "zinc" | "emerald" | "amber" | "rose" | "sky" | "indigo";

const TONES: Record<Tone, string> = {
  zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        TONES[tone]
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
