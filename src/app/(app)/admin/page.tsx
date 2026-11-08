import { PageHeader, StatCard } from "@/components/ui/StatCard";
import { getGlobalStats } from "@/lib/queries/admin";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Table, Td } from "@/components/ui/Table";

export default async function AdminDashboardPage() {
  const s = await getGlobalStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administration"
        description="Vue globale de la plateforme Cardocia."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Utilisateurs"
          value={formatNumber(s.users)}
          sub={`${formatNumber(s.admins)} admin(s)`}
          accent="#a855f7"
        />
        <StatCard label="Collections" value={formatNumber(s.collections)} accent="#f97316" />
        <StatCard label="Extensions" value={formatNumber(s.sets)} accent="#3b82f6" />
        <StatCard label="Cartes au catalogue" value={formatNumber(s.cards)} accent="#22c55e" />
        <StatCard
          label="Exemplaires en collection"
          value={formatNumber(s.collectionTotal)}
          accent="#3b82f6"
        />
        <StatCard label="Exemplaires en stock" value={formatNumber(s.stockTotal)} accent="#ef4444" />
        <StatCard
          label="Ventes"
          value={formatNumber(s.salesCount)}
          sub={formatCurrency(s.salesRevenue)}
          accent="#22c55e"
        />
        <StatCard
          label="Achats"
          value={formatNumber(s.purchasesCount)}
          sub={formatCurrency(s.purchasesSpend)}
          accent="#f97316"
        />
      </div>

      <section className="panel-pad">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Cartes les plus collectionnées
        </h2>
        {s.topCards.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucune carte en collection pour le moment.
          </p>
        ) : (
          <Table headers={["Carte", "Numéro", "Exemplaires"]}>
            {s.topCards.map((c) => (
              <tr key={`${c.name}::${c.number}`} className="hover:bg-surface-2/40">
                <Td className="font-medium text-ink">{c.name}</Td>
                <Td className="text-muted">{c.number || "—"}</Td>
                <Td className="tabular-nums">{formatNumber(c.total)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}
