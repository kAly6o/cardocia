import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { Table, Td } from "@/components/ui/Table";
import { StatusBadge, LanguageBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { receivePurchase } from "@/lib/actions/purchases";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!purchase) notFound();

  const { data: lines } = await supabase
    .from("purchase_lines")
    .select("*, card:catalog_cards(name, number)")
    .eq("purchase_id", id)
    .order("created_at");

  return (
    <div className="space-y-6">
      <PageHeader
        title={purchase.reference || "Détail de l'achat"}
        description={`${formatDate(purchase.purchase_date)} · ${purchase.seller_name ?? "Vendeur inconnu"}`}
        actions={
          <Link href="/achats" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux achats
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
          <div className="mt-1">
            <StatusBadge status={purchase.status} />
          </div>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(purchase.total, purchase.currency)}</p>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Frais</p>
          <p className="mt-1 text-sm text-muted">
            Livraison {formatCurrency(purchase.shipping_cost, purchase.currency)} · Supp.
            {formatCurrency(purchase.extra_fees, purchase.currency)}
          </p>
        </div>
      </div>

      {purchase.status === "En attente" && (
        <div className="panel-pad flex flex-col gap-3 sm:flex-row sm:items-end">
          <p className="text-sm text-muted">
            Confirmez la réception pour créer le stock physique des cartes achetées.
          </p>
          <form action={receivePurchase} className="flex gap-2">
            <input type="hidden" name="id" value={purchase.id} />
            <select name="destination" className="select w-44" defaultValue="stock">
              <option value="stock">Vers le stock à vendre</option>
              <option value="collection">Vers la collection</option>
            </select>
            <Button type="submit">Marquer comme reçu</Button>
          </form>
        </div>
      )}

      <Table headers={["Type", "Produit", "Langue", "État", "Qté", "P.U.", "Total"]}>
        {(lines ?? []).map((l) => (
          <tr key={l.id}>
            <Td className="text-muted">{l.product_type}</Td>
            <Td>
              <span className="font-medium text-ink">{l.card?.name ?? l.name}</span>
              {l.card && <span className="ml-2 text-xs text-muted">n°{l.card.number}</span>}
            </Td>
            <Td>{l.language ? <LanguageBadge code={l.language} /> : "—"}</Td>
            <Td className="text-muted">
              {l.condition ?? "—"} · {l.finish ?? "—"}
            </Td>
            <Td className="tabular-nums">{l.quantity}</Td>
            <Td className="tabular-nums">{formatCurrency(l.unit_price, purchase.currency)}</Td>
            <Td className="tabular-nums">
              {formatCurrency((l.quantity || 0) * (l.unit_price || 0), purchase.currency)}
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
