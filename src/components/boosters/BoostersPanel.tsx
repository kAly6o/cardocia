import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Table, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { RecipeFormModal } from "@/components/boosters/RecipeFormModal";
import { deleteRecipe, createBooster, deleteBooster, adjustBoosterSleeve } from "@/lib/actions/boosters";
import type { CompositionRule } from "@/lib/compose";
import { formatCurrency } from "@/lib/utils";

export async function BoostersPanel() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: recipes }, { data: boosters }, { data: sleevesData }, { data: setsData }] = await Promise.all([
    supabase.from("booster_recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("booster_products").select("*, set:catalog_sets(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("booster_sleeves").select("id, set_id, quantity, set:catalog_sets(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("catalog_sets").select("id, name").order("release_date", { ascending: true, nullsFirst: false }).order("name"),
  ]);

  const recipeList = (recipes ?? []) as Array<{
    id: string;
    name: string;
    language: string;
    card_count: number | null;
    desired_price: number | null;
    description: string | null;
    quotas: CompositionRule | null;
  }>;
  const boosterList = (boosters ?? []) as unknown as Array<{
    id: string;
    name: string;
    production_cost: number | null;
    desired_price: number | null;
    status: string;
    set: { name: string } | null;
  }>;
  const sleeves = (sleevesData ?? []) as unknown as Array<{
    id: string;
    set_id: string;
    quantity: number;
    set: { name: string } | null;
  }>;
  const allSets = (setsData ?? []) as Array<{ id: string; name: string }>;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Emballages par série</h2>
        <form action={adjustBoosterSleeve} className="panel-pad flex flex-wrap items-end gap-2">
          <div className="min-w-[220px] flex-1">
            <label className="field-label">Série</label>
            <select className="select" name="set_id" required defaultValue="">
              <option value="" disabled>Choisir une série…</option>
              {allSets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="field-label">Quantité</label>
            <input className="input" name="delta" type="number" min={1} defaultValue={1} />
          </div>
          <button type="submit" className={buttonVariants("primary")}>Ajouter</button>
        </form>

        {sleeves.length === 0 ? (
          <EmptyState
            title="Aucun emballage"
            description="Ajoutez le nombre d'emballages vides que vous possédez pour chaque série."
          />
        ) : (
          <Table headers={["Série", "Emballages", "Actions"]}>
            {sleeves.map((s) => (
              <tr key={s.id} className="hover:bg-surface-2/40">
                <Td className="font-medium text-ink">{s.set?.name ?? "—"}</Td>
                <Td className="tabular-nums">×{s.quantity}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <form action={adjustBoosterSleeve}>
                      <input type="hidden" name="set_id" value={s.set_id} />
                      <input type="hidden" name="delta" value="-1" />
                      <IconButton type="submit" title="Retirer un emballage">−</IconButton>
                    </form>
                    <form action={adjustBoosterSleeve}>
                      <input type="hidden" name="set_id" value={s.set_id} />
                      <input type="hidden" name="delta" value="1" />
                      <IconButton type="submit" title="Ajouter un emballage">+</IconButton>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Recettes</h2>
          <RecipeFormModal />
        </div>
        {recipeList.length === 0 ? (
          <EmptyState
            title="Aucune recette"
            description="Créez une recette pour définir la composition type d'un booster."
            action={<RecipeFormModal />}
          />
        ) : (
          <Table headers={["Nom", "Langue", "Cartes", "Prix souhaité", "Quotas", "Actions"]}>
            {recipeList.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2/40">
                <Td className="font-medium text-ink">{r.name}</Td>
                <Td className="text-muted">{r.language}</Td>
                <Td className="tabular-nums">{r.card_count ?? "—"}</Td>
                <Td className="tabular-nums">{formatCurrency(r.desired_price)}</Td>
                <Td className="max-w-[220px] truncate text-xs text-muted">
                  {r.quotas?.slots?.length
                    ? r.quotas.slots
                        .map((s) => `${s.count}×${s.rarity ?? "?"}${s.finish ? " " + s.finish : ""}`)
                        .join(" · ")
                    : "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <RecipeFormModal
                      item={{
                        id: r.id,
                        name: r.name,
                        language: r.language,
                        desired_price: r.desired_price,
                        description: r.description,
                        quotas: r.quotas,
                      }}
                      trigger={<IconButton title="Modifier">✎</IconButton>}
                    />
                    <ConfirmForm action={deleteRecipe} message="Supprimer cette recette ?">
                      <input type="hidden" name="id" value={r.id} />
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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Boosters fabriqués</h2>
        <form action={createBooster} className="panel-pad grid gap-3 sm:grid-cols-5">
          <div>
            <label className="field-label">Nom</label>
            <input className="input" name="name" placeholder="Booster n°1" />
          </div>
          <div>
            <label className="field-label">Recette (optionnel)</label>
            <select className="select" name="recipe_id" defaultValue="">
              <option value="">Aucune</option>
              {recipeList.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Emballage (série)</label>
            <select className="select" name="set_id" defaultValue="">
              <option value="">Aucun</option>
              {sleeves.map((s) => (
                <option key={s.set_id} value={s.set_id}>
                  {s.set?.name ?? "Série"} (×{s.quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Prix souhaité</label>
            <input className="input" name="desired_price" type="number" step="0.01" inputMode="decimal" placeholder="0.00" />
          </div>
          <div className="flex items-end">
            <button type="submit" className={buttonVariants("primary")}>
              Fabriquer un booster
            </button>
          </div>
        </form>

        {boosterList.length === 0 ? (
          <EmptyState title="Aucun booster" description="Fabriquez votre premier booster à partir du stock disponible." />
        ) : (
          <Table headers={["Nom", "Coût de fabrication", "Prix souhaité", "Statut", "Actions"]}>
            {boosterList.map((b) => (
              <tr key={b.id} className="hover:bg-surface-2/40">
                <Td>
                  <Link href={`/boosters/${b.id}`} className="font-medium text-ink hover:text-fire">
                    {b.name}
                  </Link>
                  {b.set ? <p className="text-xs text-muted">{b.set.name}</p> : null}
                </Td>
                <Td className="tabular-nums">{formatCurrency(b.production_cost)}</Td>
                <Td className="tabular-nums font-medium">{formatCurrency(b.desired_price)}</Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Link href={`/boosters/${b.id}`}>
                      <IconButton title="Composer">→</IconButton>
                    </Link>
                    <ConfirmForm action={deleteBooster} message="Supprimer ce booster ? Les cartes seront libérées.">
                      <input type="hidden" name="id" value={b.id} />
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
      </section>
    </div>
  );
}