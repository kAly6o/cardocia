import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { IconButton } from "@/components/ui/Button";
import { CardImage } from "@/components/cards/CardImage";
import { RarityBadge, TypeBadge, LanguageBadge } from "@/components/ui/Badge";
import { Table, Td } from "@/components/ui/Table";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { CollectionFormModal } from "@/components/collection/CollectionFormModal";
import { transferToStock, deleteCollectionItem } from "@/lib/actions/collection";
import { getCard } from "@/lib/queries/catalogue";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { formatCurrency } from "@/lib/utils";

interface ItemRow {
  id: string;
  language: string;
  condition: string;
  finish: string;
  quantity: number;
  acquisition_cost: number | null;
  estimated_value: number | null;
  acquisition_date: string | null;
  notes: string | null;
  location: string | null;
}

export default async function CollectionCardPage({
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
    .from("collection_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId);
  const items = (itemsData ?? []) as unknown as ItemRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={card.name}
        description={`${card.set?.name ?? "—"} · n°${card.number}`}
        actions={
          <Link
            href={`/collection/set/${card.set_id}`}
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            ← Extension
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

          <CollectionFormModal
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
                Ajouter à ma collection
              </button>
            }
          />
        </div>
      </div>

      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Mes exemplaires de cette carte</h2>
          <Table
            headers={["Langue", "État", "Finition", "Qté", "Coût", "Emplacement", "Actions"]}
          >
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-surface-2/40">
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
                        card_id: cardId,
                        language: i.language,
                        condition: i.condition,
                        finish: i.finish,
                        quantity: i.quantity,
                        acquisition_cost: i.acquisition_cost,
                        estimated_value: i.estimated_value,
                        acquisition_date: i.acquisition_date,
                        notes: i.notes,
                        location: i.location,
                        cardLabel: `${card.name} n°${card.number}`,
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