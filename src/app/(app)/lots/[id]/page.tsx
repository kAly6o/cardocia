import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { addToLot, removeLotLine, setLotStatus, deleteLot } from "@/lib/actions/lots";
import { LOT_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface LineRow {
  id: string;
  quantity: number;
  unit_cost: number | null;
  card: { name: string; number: string } | null;
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!lot) notFound();

  const [{ data: lines }, { data: available }] = await Promise.all([
    supabase.from("lot_lines").select("*, card:catalog_cards(name, number)").eq("lot_id", id),
    supabase
      .from("stock_items")
      .select("id, quantity, acquisition_cost, card:catalog_cards(name, number)")
      .eq("user_id", user.id)
      .eq("status", "Disponible"),
  ]);

  const lotLines = (lines ?? []) as unknown as LineRow[];
  const cost = lotLines.reduce((s, l) => s + (l.quantity || 0) * (l.unit_cost || 0), 0);
  const availableStock = (available ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    acquisition_cost: number | null;
    card: { name: string; number: string } | null;
  }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lot.name}
        description={lot.description ?? "Lot de cartes."}
        actions={
          <Link href="/lots" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux lots
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
          <div className="mt-1">
            <StatusBadge status={lot.status} />
          </div>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Coût total</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(cost)}</p>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Bénéfice estimé</p>
          <p className="mt-1 text-xl font-bold">
            {lot.desired_price != null ? formatCurrency(lot.desired_price - cost) : "—"}
          </p>
        </div>
      </div>

      <div className="panel-pad flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Changer le statut :</span>
        {LOT_STATUSES.filter((s) => s !== lot.status).map((s) => (
          <form key={s} action={setLotStatus}>
            <input type="hidden" name="id" value={lot.id} />
            <input type="hidden" name="status" value={s} />
            <button type="submit" className={buttonVariants("outline", "sm")}>
              {s}
            </button>
          </form>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Cartes du lot
          </h2>
          {lotLines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune carte dans ce lot.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lotLines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{l.card?.name ?? "—"}</p>
                    <p className="text-xs text-muted">n°{l.card?.number ?? "?"} · ×{l.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-muted">{formatCurrency(l.unit_cost)}</span>
                    <form action={removeLotLine}>
                      <input type="hidden" name="line_id" value={l.id} />
                      <IconButton type="submit" title="Retirer" className="hover:text-red-300">✕</IconButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-pad">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Ajouter une carte du stock
          </h2>
          {availableStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Aucun article disponible dans le stock à vendre.
            </p>
          ) : (
            <form action={addToLot} className="flex flex-col gap-3">
              <input type="hidden" name="lot_id" value={lot.id} />
              <select name="stock_item_id" className="select" required defaultValue="">
                <option value="" disabled>
                  Choisir un article…
                </option>
                {availableStock.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.card?.name ?? "Carte"} n°{s.card?.number ?? "?"} · ×{s.quantity}
                  </option>
                ))}
              </select>
              <input name="quantity" type="number" min={1} defaultValue={1} className="input" placeholder="Quantité" />
              <button type="submit" className={buttonVariants("primary")}>
                Ajouter au lot
              </button>
            </form>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <ConfirmForm action={deleteLot} message="Supprimer ce lot ? Les cartes seront libérées.">
          <input type="hidden" name="id" value={lot.id} />
          <button type="submit" className={buttonVariants("danger")}>
            Supprimer le lot
          </button>
        </ConfirmForm>
      </div>
    </div>
  );
}
