import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { CardImage } from "@/components/cards/CardImage";
import { RarityBadge, TypeBadge, LanguageBadge } from "@/components/ui/Badge";
import { Table, Td } from "@/components/ui/Table";
import { StockRowActions } from "@/components/stock/StockRowActions";
import { StockFormModal } from "@/components/stock/StockFormModal";
import { getCard } from "@/lib/queries/catalogue";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { formatCurrency } from "@/lib/utils";
import { stockStatusClass } from "@/lib/colors";
import { ArrowLeft } from "lucide-react";

interface StockRow {
  id: string;
  language: string;
  condition: string;
  finish: string;
  quantity: number;
  acquisition_cost: number | null;
  desired_price: number | null;
  status: string;
  notes: string | null;
}

export default async function StockCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const user = await requireUser();
  const { cardId } = await params;
  const card = await getCard(cardId);
  if (!card) notFound();

  const supabase = await createClient();
  const { data: itemsData } = await supabase
    .from("stock_items")
    .select(
      "id, language, condition, finish, quantity, acquisition_cost, desired_price, status, notes",
    )
    .eq("user_id", user.id)
    .eq("card_id", cardId);
  const items = (itemsData ?? []) as unknown as StockRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={card.name}
        description={`${card.set?.name ?? "—"} · n°${card.number}`}
        actions={
          <Link
            href={`/stock/set/${card.set_id}`}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />Extension
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="aspect-[63/88] overflow-hidden rounded-xl border border-line bg-surface-2">
          <CardImage src={card.image} alt={card.name} className="h-full w-full" />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {card.rarity && <RarityBadge rarity={card.rarity} />}
            {card.pokemon_type && <TypeBadge type={card.pokemon_type} />}
          </div>

          {card.illustrator && (
            <p className="text-sm text-muted">Illustrateur : {card.illustrator}</p>
          )}

          {card.description && (
            <div className="panel-pad">
              <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
                Description
              </h2>
              <p className="text-sm text-ink">{card.description}</p>
            </div>
          )}

          <StockFormModal
            initialCard={{
              id: card.id,
              name: card.name,
              number: card.number,
              image: card.image,
              rarity: card.rarity,
              pokemon_type: card.pokemon_type,
            }}
            trigger={
              <button type="button" className={buttonVariants("primary")}>
                Ajouter au stock
              </button>
            }
          />
        </div>
      </div>

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">
            Mes articles en stock de cette carte
          </h2>
          <Table
            headers={[
              "Statut",
              "Langue",
              "État",
              "Finition",
              "Qté",
              "Coût",
              "Prix",
              "Actions",
            ]}
          >
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-surface-2/40">
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
                <Td className="tabular-nums">{formatCurrency(i.acquisition_cost)}</Td>
                <Td className="tabular-nums">{formatCurrency(i.desired_price)}</Td>
                <Td>
                  <StockRowActions
                    item={{
                      id: i.id,
                      card_id: cardId,
                      language: i.language,
                      condition: i.condition,
                      finish: i.finish,
                      acquisition_cost: i.acquisition_cost,
                      desired_price: i.desired_price,
                      quantity: i.quantity,
                      status: i.status,
                      notes: i.notes,
                      cardLabel: `${card.name} n°${card.number}`,
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