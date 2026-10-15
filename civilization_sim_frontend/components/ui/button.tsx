import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400",
  secondary:
    "bg-sky-100 text-sky-800 hover:bg-sky-200 disabled:bg-slate-100 disabled:text-slate-400",
  ghost:
    "bg-transparent text-slate-500 hover:bg-slate-100 disabled:text-slate-300",
  danger:
    "bg-rose-500 text-white hover:bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400",
};

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
        VARIANTS[variant]
      } ${className ?? ""}`}
      {...props}
    />
  );
}
