import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { Field, Input, Select } from "@/components/ui/Form";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { CardPicker } from "@/components/cards/CardPicker";
import { addOpeningLine } from "@/lib/actions/sealed";
import { LANGUAGES, CONDITIONS, FINISHES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function OpeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: opening } = await supabase
    .from("product_openings")
    .select("*, sealed_product:sealed_products(name)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!opening) notFound();

  const { data: lines } = await supabase
    .from("product_opening_lines")
    .select("*, card:catalog_cards(name, number)")
    .eq("opening_id", id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ouverture de produit"
        description={`${opening.sealed_product?.name ?? "Produit"} · ${formatDate(opening.opened_at)} · ${opening.quantity_opened} unité(s)`}
        actions={
          <Link href="/collection?tab=sealed" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux produits
          </Link>
        }
      />

      {opening.allocated_cost != null && (
        <p className="text-sm text-muted">
          Coût réparti :{" "}
          <span className="font-semibold text-ink">{formatCurrency(opening.allocated_cost)}</span>
        </p>
      )}

      <section className="panel-pad">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Ajouter les cartes réellement obtenues
        </h2>
        <form action={addOpeningLine} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="opening_id" value={opening.id} />
          <div className="sm:col-span-2">
            <Field label="Carte">
              <CardPicker name="card_id" />
            </Field>
          </div>
          <Field label="Destination">
            <Select name="destination" defaultValue="collection">
              <option value="collection">Ma collection</option>
              <option value="stock">Stock à vendre</option>
            </Select>
          </Field>
          <Field label="Quantité">
            <Input name="quantity" type="number" min={1} defaultValue={1} />
          </Field>
          <Field label="Langue">
            <Select name="language" defaultValue="FR">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="État">
            <Select name="condition" defaultValue="Near Mint">
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Finition">
            <Select name="finish" defaultValue="Normale">
              {FINISHES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <button type="submit" className={buttonVariants("primary")}>
              Ajouter la carte
            </button>
          </div>
        </form>
      </section>

      <section className="panel-pad">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Cartes obtenues
        </h2>
        {(lines ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Aucune carte ajoutée. Seules les cartes confirmées sont enregistrées.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {(lines ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-ink">{l.card?.name ?? "—"}</span>
                <span className="text-xs text-muted">
                  n°{l.card?.number ?? "?"} · ×{l.quantity} · {l.destination}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
