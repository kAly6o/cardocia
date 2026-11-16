import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Button";
import { CardImage } from "@/components/cards/CardImage";
import { Table, Td } from "@/components/ui/Table";
import { LanguageBadge } from "@/components/ui/Badge";
import { StockRowActions } from "@/components/stock/StockRowActions";
import { quickAddStock } from "@/lib/actions/stock";
import { stockStatusClass } from "@/lib/colors";
import { getSet } from "@/lib/queries/catalogue";
import { getStockCardsTracker } from "@/lib/queries/stock";
import { formatNumber, formatCurrency, cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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
  return [{ key: "normal", finish: "Normale", short: "+", color: "bg-brand hover:bg-brand-strong" }];
}

interface StockRow {
  id: string;
  card_id: string;
  language: string;
  condition: string;
  finish: string;
  acquisition_cost: number | null;
  desired_price: number | null;
  status: string;
  quantity: number;
  notes: string | null;
  card: { name: string; number: string; image: string | null; set_id: string } | null;
}

export default async function StockSetPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const user = await requireUser();
  const { setId } = await params;
  const set = await getSet(setId);
  if (!set) notFound();

  const tracker = await getStockCardsTracker(user.id, setId);

  const supabase = await createClient();
  const { data: itemsData } = await supabase
    .from("stock_items")
    .select(
      "id, card_id, language, condition, finish, acquisition_cost, desired_price, status, quantity, notes, card:catalog_cards(name, number, image, set_id)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allItems = (itemsData ?? []) as unknown as StockRow[];
  const items = allItems.filter((it) => it.card?.set_id === setId);
  const totalQty = items.reduce((s, i) => s + (i.quantity ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={set.name}
        description={`${set.collection?.name ?? ""}${set.abbreviation ? ` · ${set.abbreviation}` : ""} · ${tracker.distinct}/${tracker.total} cartes en stock · ${formatNumber(totalQty)} exemplaires`}
        actions={
          <Link
            href={`/stock/${set.collection_id}`}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />Extensions
          </Link>
        }
      />
      {tracker.cards.length === 0 ? (
        <EmptyState
          title="Aucune carte"
          description="Cette extension ne contient pas encore de cartes au catalogue."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {tracker.cards.map((c) => {
            const inStock = c.inStockQuantity > 0;
            return (
              <div
                key={c.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-lg border bg-surface text-left transition-colors",
                  inStock ? "border-grass/70" : "border-line hover:border-brand",
                )}
              >
                <Link href={`/stock/carte/${c.id}`} className="block">
                  <div className="relative aspect-[63/88] overflow-hidden bg-surface-2">
                    <CardImage
                      src={c.image}
                      alt={c.name}
                      className={cn(
                        "h-full w-full transition-transform duration-200 group-hover:scale-105",
                        !inStock && "opacity-50 grayscale",
                      )}
                    />
                    <div className="absolute right-1 top-1 flex flex-col items-end gap-0.5">
                      {c.normalQty > 0 && (
                        <span className="rounded bg-zinc-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          ×{formatNumber(c.normalQty)}
                        </span>
                      )}
                      {c.reverseQty > 0 && (
                        <span className="rounded bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          ×{formatNumber(c.reverseQty)}
                        </span>
                      )}
                      {c.holoQty > 0 && (
                        <span className="rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          ×{formatNumber(c.holoQty)}
                        </span>
                      )}
                    </div>
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
                    <form key={f.key} action={quickAddStock} className="min-w-0 flex-1">
                      <input type="hidden" name="card_id" value={c.id} />
                      <input type="hidden" name="finish" value={f.finish} />
                      <button
                        type="submit"
                        title={`Ajouter au stock — ${f.finish}`}
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
          <h2 className="text-lg font-semibold text-ink">Mes articles en stock</h2>
          <Table
            headers={[
              "Carte",
              "Statut",
              "Langue",
              "État",
              "Finition",
              "Qté",
              "Prix",
              "Actions",
            ]}
          >
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-surface-2/40">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative aspect-[63/88] w-9 shrink-0 overflow-hidden rounded bg-surface-3">
                      {i.card?.image && (
                        <CardImage
                          src={i.card.image}
                          alt={i.card.name}
                          className="h-full w-full"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/stock/carte/${i.card_id}`}
                        className="block truncate font-medium text-ink transition-colors hover:text-brand"
                      >
                        {i.card?.name ?? "—"}
                      </Link>
                      <span className="text-xs text-muted">
                        {i.card ? `n°${i.card.number}` : ""}
                      </span>
                    </div>
                  </div>
                </Td>
                <Td>
                  <span
                    className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${stockStatusClass(i.status)}`}
                  >
                    {i.status}
                  </span>
                </Td>
                <Td>
                  <LanguageBadge code={i.language} />
                </Td>
                <Td className="text-muted">{i.condition}</Td>
                <Td className="text-muted">{i.finish}</Td>
                <Td className="tabular-nums">{i.quantity}</Td>
                <Td className="tabular-nums">
                  <div className="text-sm text-ink">
                    {formatCurrency(i.desired_price)}
                  </div>
                  {i.acquisition_cost != null && (
                    <div className="text-xs text-muted">
                      coût {formatCurrency(i.acquisition_cost)}
                    </div>
                  )}
                </Td>
                <Td>
                  <StockRowActions
                    item={{
                      id: i.id,
                      card_id: i.card_id,
                      language: i.language,
                      condition: i.condition,
                      finish: i.finish,
                      acquisition_cost: i.acquisition_cost,
                      desired_price: i.desired_price,
                      quantity: i.quantity,
                      status: i.status,
                      notes: i.notes,
                      cardLabel: i.card
                        ? `${i.card.name} n°${i.card.number}`
                        : undefined,
                    }}
                  />
                </Td>
              </tr>
            ))}
          </Table>
        </section>
      )}
    </div>
  );
}