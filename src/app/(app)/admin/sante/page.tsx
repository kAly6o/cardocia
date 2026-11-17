import Link from "next/link";
import { PageHeader, StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Td } from "@/components/ui/Table";
import { getCatalogHealth, type CatalogHealthSeverity } from "@/lib/queries/admin";
import { formatNumber } from "@/lib/utils";

const SEVERITY: Record<
  CatalogHealthSeverity,
  { label: string; className: string; accent: string }
> = {
  error: {
    label: "Erreur",
    className: "border-red-600/40 bg-red-900/30 text-red-300",
    accent: "#ef4444",
  },
  warning: {
    label: "Avertissement",
    className: "border-amber-600/40 bg-amber-900/30 text-amber-300",
    accent: "#f59e0b",
  },
  info: {
    label: "Information",
    className: "border-sky-600/40 bg-sky-900/30 text-sky-300",
    accent: "#0ea5e9",
  },
};

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const health = await getCatalogHealth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Santé du catalogue"
        description="Diagnostic d'intégrité : extensions, cartes et données manquantes."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Extensions" value={formatNumber(health.setsTotal)} accent="#3b82f6" />
        <StatCard label="Cartes" value={formatNumber(health.cardsTotal)} accent="#22c55e" />
        <StatCard
          label="Problèmes détectés"
          value={formatNumber(health.issuesTotal)}
          sub={
            health.issuesTotal === 0
              ? "Tout est en ordre"
              : `${formatNumber(health.errors)} erreur(s) · ${formatNumber(health.warnings)} avertissement(s)`
          }
          accent={health.errors > 0 ? "#ef4444" : "#f59e0b"}
        />
        <StatCard
          label="Collections"
          value={formatNumber(health.collectionsTotal)}
          accent="#f97316"
        />
      </div>

      {health.issuesTotal === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-600/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-300">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          Aucun problème détecté dans le catalogue.
        </div>
      )}

      <div className="space-y-4">
        {health.checks.map((check) => {
          const s = SEVERITY[check.severity];
          return (
            <section key={check.key} className="panel-pad">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-medium text-ink">{check.label}</h2>
                  <Badge className={s.className}>{s.label}</Badge>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: s.accent }}>
                    {formatNumber(check.count)}
                  </span>
                </div>
                <Link
                  href={check.href}
                  className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
                >
                  Voir dans le catalogue →
                </Link>
              </div>

              <p className="mt-1 text-sm text-muted">{check.description}</p>

              {check.count === 0 ? (
                <p className="mt-3 text-sm text-emerald-300">Aucun élément concerné.</p>
              ) : (
                <>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface">
                    <table className="w-full min-w-[480px] border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-surface-2/60">
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                            Nom
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                            Détail
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {check.items.map((it) => (
                          <tr key={it.id} className="hover:bg-surface-2/40">
                            <Td className="font-medium text-ink">{it.name}</Td>
                            <Td className="text-muted">{it.detail ?? "—"}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {check.count > check.items.length && (
                    <p className="mt-2 text-xs text-muted">
                      {formatNumber(check.count - check.items.length)} autre(s) élément(s) non
                      affiché(s).
                    </p>
                  )}
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}