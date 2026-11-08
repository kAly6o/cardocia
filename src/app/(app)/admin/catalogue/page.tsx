import Link from "next/link";
import { PageHeader } from "@/components/ui/StatCard";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { RarityBadge, TypeBadge } from "@/components/ui/Badge";
import { CollectionFormModal } from "@/components/admin/CollectionFormModal";
import { SetFormModal, type SetCollectionOption } from "@/components/admin/SetFormModal";
import { CardFormModal, type CardSetOption } from "@/components/admin/CardFormModal";
import { deleteCollection, deleteSet, deleteCard } from "@/lib/actions/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn, formatDate } from "@/lib/utils";

type Tab = "collections" | "sets" | "cards";

const TABS: { key: Tab; label: string }[] = [
  { key: "collections", label: "Collections" },
  { key: "sets", label: "Extensions" },
  { key: "cards", label: "Cartes" },
];

interface CollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}
interface SetRow {
  id: string;
  collection_id: string;
  name: string;
  release_date: string | null;
  card_count: number | null;
  collection: { name: string } | null;
}
interface CardRow {
  id: string;
  set_id: string;
  name: string;
  number: string;
  rarity: string | null;
  pokemon_type: string | null;
  image: string | null;
  description: string | null;
  external_id: string | null;
  illustrator: string | null;
  set: { name: string } | null;
}

