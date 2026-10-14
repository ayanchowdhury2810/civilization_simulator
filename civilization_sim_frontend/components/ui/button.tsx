import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-400",
  secondary:
    "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500",
  ghost:
    "bg-transparent text-zinc-300 hover:bg-zinc-800 disabled:text-zinc-600",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-zinc-700 disabled:text-zinc-400",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
        VARIANTS[variant]
      } ${className ?? ""}`}
      {...props}
    />
  );
}
