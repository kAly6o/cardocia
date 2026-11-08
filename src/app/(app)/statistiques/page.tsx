import { requireUser } from "@/lib/get-user";
import { getDashboardStats, getDistributionStats } from "@/lib/stats";
import { PageHeader } from "@/components/ui/StatCard";
import { StatCard } from "@/components/ui/StatCard";
import { MonthlyBars, Donut, BarList } from "@/components/charts";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function StatisticsPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);
  const dist = await getDistributionStats(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Statistiques"
        description="Valorisation, rentabilité et répartitions de votre collection."
        actions={
          <div className="flex flex-wrap gap-2">
            <a className={buttonVariants("outline", "sm")} href="/api/export?type=collection">
              Export collection
            </a>
            <a className={buttonVariants("outline", "sm")} href="/api/export?type=stock">
              Export stock
            </a>
            <a className={buttonVariants("outline", "sm")} href="/api/export?type=achats">
              Export achats
            </a>
            <a className={buttonVariants("outline", "sm")} href="/api/export?type=ventes">
              Export ventes
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Valeur collection" value={formatCurrency(stats.collectionValue)} accent="#3b82f6" />
        <StatCard label="Valeur stock" value={formatCurrency(stats.stockValue)} accent="#ef4444" />
        <StatCard label="Total achats" value={formatCurrency(stats.totalPurchases)} accent="#f97316" />
        <StatCard label="Total ventes" value={formatCurrency(stats.totalSales)} accent="#22c55e" />
        <StatCard label="Bénéfice" value={formatCurrency(stats.profit)} accent={stats.profit >= 0 ? "#22c55e" : "#ef4444"} />
        <StatCard label="Cartes différentes" value={formatNumber(stats.distinctCards)} accent="#a855f7" />
      </div>

      <section className="panel-pad">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Évolution mensuelle (achats, ventes, bénéfice)
        </h2>
        <MonthlyBars data={stats.monthly} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Répartition collection / stock
          </h2>
          <Donut data={stats.split} />
        </section>
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Répartition par rareté
          </h2>
          <BarList data={stats.rarity} />
        </section>
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Répartition par langue
          </h2>
          <Donut data={dist.language} />
        </section>
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Répartition par extension
          </h2>
          <BarList data={dist.extension} />
        </section>
      </div>
    </div>
  );
}