export default async function AdminCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; collection?: string; q?: string; set?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab =
    sp.tab === "sets" || sp.tab === "cards" ? sp.tab : "collections";
  const supabase = createAdminClient();

  const { data: collectionsData } = await supabase
    .from("catalog_collections")
    .select("id, name, slug, description, sort_order")
    .order("sort_order")
    .order("name");
  const collections = (collectionsData ?? []) as CollectionRow[];

  let sets: SetRow[] = [];
  if (tab === "sets" || tab === "cards") {
    let req = supabase
      .from("catalog_sets")
      .select(
        "id, collection_id, name, release_date, card_count, collection:catalog_collections(name)",
      )
      .order("release_date", { ascending: true, nullsFirst: false })
      .order("name");
    if (sp.collection) req = req.eq("collection_id", sp.collection);
    const { data } = await req.limit(500);
    sets = (data ?? []) as unknown as SetRow[];
  }

  let cards: CardRow[] = [];
  if (tab === "cards") {
    let req = supabase
      .from("catalog_cards")
      .select(
        "id, set_id, name, number, rarity, pokemon_type, image, description, external_id, illustrator, set:catalog_sets(name)",
      )
      .order("number")
      .limit(200);
    if (sp.set) req = req.eq("set_id", sp.set);
    if (sp.q) req = req.ilike("name", `%${sp.q}%`);
    const { data } = await req;
    cards = (data ?? []) as unknown as CardRow[];
  }

  const setOptions: CardSetOption[] = sets.map((s) => ({
    id: s.id,
    label: s.collection ? `${s.name} — ${s.collection.name}` : s.name,
  }));
  const collectionOptions: SetCollectionOption[] = collections.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion du catalogue"
        description="Collections, extensions et cartes partagées par tous les utilisateurs."
        actions={<CollectionFormModal />}
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/catalogue?tab=${t.key}`}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand bg-brand text-white"
                : "border-line text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "collections" && (
        <div className="space-y-4">
          {collections.length === 0 ? (
            <EmptyState
              title="Aucune collection"
              description="Ajoutez une collection de cartes."
              action={<CollectionFormModal />}
            />
          ) : (
            <Table headers={["Nom", "Slug", "Ordre", "Description", "Actions"]}>
              {collections.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/40">
                  <Td className="font-medium text-ink">{c.name}</Td>
                  <Td className="text-muted">{c.slug}</Td>
                  <Td className="tabular-nums text-muted">{c.sort_order}</Td>
                  <Td className="text-muted">{c.description ?? "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <CollectionFormModal
                        item={{
                          id: c.id,
                          name: c.name,
                          slug: c.slug,
                          description: c.description,
                          logo: null,
                          sort_order: c.sort_order,
                        }}
                        trigger={<IconButton title="Modifier">✎</IconButton>}
                      />
                      <ConfirmForm action={deleteCollection} message="Supprimer cette collection et toutes ses extensions/cartes ?">
                        <input type="hidden" name="id" value={c.id} />
                        <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">🗑</IconButton>
                      </ConfirmForm>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
      {tab === "sets" && (
        <div className="space-y-4">
          <form method="get" className="panel-pad flex items-end gap-3">
            <input type="hidden" name="tab" value="sets" />
            <div className="flex-1">
              <label className="field-label">Filtrer par collection</label>
              <select name="collection" className="select" defaultValue={sp.collection ?? ""}>
                <option value="">Toutes</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong">Filtrer</button>
          </form>

          <div className="flex justify-end">
            <SetFormModal collections={collectionOptions} />
          </div>

          {sets.length === 0 ? (
            <EmptyState title="Aucune extension" description="Ajoutez une extension dans une collection." />
          ) : (
            <Table headers={["Nom", "Collection", "Sortie", "Cartes", "Actions"]}>
              {sets.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2/40">
                  <Td className="font-medium text-ink">{s.name}</Td>
                  <Td className="text-muted">{s.collection?.name ?? "—"}</Td>
                  <Td className="text-muted">{formatDate(s.release_date)}</Td>
                  <Td className="tabular-nums text-muted">{s.card_count ?? "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <SetFormModal
                        item={{
                          id: s.id,
                          collection_id: s.collection_id,
                          name: s.name,
                          original_name: null,
                          external_id: null,
                          symbol: null,
                          logo: null,
                          release_date: s.release_date,
                          card_count: s.card_count,
                        }}
                        collections={collectionOptions}
                        trigger={<IconButton title="Modifier">✎</IconButton>}
                      />
                      <ConfirmForm action={deleteSet} message="Supprimer cette extension et toutes ses cartes ?">
                        <input type="hidden" name="id" value={s.id} />
                        <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">🗑</IconButton>
                      </ConfirmForm>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
      {tab === "cards" && (
        <div className="space-y-4">
          <form method="get" className="panel-pad flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value="cards" />
            <div className="flex-1">
              <label className="field-label">Recherche</label>
              <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Nom de la carte…" />
            </div>
            <div className="flex-1">
              <label className="field-label">Extension</label>
              <select name="set" className="select" defaultValue={sp.set ?? ""}>
                <option value="">Toutes</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.collection ? `${s.name} — ${s.collection.name}` : s.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-strong">Filtrer</button>
          </form>

          <div className="flex justify-end">
            <CardFormModal sets={setOptions} />
          </div>

          {cards.length === 0 ? (
            <EmptyState title="Aucune carte" description="Aucune carte ne correspond aux filtres." />
          ) : (
            <Table headers={["Nom", "N°", "Extension", "Rareté", "Type", "Actions"]}>
              {cards.map((c) => (
                <tr key={c.id} className="hover:bg-surface-2/40">
                  <Td className="font-medium text-ink">{c.name}</Td>
                  <Td className="text-muted">{c.number}</Td>
                  <Td className="text-muted">{c.set?.name ?? "—"}</Td>
                  <Td><RarityBadge rarity={c.rarity} /></Td>
                  <Td><TypeBadge type={c.pokemon_type} /></Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <CardFormModal
                        item={{
                          id: c.id,
                          set_id: c.set_id,
                          name: c.name,
                          number: c.number,
                          external_id: c.external_id,
                          image: c.image,
                          rarity: c.rarity,
                          pokemon_type: c.pokemon_type,
                          illustrator: c.illustrator,
                          description: c.description,
                        }}
                        sets={setOptions}
                        trigger={<IconButton title="Modifier">✎</IconButton>}
                      />
                      <ConfirmForm action={deleteCard} message="Supprimer cette carte du catalogue ?">
                        <input type="hidden" name="id" value={c.id} />
                        <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">🗑</IconButton>
                      </ConfirmForm>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
