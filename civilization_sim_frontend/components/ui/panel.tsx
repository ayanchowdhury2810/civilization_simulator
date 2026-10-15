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
      className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-sky-100 bg-white shadow-sm ${
        className ?? ""
      }`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b-2 border-sky-50 px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-extrabold text-slate-700">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-xs text-slate-400">{subtitle}</p>
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
