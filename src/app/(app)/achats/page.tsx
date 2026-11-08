import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Table, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { deletePurchase } from "@/lib/actions/purchases";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: string;
  purchase_date: string;
  seller_name: string | null;
  reference: string | null;
  currency: string;
  total: number | null;
  status: string;
  lines: { quantity: number }[];
}

export default async function PurchasesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("*, lines:purchase_lines(quantity)")
    .eq("user_id", user.id)
    .order("purchase_date", { ascending: false })
    .limit(200);

  const purchases = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achats"
        description="Centralisez vos achats de cartes et produits Pokémon."
        actions={
          <Link href="/achats/nouveau" className={buttonVariants("primary")}>
            Nouvel achat
          </Link>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState
          title="Aucun achat"
          description="Enregistrez votre premier achat pour suivre vos dépenses."
          action={
            <Link href="/achats/nouveau" className={buttonVariants("primary")}>
              Nouvel achat
            </Link>
          }
        />
      ) : (
        <Table headers={["Date", "Vendeur", "Référence", "Articles", "Total", "Statut", "Actions"]}>
          {purchases.map((p) => (
            <tr key={p.id} className="hover:bg-surface-2/40">
              <Td>{formatDate(p.purchase_date)}</Td>
              <Td>{p.seller_name ?? "—"}</Td>
              <Td className="text-muted">{p.reference ?? "—"}</Td>
              <Td className="tabular-nums">
                {p.lines?.reduce((s, l) => s + (l.quantity || 0), 0) ?? 0}
              </Td>
              <Td className="tabular-nums font-medium">{formatCurrency(p.total, p.currency)}</Td>
              <Td>
                <StatusBadge status={p.status} />
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <Link href={`/achats/${p.id}`}>
                    <IconButton title="Voir le détail">→</IconButton>
                  </Link>
                  <ConfirmForm action={deletePurchase} message="Supprimer cet achat et ses lignes ?">
                    <input type="hidden" name="id" value={p.id} />
                    <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">
                      🗑
                    </IconButton>
                  </ConfirmForm>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
