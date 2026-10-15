import { meterColor } from "@/lib/format";

export function Meter({
  label,
  value,
  max = 100,
  suffix,
  invert = false,
}: {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  invert?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorPct = invert ? 100 - pct : pct;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>
          {Math.round(value)}
          {suffix ?? ""}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${meterColor(colorPct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
