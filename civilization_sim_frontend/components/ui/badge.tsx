import type { ReactNode } from "react";

type Tone = "zinc" | "emerald" | "amber" | "rose" | "sky" | "indigo";

const TONES: Record<Tone, string> = {
  zinc: "bg-[#d4d4d4] text-[#2b2b2b] border-[#5b5b5b]",
  emerald: "bg-[#7fbf6a] text-[#12300a] border-[#3f7d2e]",
  amber: "bg-[#e8c05a] text-[#3d2c07] border-[#a9832a]",
  rose: "bg-[#e08a80] text-[#3d0f0a] border-[#a5382c]",
  sky: "bg-[#8fc4e8] text-[#0c2b40] border-[#3a7ea6]",
  indigo: "bg-[#a5a9e0] text-[#141736] border-[#4b4f9b]",
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
      className={`inline-flex items-center border-2 px-2 py-0.5 text-xs font-bold ${
        TONES[tone]
      } ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
