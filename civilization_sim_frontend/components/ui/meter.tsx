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
      <div className="flex items-center justify-between text-xs font-bold text-[#2b2b2b]">
        <span>{label}</span>
        <span>
          {Math.round(value)}
          {suffix ?? ""}
        </span>
      </div>
      <div className="mc-inset h-3 overflow-hidden p-[2px]">
        <div
          className={`h-full ${meterColor(colorPct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
