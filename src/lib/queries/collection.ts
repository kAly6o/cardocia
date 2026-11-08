// Requêtes du "collection tracker" (suivi de progression).

import { createClient } from "../supabase/server";

export interface TrackedCollection {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  setCount: number;
  ownedDistinct: number;
  totalCards: number;
  percent: number;
}

export interface CollectionOverview {
  collections: TrackedCollection[];
  ownedDistinct: number;
  totalCards: number;
  percent: number;
}

export async function getCollectionTracker(
  userId: string,
): Promise<CollectionOverview> {
  const supabase = await createClient();

  const [collectionsRes, setsRes, itemsRes] = await Promise.all([
    supabase
      .from("catalog_collections")
      .select("id, name, slug, logo")
      .order("sort_order")
      .order("name"),
    supabase.from("catalog_sets").select("id, collection_id, card_count"),
    supabase
      .from("collection_items")
      .select("card_id, quantity, card:catalog_cards(set_id)")
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
    card_count: number | null;
  }[];
  const items = (itemsRes.data ?? []) as unknown as {
    card_id: string;
    quantity: number;
    card: { set_id: string } | null;
  }[];

  const ownedBySet = new Map<string, Set<string>>();
  for (const it of items) {
    const setId = it.card?.set_id;
    if (!setId) continue;
    const s = ownedBySet.get(setId) ?? new Set<string>();
    s.add(it.card_id);
    ownedBySet.set(setId, s);
  }

  const totalBySet = new Map<string, number>();
  for (const s of sets) totalBySet.set(s.id, s.card_count ?? 0);

  let ownedDistinct = 0;
  let totalCards = 0;

  const collectionsOut = collections.map((c) => {
    const cSets = sets.filter((s) => s.collection_id === c.id);
    let owned = 0;
    let total = 0;
    for (const s of cSets) {
      total += totalBySet.get(s.id) ?? 0;
      owned += ownedBySet.get(s.id)?.size ?? 0;
    }
    ownedDistinct += owned;
    totalCards += total;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      setCount: cSets.length,
      ownedDistinct: owned,
      totalCards: total,
      percent: total > 0 ? Math.round((owned / total) * 100) : 0,
    };
  });

  return {
    collections: collectionsOut,
    ownedDistinct,
    totalCards,
    percent: totalCards > 0 ? Math.round((ownedDistinct / totalCards) * 100) : 0,
  };
}

export interface TrackedSet {
  id: string;
  name: string;
  logo: string | null;
  card_count: number | null;
  ownedDistinct: number;
  ownedQuantity: number;
  percent: number;
  tracked: boolean;
}

export async function getSetTracker(
  userId: string,
  collectionId: string,
): Promise<TrackedSet[]> {
  const supabase = await createClient();

  const [setsRes, itemsRes, trackedRes] = await Promise.all([
    supabase
      .from("catalog_sets")
      .select("id, name, logo, card_count")
      .eq("collection_id", collectionId)
      .order("release_date", { ascending: true, nullsFirst: false })
      .order("name"),
    supabase
      .from("collection_items")
      .select("card_id, quantity, card:catalog_cards(set_id)")
      .eq("user_id", userId),
    supabase.from("tracked_sets").select("set_id").eq("user_id", userId),
  ]);

  const sets = (setsRes.data ?? []) as {
    id: string;
    name: string;
    logo: string | null;
    card_count: number | null;
  }[];
  const items = (itemsRes.data ?? []) as unknown as {
    card_id: string;
    quantity: number;
    card: { set_id: string } | null;
  }[];
  const tracked = new Set(
    ((trackedRes.data ?? []) as { set_id: string }[]).map((t) => t.set_id),
  );

  const ownedBySet = new Map<string, { distinct: Set<string>; quantity: number }>();
  for (const it of items) {
    const setId = it.card?.set_id;
    if (!setId) continue;
    const e = ownedBySet.get(setId) ?? { distinct: new Set<string>(), quantity: 0 };
    e.distinct.add(it.card_id);
    e.quantity += it.quantity ?? 0;
    ownedBySet.set(setId, e);
  }

  return sets.map((s) => {
    const owned = ownedBySet.get(s.id);
    const distinct = owned?.distinct.size ?? 0;
    const total = s.card_count ?? 0;
    return {
      id: s.id,
      name: s.name,
      logo: s.logo,
      card_count: s.card_count,
      ownedDistinct: distinct,
      ownedQuantity: owned?.quantity ?? 0,
      percent: total > 0 ? Math.round((distinct / total) * 100) : 0,
      tracked: tracked.has(s.id),
    };
  });
}

export interface TrackedCard {
  id: string;
  name: string;
  number: string;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
  variants: { normal?: boolean; reverse?: boolean; holo?: boolean } | null;
  ownedQuantity: number;
  ownedDistinct: number;
}

export async function getSetCardsTracker(
  userId: string,
  setId: string,
): Promise<{
  cards: TrackedCard[];
  ownedDistinct: number;
  total: number;
  percent: number;
}> {
  const supabase = await createClient();

  const [cardsRes, itemsRes] = await Promise.all([
    supabase
      .from("catalog_cards")
      .select("id, name, number, image, rarity, pokemon_type, variants")
      .eq("set_id", setId)
      .limit(1000),
    supabase
      .from("collection_items")
      .select("card_id, quantity, card:catalog_cards(set_id)")
      .eq("user_id", userId)
      .eq("card.set_id", setId),
  ]);

  const cards = (cardsRes.data ?? []) as {
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
  }[];

  const owned = new Map<string, { distinct: number; quantity: number }>();
  for (const it of items) {
    const e = owned.get(it.card_id) ?? { distinct: 0, quantity: 0 };
    e.distinct += 1;
    e.quantity += it.quantity ?? 0;
    owned.set(it.card_id, e);
  }

  const cardsOut = cards
    .slice()
    .sort((a, b) => a.number.localeCompare(b.number, "fr", { numeric: true }))
    .map((c) => {
      const o = owned.get(c.id);
      return {
        id: c.id,
        name: c.name,
        number: c.number,
        image: c.image,
        rarity: c.rarity,
        pokemon_type: c.pokemon_type,
        variants: c.variants,
        ownedQuantity: o?.quantity ?? 0,
        ownedDistinct: o?.distinct ?? 0,
      };
    });

  const ownedDistinct = cardsOut.filter((c) => c.ownedDistinct > 0).length;
  const total = cardsOut.length;
  return {
    cards: cardsOut,
    ownedDistinct,
    total,
    percent: total > 0 ? Math.round((ownedDistinct / total) * 100) : 0,
  };
}

