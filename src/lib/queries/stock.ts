// Requêtes du stock à vendre (articles et agrégations par collection/extension).

import { createClient } from "../supabase/server";

export interface StockCollection {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  setCount: number;
  inStockDistinct: number;
  inStockQuantity: number;
}

export interface StockCollectionOverview {
  collections: StockCollection[];
  totalStockItems: number;
  available: number;
}

export async function getStockCollectionTracker(
  userId: string,
): Promise<StockCollectionOverview> {
  const supabase = await createClient();

  const [collectionsRes, setsRes, itemsRes] = await Promise.all([
    supabase
      .from("catalog_collections")
      .select("id, name, slug, logo")
      .order("sort_order")
      .order("name"),
    supabase.from("catalog_sets").select("id, collection_id"),
    supabase
      .from("stock_items")
      .select("card_id, quantity, status, card:catalog_cards(set_id)")
      .eq("user_id", userId),
  ]);

  const collections = (collectionsRes.data ?? []) as {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  }[];
  const sets = (setsRes.data ?? []) as {
    id: string;
    collection_id: string;
  }[];
  const items = (itemsRes.data ?? []) as unknown as {
    card_id: string;
    quantity: number;
    status: string;
    card: { set_id: string } | null;
  }[];

  const collectionBySet = new Map<string, string>();
  for (const s of sets) collectionBySet.set(s.id, s.collection_id);

  const agg = new Map<string, { distinct: Set<string>; quantity: number }>();
  let totalStockItems = 0;
  let available = 0;
  for (const it of items) {
    const qty = it.quantity ?? 0;
    totalStockItems += qty;
    if (it.status === "Disponible") available += qty;
    const setId = it.card?.set_id;
    if (!setId) continue;
    const collId = collectionBySet.get(setId);
    if (!collId) continue;
    const e = agg.get(collId) ?? { distinct: new Set<string>(), quantity: 0 };
    e.distinct.add(it.card_id);
    e.quantity += qty;
    agg.set(collId, e);
  }

  const collectionsOut = collections.map((c) => {
    const a = agg.get(c.id);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      setCount: sets.filter((s) => s.collection_id === c.id).length,
      inStockDistinct: a?.distinct.size ?? 0,
      inStockQuantity: a?.quantity ?? 0,
    };
  });

  return { collections: collectionsOut, totalStockItems, available };
}

export interface StockSet {
  id: string;
  name: string;
  abbreviation: string | null;
  logo: string | null;
  card_count: number | null;
  inStockDistinct: number;
  inStockQuantity: number;
}

export async function getStockSetTracker(
  userId: string,
  collectionId: string,
): Promise<StockSet[]> {
  const supabase = await createClient();

  const [setsRes, itemsRes] = await Promise.all([
    supabase
      .from("catalog_sets")
      .select("id, name, logo, card_count, abbreviation")
      .eq("collection_id", collectionId)
      .order("release_date", { ascending: true, nullsFirst: false })
      .order("name"),
    supabase
      .from("stock_items")
      .select("card_id, quantity, card:catalog_cards(set_id)")
      .eq("user_id", userId),
  ]);

  const sets = (setsRes.data ?? []) as {
    id: string;
    name: string;
    abbreviation: string | null;
    logo: string | null;
    card_count: number | null;
  }[];
  const setIds = new Set(sets.map((s) => s.id));
  const items = (itemsRes.data ?? []) as unknown as {
    card_id: string;
    quantity: number;
    card: { set_id: string } | null;
  }[];

  const agg = new Map<string, { distinct: Set<string>; quantity: number }>();
  for (const it of items) {
    const setId = it.card?.set_id;
    if (!setId || !setIds.has(setId)) continue;
    const e = agg.get(setId) ?? { distinct: new Set<string>(), quantity: 0 };
    e.distinct.add(it.card_id);
    e.quantity += it.quantity ?? 0;
    agg.set(setId, e);
  }

  return sets.map((s) => {
    const a = agg.get(s.id);
    return {
      id: s.id,
      name: s.name,
      abbreviation: s.abbreviation,
      logo: s.logo,
      card_count: s.card_count,
      inStockDistinct: a?.distinct.size ?? 0,
      inStockQuantity: a?.quantity ?? 0,
    };
  });
}

export interface StockCard {
  id: string;
  name: string;
  number: string;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
  variants: { normal?: boolean; reverse?: boolean; holo?: boolean } | null;
  inStockQuantity: number;
  normalQty: number;
  reverseQty: number;
  holoQty: number;
}

export async function getStockCardsTracker(
  userId: string,
  setId: string,
): Promise<{ cards: StockCard[]; distinct: number; total: number }> {
  const supabase = await createClient();

  const [cardsRes, itemsRes] = await Promise.all([
    supabase
      .from("catalog_cards")
      .select("id, name, number, image, rarity, pokemon_type, variants")
      .eq("set_id", setId)
      .limit(1000),
    supabase
      .from("stock_items")
      .select("card_id, quantity, finish, card:catalog_cards(set_id)")
      .eq("user_id", userId),
  ]);

  const cards = (cardsRes.data ?? []) as unknown as {
    id: string;
    name: string;
    number: string;
    image: string | null;
    rarity: string | null;
    pokemon_type: string | null;
    variants: { normal?: boolean; reverse?: boolean; holo?: boolean } | null;
  }[];
  const items = (itemsRes.data ?? []) as unknown as {
    card_id: string;
    quantity: number;
    finish: string;
    card: { set_id: string } | null;
  }[];

  const agg = new Map<
    string,
    { total: number; normal: number; reverse: number; holo: number }
  >();
  for (const it of items) {
    if (it.card?.set_id !== setId) continue;
    const e = agg.get(it.card_id) ?? { total: 0, normal: 0, reverse: 0, holo: 0 };
    const qty = it.quantity ?? 0;
    e.total += qty;
    if (it.finish === "Normale") e.normal += qty;
    else if (it.finish === "Reverse") e.reverse += qty;
    else if (it.finish === "Holographique" || it.finish === "Holo spéciale") e.holo += qty;
    agg.set(it.card_id, e);
  }

  const cardsOut = cards
    .slice()
    .sort((a, b) => a.number.localeCompare(b.number, "fr", { numeric: true }))
    .map((c) => {
      const a = agg.get(c.id);
      return {
        ...c,
        inStockQuantity: a?.total ?? 0,
        normalQty: a?.normal ?? 0,
        reverseQty: a?.reverse ?? 0,
        holoQty: a?.holo ?? 0,
      };
    });

  const distinct = cardsOut.filter((c) => c.inStockQuantity > 0).length;
  return { cards: cardsOut, distinct, total: cardsOut.length };
}