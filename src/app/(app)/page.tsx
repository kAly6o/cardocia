import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { getDashboardStats } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { StatCard, PageHeader } from "@/components/ui/StatCard";
import { MonthlyBars, Donut, BarList } from "@/components/charts";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();

  let currency = "EUR";
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("default_currency")
      .eq("id", user.id)
      .maybeSingle();
    currency = profile?.default_currency ?? "EUR";
  } catch {
    // devise par défaut conservée
  }

  const stats = await getDashboardStats(user.id);

  const isEmpty =
    stats.totalOwned === 0 &&
    stats.sealedCount === 0 &&
    stats.totalPurchases === 0 &&
    stats.totalSales === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre collection et de votre activité."
      />

      {isEmpty && (
        <div className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
          <p className="font-medium text-ink">Bienvenue !</p>
          <p className="mt-1">
            Votre espace est vide. Commencez par explorer votre{" "}
            <Link href="/collection" className="text-fire hover:underline">
              collection
            </Link>
            et y ajouter vos cartes.
          </p>
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Exemplaires possédés" value={formatNumber(stats.totalOwned)} accent="#a855f7" />
        <StatCard label="Cartes différentes" value={formatNumber(stats.distinctCards)} accent="#3b82f6" />
        <StatCard label="En collection" value={formatNumber(stats.collectionCount)} accent="#22c55e" />
        <StatCard label="Disponibles à la vente" value={formatNumber(stats.availableForSale)} accent="#ef4444" />
        <StatCard label="Réservées" value={formatNumber(stats.reservedCount)} accent="#facc15" />
        <StatCard label="Produits scellés" value={formatNumber(stats.sealedCount)} accent="#6b7280" />
        <StatCard label="Valeur collection" value={formatCurrency(stats.collectionValue, currency)} accent="#3b82f6" />
        <StatCard label="Valeur stock" value={formatCurrency(stats.stockValue, currency)} accent="#ef4444" />
        <StatCard label="Total achats" value={formatCurrency(stats.totalPurchases, currency)} accent="#f97316" />
        <StatCard label="Total ventes" value={formatCurrency(stats.totalSales, currency)} accent="#22c55e" />
        <StatCard
          label="Bénéfice / perte"
          value={formatCurrency(stats.profit, currency)}
          accent={stats.profit >= 0 ? "#22c55e" : "#ef4444"}
        />
      </div>

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Évolution mensuelle
          </h2>
          <MonthlyBars data={stats.monthly} />
        </section>

        <div className="space-y-4">
          <section className="panel-pad">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
              Collection / stock
            </h2>
            <Donut data={stats.split} />
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Répartition par rareté
          </h2>
          <BarList data={stats.rarity} />
        </section>

        <section className="panel-pad">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Derniers mouvements
          </h2>
          {stats.recentMovements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucun mouvement pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recentMovements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">
                      {m.card_name ?? m.notes ?? "Carte"}
                    </p>
                    <p className="text-xs text-muted">{formatDate(m.created_at, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge>{m.type}</Badge>
                    <span className="text-xs tabular-nums text-muted">×{m.quantity}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
