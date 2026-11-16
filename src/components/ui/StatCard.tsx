import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="panel-pad relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-1.5 truncate text-2xl font-bold text-ink">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: accent ? `${accent}22` : "rgba(255,255,255,0.05)",
              color: accent ?? "#9b9ba6",
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SpaceBanner({
  label,
  accent,
}: {
  label: string;
  accent: string;
}) {
  return (
    <div className="relative flex items-center gap-2 overflow-hidden rounded-xl border border-line px-4 py-2.5">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {label}
      </span>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}22)` }}
      />
    </div>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-sm font-semibold uppercase tracking-wide text-muted", className)}>
      {children}
    </h2>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-fire" />
      {label}
    </div>
  );
}
