// Requêtes d'administration (données globales, lecture via service_role).

import { createAdminClient } from "../supabase/admin";
import { toNumber } from "../utils";

export interface GlobalStats {
  users: number;
  admins: number;
  collections: number;
  sets: number;
  cards: number;
  collectionTotal: number;
  stockTotal: number;
  salesCount: number;
  salesRevenue: number;
  purchasesCount: number;
  purchasesSpend: number;
  topCards: { name: string; number: string; total: number }[];
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const supabase = createAdminClient();

  const [
    usersRes,
    adminsRes,
    collectionsRes,
    setsRes,
    cardsRes,
    collectionRes,
    stockRes,
    salesRes,
    salesCountRes,
    purchasesRes,
    purchasesCountRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true),
    supabase
      .from("catalog_collections")
      .select("id", { count: "exact", head: true }),
    supabase.from("catalog_sets").select("id", { count: "exact", head: true }),
    supabase.from("catalog_cards").select("id", { count: "exact", head: true }),
    supabase
      .from("collection_items")
      .select("quantity, card:catalog_cards(name, number)"),
    supabase
      .from("stock_items")
      .select("quantity, card:catalog_cards(name, number)"),
    supabase.from("sales").select("amount_received"),
    supabase.from("sales").select("id", { count: "exact", head: true }),
    supabase.from("purchases").select("total"),
    supabase.from("purchases").select("id", { count: "exact", head: true }),
  ]);

  const collection = (collectionRes.data ?? []) as unknown as Array<{
    quantity: number;
    card: { name: string; number: string } | null;
  }>;
  const stock = (stockRes.data ?? []) as unknown as Array<{
    quantity: number;
    card: { name: string; number: string } | null;
  }>;

  let collectionTotal = 0;
  let stockTotal = 0;
  const topMap = new Map<string, { name: string; number: string; total: number }>();

  for (const it of collection) {
    collectionTotal += it.quantity ?? 0;
    addTop(topMap, it);
  }
  for (const it of stock) {
    stockTotal += it.quantity ?? 0;
    addTop(topMap, it);
  }

  const topCards = [...topMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const sales = (salesRes.data ?? []) as unknown as Array<{
    amount_received: number | string | null;
  }>;
  const purchases = (purchasesRes.data ?? []) as unknown as Array<{
    total: number | string | null;
  }>;

  return {
    users: usersRes.count ?? 0,
    admins: adminsRes.count ?? 0,
    collections: collectionsRes.count ?? 0,
    sets: setsRes.count ?? 0,
    cards: cardsRes.count ?? 0,
    collectionTotal,
    stockTotal,
    salesCount: salesCountRes.count ?? 0,
    salesRevenue: sales.reduce((s, x) => s + (toNumber(x.amount_received) ?? 0), 0),
    purchasesCount: purchasesCountRes.count ?? 0,
    purchasesSpend: purchases.reduce((s, x) => s + (toNumber(x.total) ?? 0), 0),
    topCards,
  };
}

function addTop(
  map: Map<string, { name: string; number: string; total: number }>,
  it: { quantity: number; card: { name: string; number: string } | null },
): void {
  const name = it.card?.name ?? "Carte (lien rompu)";
  const number = it.card?.number ?? "";
  const key = `${name}::${number}`;
  const existing = map.get(key);
  if (existing) {
    existing.total += it.quantity ?? 0;
  } else {
    map.set(key, { name, number, total: it.quantity ?? 0 });
  }
}
