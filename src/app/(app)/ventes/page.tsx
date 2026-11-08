import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Table, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { deleteSale } from "@/lib/actions/sales";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Row {
  id: string;
  sale_date: string;
  platform: string;
  reference: string | null;
  currency: string;
  amount_received: number | null;
  profit: number | null;
  status: string;
}

export default async function SalesPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("*")
    .eq("user_id", user.id)
    .order("sale_date", { ascending: false })
    .limit(200);

  const sales = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventes"
        description="Suivez vos ventes et leur rentabilité sur toutes vos plateformes."
        actions={
          <Link href="/ventes/nouveau" className={buttonVariants("primary")}>
            Nouvelle vente
          </Link>
        }
      />

      {sales.length === 0 ? (
        <EmptyState
          title="Aucune vente"
          description="Enregistrez votre première vente pour calculer vos bénéfices."
          action={
            <Link href="/ventes/nouveau" className={buttonVariants("primary")}>
              Nouvelle vente
            </Link>
          }
        />
      ) : (
        <Table headers={["Date", "Plateforme", "Référence", "Encaissé", "Bénéfice", "Statut", "Actions"]}>
          {sales.map((s) => (
            <tr key={s.id} className="hover:bg-surface-2/40">
              <Td>{formatDate(s.sale_date)}</Td>
              <Td>{s.platform}</Td>
              <Td className="text-muted">{s.reference ?? "—"}</Td>
              <Td className="tabular-nums font-medium">{formatCurrency(s.amount_received, s.currency)}</Td>
              <Td
                className={
                  (s.profit ?? 0) >= 0 ? "tabular-nums text-emerald-300" : "tabular-nums text-red-300"
                }
              >
                {formatCurrency(s.profit, s.currency)}
              </Td>
              <Td>
                <StatusBadge status={s.status} />
              </Td>
              <Td>
                <ConfirmForm action={deleteSale} message="Supprimer cette vente ?">
                  <input type="hidden" name="id" value={s.id} />
                  <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">
                    🗑
                  </IconButton>
                </ConfirmForm>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
