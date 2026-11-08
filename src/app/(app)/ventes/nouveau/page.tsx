import Link from "next/link";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/StatCard";
import { SaleForm, type StockOption } from "@/components/sales/SaleForm";

export default async function NewSalePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: stock } = await supabase
    .from("stock_items")
    .select("id, quantity, acquisition_cost, card_id, card:catalog_cards(name, number, set:catalog_sets(name))")
    .eq("user_id", user.id)
    .eq("status", "Disponible")
    .order("created_at", { ascending: false });

  const stockOptions: StockOption[] = (
    (stock ?? []) as unknown as Array<{
      id: string;
      quantity: number;
      acquisition_cost: number | null;
      card_id: string | null;
      card: { name: string; number: string; set: { name: string } | null } | null;
    }>
  ).map((s) => ({
    id: s.id,
    cost: s.acquisition_cost,
    card_id: s.card_id,
    label: `${s.card?.name ?? "Carte"} — ${s.card?.set?.name ?? "?"} n°${s.card?.number ?? "?"} (${s.quantity})`,
  }));

  const { data: profile } = await supabase
    .from("profiles")
    .select("settings")
    .eq("id", user.id)
    .maybeSingle();
  const settings = (profile?.settings as Record<string, unknown> | null) ?? {};
  const platforms = Array.isArray(settings.platforms)
    ? (settings.platforms as string[])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouvelle vente"
        description="Associez les articles vendus depuis votre stock pour calculer la rentabilité."
        actions={
          <Link href="/ventes" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour aux ventes
          </Link>
        }
      />
      <SaleForm stockOptions={stockOptions} platforms={platforms} />
    </div>
  );
}
