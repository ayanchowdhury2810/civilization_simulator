import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur ${
        className ?? ""
      }`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
          <div className="min-w-0">
            <h2 className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-[11px] text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={`min-h-0 flex-1 p-3 ${bodyClassName ?? ""}`}>
        {children}
      </div>
    </section>
  );
}
