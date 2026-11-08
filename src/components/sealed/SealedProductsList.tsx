import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, IconButton } from "@/components/ui/Button";
import { Table, Td } from "@/components/ui/Table";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { SealedFormModal } from "@/components/sealed/SealedFormModal";
import { openProduct, deleteSealedProduct } from "@/lib/actions/sealed";
import { languageLabel } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  product_type: string;
  language: string;
  quantity: number;
  purchase_price: number | null;
  estimated_value: number | null;
  condition: string;
  set: { name: string } | null;
}

export async function SealedProductsList() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: products }, { data: sets }] = await Promise.all([
    supabase
      .from("sealed_products")
      .select("*, set:catalog_sets(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("catalog_sets").select("id, name").order("name").limit(1000),
  ]);

  const items = (products ?? []) as unknown as Row[];
  const setOptions = (sets ?? []) as { id: string; name: string }[];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SealedFormModal sets={setOptions} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun produit scellé"
          description="Ajoutez vos boosters, displays, ETB et autres produits scellés."
          action={<SealedFormModal sets={setOptions} />}
        />
      ) : (
        <Table headers={["Nom", "Type", "Extension", "Langue", "Qté", "Prix d'achat", "Valeur", "Actions"]}>
          {items.map((p) => (
            <tr key={p.id} className="hover:bg-surface-2/40">
              <Td className="font-medium text-ink">{p.name}</Td>
              <Td className="text-muted">{p.product_type}</Td>
              <Td className="text-muted">{p.set?.name ?? "—"}</Td>
              <Td>{languageLabel(p.language)}</Td>
              <Td className="tabular-nums">{p.quantity}</Td>
              <Td className="tabular-nums">{formatCurrency(p.purchase_price)}</Td>
              <Td className="tabular-nums">{formatCurrency(p.estimated_value)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  {p.quantity > 0 && (
                    <form action={openProduct} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="quantity" value={1} />
                      <IconButton type="submit" title="Ouvrir 1 unité">📦</IconButton>
                    </form>
                  )}
                  <ConfirmForm action={deleteSealedProduct} message="Supprimer ce produit scellé ?">
                    <input type="hidden" name="id" value={p.id} />
                    <IconButton type="submit" title="Supprimer" className="hover:bg-red-900/30 hover:text-red-300">🗑</IconButton>
                  </ConfirmForm>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}