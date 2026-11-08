import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { addBoosterLine, removeBoosterLine, setBoosterStatus, deleteBooster } from "@/lib/actions/boosters";
import { BOOSTER_STATUSES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface LineRow {
  id: string;
  quantity: number;
  unit_cost: number | null;
  card: { name: string; number: string } | null;
}

export default async function BoosterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: booster } = await supabase
    .from("booster_products")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booster) notFound();

  const [{ data: lines }, { data: available }] = await Promise.all([
    supabase.from("booster_lines").select("*, card:catalog_cards(name, number)").eq("booster_id", id),
    supabase
      .from("stock_items")
      .select("id, quantity, card:catalog_cards(name, number)")
      .eq("user_id", user.id)
      .eq("status", "Disponible"),
  ]);

  const boosterLines = (lines ?? []) as unknown as LineRow[];
  const cost = boosterLines.reduce((s, l) => s + (l.quantity || 0) * (l.unit_cost || 0), 0);
  const availableStock = (available ?? []) as unknown as Array<{
    id: string;
    quantity: number;
    card: { name: string; number: string } | null;
  }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={booster.name}
        description="Composition réelle du booster. Le coût est calculé à partir des cartes utilisées."
        actions={
          <Link href="/lots?tab=boosters" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux boosters
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Statut</p>
          <div className="mt-1">
            <StatusBadge status={booster.status} />
          </div>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Coût de fabrication</p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(cost)}</p>
        </div>
        <div className="panel-pad">
          <p className="text-xs uppercase tracking-wide text-muted">Bénéfice estimé</p>
          <p className="mt-1 text-xl font-bold">
            {booster.desired_price != null ? formatCurrency(booster.desired_price - cost) : "—"}
          </p>
        </div>
      </div>

      <div className="panel-pad flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Changer le statut :</span>
        {BOOSTER_STATUSES.filter((s) => s !== booster.status).map((s) => (
          <form key={s} action={setBoosterStatus}>
            <input type="hidden" name="id" value={booster.id} />
            <input type="hidden" name="status" value={s} />
            <button type="submit" className={buttonVariants("outline", "sm")}>{s}</button>
          </form>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel-pad">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Composition</h2>
          {boosterLines.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucune carte ajoutée.</p>
          ) : (
            <ul className="divide-y divide-line">
              {boosterLines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{l.card?.name ?? "—"}</p>
                    <p className="text-xs text-muted">n°{l.card?.number ?? "?"} · ×{l.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-muted">{formatCurrency(l.unit_cost)}</span>
                    <form action={removeBoosterLine}>
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Ajouter une carte du stock</h2>
          {availableStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Aucun article disponible.</p>
          ) : (
            <form action={addBoosterLine} className="flex flex-col gap-3">
              <input type="hidden" name="booster_id" value={booster.id} />
              <select name="stock_item_id" className="select" required defaultValue="">
                <option value="" disabled>Choisir un article…</option>
                {availableStock.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.card?.name ?? "Carte"} n°{s.card?.number ?? "?"} · ×{s.quantity}
                  </option>
                ))}
              </select>
              <input name="quantity" type="number" min={1} defaultValue={1} className="input" placeholder="Quantité" />
              <button type="submit" className={buttonVariants("primary")}>Ajouter au booster</button>
            </form>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <ConfirmForm action={deleteBooster} message="Supprimer ce booster ? Les cartes seront libérées.">
          <input type="hidden" name="id" value={booster.id} />
          <button type="submit" className={buttonVariants("danger")}>Supprimer le booster</button>
        </ConfirmForm>
      </div>
    </div>
  );
}
