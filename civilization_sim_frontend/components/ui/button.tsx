import type { ButtonHTMLAttributes, CSSProperties } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: { backgroundColor: "#3f9b46", color: "#ffffff" },
  secondary: { backgroundColor: "#c6c6c6", color: "#232323" },
  ghost: { backgroundColor: "#b4b4b4", color: "#232323" },
  danger: { backgroundColor: "#b3402f", color: "#ffffff" },
};

const DISABLED: CSSProperties = {
  backgroundColor: "#b0b0b0",
  color: "#7d7d7d",
};

export function Button({
  variant = "secondary",
  className,
  disabled,
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      disabled={disabled}
      style={{ ...(disabled ? DISABLED : VARIANTS[variant]), ...style }}
      className={`mc-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold ${
        className ?? ""
      }`}
      {...props}
    />
  );
}
