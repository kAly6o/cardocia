import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { CardImage } from "@/components/cards/CardImage";
import { CollectionFormModal } from "@/components/collection/CollectionFormModal";
import { Table, Td } from "@/components/ui/Table";
import { LanguageBadge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { transferToStock, deleteCollectionItem, quickAddCard } from "@/lib/actions/collection";
import { getSet } from "@/lib/queries/catalogue";
import { getSetCardsTracker } from "@/lib/queries/collection";
import { RARITIES, POKEMON_TYPE_LABELS } from "@/lib/constants";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";

const FINISH_BUTTONS: {
  key: "normal" | "reverse" | "holo";
  finish: string;
  short: string;
  color: string;
}[] = [
  { key: "normal", finish: "Normale", short: "Normal", color: "bg-zinc-500 hover:bg-zinc-400" },
  { key: "reverse", finish: "Reverse", short: "Reverse", color: "bg-cyan-500 hover:bg-cyan-400" },
  { key: "holo", finish: "Holographique", short: "Holo", color: "bg-indigo-500 hover:bg-indigo-400" },
];

function finishesFor(v: { normal?: boolean; reverse?: boolean; holo?: boolean } | null) {
  if (v) {
    const out = FINISH_BUTTONS.filter((f) => v[f.key] === true);
    if (out.length) return out;
  }
  // Pas encore de données de variante → bouton « + » neutre (ajoute en Normale).
  return [{ key: "normal", finish: "Normale", short: "+", color: "bg-brand hover:bg-brand-strong" }];
}

interface ItemRow {
  id: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  quantity: number;
  acquisition_cost: number | null;
  estimated_value: number | null;
  acquisition_date: string | null;
  notes: string | null;
  location: string | null;
  card: { id: string; name: string; number: string; set_id: string } | null;
}

export default async function CollectionSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ q?: string; rarity?: string; type?: string }>;
}) {
  const user = await requireUser();
  const { setId } = await params;
  const sp = await searchParams;
  const set = await getSet(setId);
  if (!set) notFound();
  const tracker = await getSetCardsTracker(user.id, setId);

  const q = (sp.q ?? "").toLowerCase();
  const cards = tracker.cards.filter((c) => {
    if (sp.rarity && c.rarity !== sp.rarity) return false;
    if (sp.type && c.pokemon_type !== sp.type) return false;
    if (q && !c.name.toLowerCase().includes(q) && !c.number.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const supabase = await createClient();
  const { data: itemsData } = await supabase
    .from("collection_items")
    .select("*, card:catalog_cards(id, name, number, set_id)")
    .eq("user_id", user.id)
    .eq("card.set_id", setId)
    .order("created_at", { ascending: false });
  const items = (itemsData ?? []) as unknown as ItemRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={set.name}
        description={`${set.collection?.name ?? ""} · ${tracker.ownedDistinct}/${tracker.total} cartes · ${tracker.percent}%`}
        actions={
          <Link
            href={`/collection/${set.collection_id}`}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            ← Extensions
          </Link>
        }
      />

      <form method="get" className="panel-pad grid gap-3 sm:grid-cols-4">
        <div>
          <label className="field-label">Recherche</label>
          <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Nom ou numéro…" />
        </div>
        <div>
          <label className="field-label">Rareté</label>
          <select className="select" name="rarity" defaultValue={sp.rarity ?? ""}>
            <option value="">Toutes</option>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Type</label>
          <select className="select" name="type" defaultValue={sp.type ?? ""}>
            <option value="">Tous</option>
            {POKEMON_TYPE_LABELS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
          >
            Filtrer
          </button>
        </div>
      </form>

      {cards.length === 0 ? (
        <EmptyState title="Aucune carte" description="Aucune carte ne correspond à ces critères." />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {cards.map((c) => {
            const owned = c.ownedDistinct > 0;
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg border bg-surface text-left transition-colors",
                  owned ? "border-grass/70" : "border-line hover:border-brand",
                )}
              >
                <Link href={`/collection/carte/${c.id}`} className="block">
                  <div className="relative aspect-[63/88] overflow-hidden bg-surface-2">
                    <CardImage
                      src={c.image}
                      alt={c.name}
                      className={cn(
                        "h-full w-full transition-transform duration-200 group-hover:scale-105",
                        !owned && "opacity-50 grayscale",
                      )}
                    />
                    {owned && (
                      <span className="absolute right-1 top-1 rounded bg-grass px-1.5 py-0.5 text-[10px] font-bold text-black">
                        ×{formatNumber(c.ownedQuantity)}
                      </span>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-xs font-medium text-ink" title={c.name}>
                      {c.name}
                    </p>
                    <p className="truncate text-[10px] text-muted">n°{c.number}</p>
                  </div>
                </Link>
                <div className="flex gap-1 p-1.5">
                  {finishesFor(c.variants).map((f) => (
                    <form key={f.key} action={quickAddCard} className="min-w-0 flex-1">
                      <input type="hidden" name="card_id" value={c.id} />
                      <input type="hidden" name="finish" value={f.finish} />
                      <button
                        type="submit"
                        title={`Ajouter — ${f.finish}`}
                        className={`w-full truncate rounded-md px-1 py-1 text-[11px] font-semibold leading-none text-white transition-colors ${f.color}`}
                      >
                        {f.short}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Mes exemplaires de cette extension</h2>
          <Table
            headers={[
              "Carte",
              "Langue",
              "État",
              "Finition",
              "Qté",
              "Coût",
              "Emplacement",
              "Actions",
            ]}
          >
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-surface-2/40">
                <Td>
                  <span className="font-medium text-ink">{i.card?.name ?? "—"}</span>
                  <span className="ml-2 text-xs text-muted">
                    {i.card ? `n°${i.card.number}` : ""}
                  </span>
                </Td>
                <Td>
                  <LanguageBadge code={i.language} />
                </Td>
                <Td className="text-muted">{i.condition}</Td>
                <Td className="text-muted">{i.finish}</Td>
                <Td className="tabular-nums">{i.quantity}</Td>
                <Td className="tabular-nums">{formatCurrency(i.acquisition_cost)}</Td>
                <Td className="text-muted">{i.location ?? "—"}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <CollectionFormModal
                      item={{
                        id: i.id,
                        card_id: i.card_id,
                        language: i.language,
                        condition: i.condition,
                        finish: i.finish,
                        quantity: i.quantity,
                        acquisition_cost: i.acquisition_cost,
                        estimated_value: i.estimated_value,
                        acquisition_date: i.acquisition_date,
                        notes: i.notes,
                        location: i.location,
                        cardLabel: i.card ? `${i.card.name} n°${i.card.number}` : undefined,
                      }}
                      trigger={<IconButton title="Modifier">✎</IconButton>}
                    />
                    <form action={transferToStock}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="quantity" value={i.quantity} />
                      <IconButton type="submit" title="Transférer vers le stock">
                        →
                      </IconButton>
                    </form>
                    <ConfirmForm
                      action={deleteCollectionItem}
                      message="Supprimer cet exemplaire ? L'opération sera tracée dans l'historique."
                    >
                      <input type="hidden" name="id" value={i.id} />
                      <IconButton
                        type="submit"
                        title="Supprimer"
                        className="hover:bg-red-900/30 hover:text-red-300"
                      >
                        🗑
                      </IconButton>
                    </ConfirmForm>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </section>
      )}
    </div>
  );
}
