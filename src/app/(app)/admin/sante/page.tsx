import { PageHeader, StatCard } from "@/components/ui/StatCard";
import { getCatalogHealth } from "@/lib/queries/admin";
import { formatNumber } from "@/lib/utils";
import { HealthCheckList } from "@/components/admin/HealthCheckList";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const health = await getCatalogHealth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Santé du catalogue"
        description="Diagnostic d'intégrité — corrigez directement chaque élément (logo, image, abréviation…)."
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

      <HealthCheckList
        checks={health.checks}
        collectionOptions={health.collectionOptions}
        setOptions={health.setOptions}
      />
    </div>
  );
}