// Graphiques légers en SVG/CSS (aucune dépendance externe).

function n(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export interface Datum {
  label: string;
  value: number;
  color?: string;
}

export function BarList({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((d) => n(d.value)));
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2 text-sm">
          <span className="w-32 shrink-0 truncate text-muted" title={d.label}>
            {d.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(n(d.value) / max) * 100}%`,
                backgroundColor: d.color ?? "#ef4444",
              }}
            />
          </div>
          <span className="w-16 shrink-0 text-right font-medium tabular-nums text-ink">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data }: { data: Datum[] }) {
  const total = data.reduce((s, d) => s + n(d.value), 0);
  if (total <= 0) {
    return <p className="py-8 text-center text-sm text-muted">Aucune donnée.</p>;
  }

  const r = 40;
  const C = 2 * Math.PI * r;
  const segments = data.map((d, i, arr) => {
    const frac = n(d.value) / total;
    const offset = arr.slice(0, i).reduce((s, x) => s + n(x.value) / total, 0);
    return { d, frac, offset };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="14" />
        {segments.map(({ d, frac, offset }) => (
          <circle
            key={d.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={d.color ?? "#ef4444"}
            strokeWidth="14"
            strokeDasharray={`${frac * C} ${C}`}
            strokeDashoffset={-offset * C}
            transform="rotate(-90 50 50)"
          />
        ))}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color ?? "#ef4444" }}
            />
            <span className="text-muted">{d.label}</span>
            <span className="font-medium tabular-nums text-ink">
              {Math.round((n(d.value) / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface MonthlyDatum {
  label: string;
  achats: number;
  ventes: number;
  profit: number;
}

export function MonthlyBars({ data }: { data: MonthlyDatum[] }) {
  const max = Math.max(
    1,
    ...data.flatMap((d) => [n(d.achats), n(d.ventes), n(d.profit)]),
  );

  return (
    <div>
      <div className="flex items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-40 w-full items-end justify-center gap-1">
              <div
                title={`Achats : ${d.achats}`}
                className="w-2.5 rounded-t bg-fire sm:w-3"
                style={{ height: `${(n(d.achats) / max) * 100}%` }}
              />
              <div
                title={`Ventes : ${d.ventes}`}
                className="w-2.5 rounded-t bg-water sm:w-3"
                style={{ height: `${(n(d.ventes) / max) * 100}%` }}
              />
              <div
                title={`Bénéfice : ${d.profit}`}
                className="w-2.5 rounded-t bg-grass sm:w-3"
                style={{ height: `${(n(d.profit) / max) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-fire" /> Achats
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-water" /> Ventes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-grass" /> Bénéfice
        </span>
      </div>
    </div>
  );
}
