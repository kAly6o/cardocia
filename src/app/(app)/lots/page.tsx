import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { LotFormModal } from "@/components/lots/LotFormModal";
import { BoostersPanel } from "@/components/boosters/BoostersPanel";
import { deleteLot } from "@/lib/actions/lots";
import { formatCurrency, cn } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  description: string | null;
  desired_price: number | null;
  status: string;
  lines: { quantity: number; unit_cost: number | null }[];
}

export default async function LotsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab = sp.tab === "boosters" ? "boosters" : "lots";

  const tabBar = (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/lots"
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          tab === "lots"
            ? "border-brand text-brand"
            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        Lots
      </Link>
      <Link
        href="/lots?tab=boosters"
        className={cn(
          "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          tab === "boosters"
            ? "border-brand text-brand"
            : "border-line text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        Boosters
      </Link>
    </div>
  );

  if (tab === "boosters") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lots & Boosters"
          description="Composez des lots et des boosters reconditionnés à partir de votre stock."
        />
        {tabBar}
        <BoostersPanel />
      </div>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("lots")
    .select("*, lines:lot_lines(quantity, unit_cost)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const lots = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lots & Boosters"
        description="Composez des lots et des boosters reconditionnés à partir de votre stock."
        actions={<LotFormModal />}
      />

      {tabBar}

      {lots.length === 0 ? (
        <EmptyState
          title="Aucun lot"
          description="Créez un lot pour regrouper des cartes et les vendre ensemble."
          action={<LotFormModal />}
        />
      ) : (
        <Table headers={["Nom", "Cartes", "Coût total", "Prix souhaité", "Statut", "Actions"]}>
          {lots.map((l) => {
            const cost = l.lines.reduce((s, x) => s + (x.quantity || 0) * (x.unit_cost || 0), 0);
            return (
              <tr key={l.id} className="hover:bg-surface-2/40">
                <Td>
                  <Link href={`/lots/${l.id}`} className="font-medium text-ink hover:text-fire">
                    {l.name}
                  </Link>
                </Td>
                <Td className="tabular-nums">{l.lines.reduce((s, x) => s + (x.quantity || 0), 0)}</Td>
                <Td className="tabular-nums">{formatCurrency(cost)}</Td>
                <Td className="tabular-nums font-medium">{formatCurrency(l.desired_price)}</Td>
                <Td>
                  <StatusBadge status={l.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Link href={`/lots/${l.id}`}>
                      <IconButton title="Voir">→</IconButton>
                    </Link>
                    <ConfirmForm action={deleteLot} message="Supprimer ce lot ? Les cartes seront libérées.">
                      <input type="hidden" name="id" value={l.id} />
                      <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">
                        🗑
                      </IconButton>
                    </ConfirmForm>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
