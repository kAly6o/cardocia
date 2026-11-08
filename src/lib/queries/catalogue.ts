// Requêtes du catalogue (lecture, données partagées).

import { createClient } from "../supabase/server";
import type { CatalogCollection, CatalogSet, CatalogCard } from "../types";

export async function listCollections(): Promise<CatalogCollection[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_collections")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as CatalogCollection[];
}

export async function getCollection(
  id: string,
): Promise<CatalogCollection | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CatalogCollection) ?? null;
}

export async function listSets(
  collectionId: string,
): Promise<CatalogSet[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_sets")
    .select("*")
    .eq("collection_id", collectionId)
    .order("release_date", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });
  return (data ?? []) as CatalogSet[];
}

export async function getSet(id: string): Promise<CatalogSet | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_sets")
    .select("*, collection:catalog_collections(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as CatalogSet) ?? null;
}

export interface CardQuery {
  setId?: string;
  q?: string;
  rarity?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export async function listCards(
  query: CardQuery,
): Promise<{ cards: CatalogCard[]; count: number }> {
  const supabase = await createClient();
  const pageSize = query.pageSize ?? 24;
  const page = Math.max(1, query.page ?? 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let req = supabase
    .from("catalog_cards")
    .select("*, set:catalog_sets(name, collection_id)", { count: "exact" });

  if (query.setId) req = req.eq("set_id", query.setId);
  if (query.rarity) req = req.eq("rarity", query.rarity);
  if (query.type) req = req.eq("pokemon_type", query.type);
  if (query.q) req = req.ilike("name", `%${query.q}%`);

  req = req.order("number", { ascending: true }).range(from, to);

  const { data, count } = await req;
  return { cards: (data ?? []) as CatalogCard[], count: count ?? 0 };
}

export async function getCard(id: string): Promise<CatalogCard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_cards")
    .select(
      "*, set:catalog_sets(*, collection:catalog_collections(*))",
    )
    .eq("id", id)
    .maybeSingle();
  return (data as CatalogCard) ?? null;
}

/** Recherche rapide de cartes (utilisée par les sélecteurs de cartes). */
export async function searchCards(
  q: string,
  limit = 12,
): Promise<CatalogCard[]> {
  const supabase = await createClient();
  let req = supabase
    .from("catalog_cards")
    .select("*, set:catalog_sets(name)")
    .limit(limit);

  if (q.trim()) {
    req = req.or(`name.ilike.%${q}%,number.ilike.%${q}%`);
  }
  req = req.order("name", { ascending: true });

  const { data } = await req;
  return (data ?? []) as CatalogCard[];
}
