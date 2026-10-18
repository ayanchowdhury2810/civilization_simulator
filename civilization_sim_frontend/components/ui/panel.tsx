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
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`mc-panel flex min-h-0 flex-col overflow-hidden ${
        className ?? ""
      }`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-2 border-b-2 border-[#8b8b8b] bg-[#9d9d9d] px-3 py-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#16181c]">
              {title}
            </h2>
            {subtitle ? (
              <p className="truncate text-xs font-medium text-[#4a4f57]">
                {subtitle}
              </p>
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
