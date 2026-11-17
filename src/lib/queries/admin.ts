// Requêtes d'administration (données globales, lecture via service_role).

import { createAdminClient } from "../supabase/admin";
import { toNumber } from "../utils";
import type { SetFormItem } from "@/components/admin/SetFormModal";
import type { CollectionFormItem } from "@/components/admin/CollectionFormModal";
import type { CardFormItem } from "@/components/admin/CardFormModal";

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

// ---------------------------------------------------------------------------
// Santé du catalogue — diagnostic d'intégrité
// ---------------------------------------------------------------------------

export type CatalogHealthItem =
  | { kind: "set"; id: string; name: string; detail: string | null; edit: SetFormItem }
  | { kind: "collection"; id: string; name: string; detail: string | null; edit: CollectionFormItem }
  | { kind: "card"; id: string; name: string; detail: string | null; edit: CardFormItem }
  | { kind: "none"; id: string; name: string; detail: string | null; edit: null };

export type CatalogHealthSeverity = "error" | "warning" | "info";

export interface CatalogHealthCheck {
  key: string;
  label: string;
  description: string;
  severity: CatalogHealthSeverity;
  count: number;
  items: CatalogHealthItem[];
  href: string;
}

export interface CatalogHealth {
  setsTotal: number;
  cardsTotal: number;
  collectionsTotal: number;
  issuesTotal: number;
  errors: number;
  warnings: number;
  checks: CatalogHealthCheck[];
  collectionOptions: { id: string; name: string }[];
  setOptions: { id: string; label: string }[];
}

interface HealthSetRow {
  id: string;
  collection_id: string;
  name: string;
  abbreviation: string | null;
  original_name: string | null;
  external_id: string | null;
  symbol: string | null;
  logo: string | null;
  release_date: string | null;
  card_count: number | null;
  collection: { name: string } | null;
}

interface HealthCardRow {
  id: string;
  set_id: string;
  name: string;
  number: string;
  external_id: string | null;
  image: string | null;
  rarity: string | null;
  pokemon_type: string | null;
  illustrator: string | null;
  description: string | null;
  set: { name: string } | null;
}

interface HealthCollectionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  sort_order: number;
}

const catPath = (params: string) => `/admin/catalogue?${params}`;

/** Récupère tous les `set_id` par lots parallèles (limite de lignes PostgREST). */
async function fetchAllSetIds(
  supabase: ReturnType<typeof createAdminClient>,
  total: number,
): Promise<string[]> {
  const pageSize = 1000;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      supabase
        .from("catalog_cards")
        .select("set_id")
        .order("set_id")
        .range(i * pageSize, i * pageSize + pageSize - 1),
    ),
  );
  const ids: string[] = [];
  for (const res of results) {
    for (const row of (res.data ?? []) as Array<{ set_id: string | null }>) {
      if (row.set_id) ids.push(row.set_id);
    }
  }
  return ids;
}
export async function getCatalogHealth(): Promise<CatalogHealth> {
  const supabase = createAdminClient();

  const totalSets = supabase.from("catalog_sets").select("id", { count: "exact", head: true });
  const totalCards = supabase.from("catalog_cards").select("id", { count: "exact", head: true });
  const totalCols = supabase.from("catalog_collections").select("id", { count: "exact", head: true });

  const noAbbrCount = supabase.from("catalog_sets").select("id", { count: "exact", head: true }).is("abbreviation", null);
  const noLogoCount = supabase.from("catalog_sets").select("id", { count: "exact", head: true }).is("logo", null);
  const colNoLogoCount = supabase.from("catalog_collections").select("id", { count: "exact", head: true }).is("logo", null);
  const noImageCount = supabase.from("catalog_cards").select("id", { count: "exact", head: true }).is("image", null);
  const noNumberCount = supabase.from("catalog_cards").select("id", { count: "exact", head: true }).eq("number", "");
  const noRarityCount = supabase.from("catalog_cards").select("id", { count: "exact", head: true }).is("rarity", null);

  const SET_SAMPLE =
    "id, collection_id, name, abbreviation, original_name, external_id, symbol, logo, release_date, card_count, collection:catalog_collections(name)";
  const CARD_SAMPLE =
    "id, set_id, name, number, external_id, image, rarity, pokemon_type, illustrator, description, set:catalog_sets(name)";

  const noAbbrSample = supabase.from("catalog_sets").select(SET_SAMPLE).is("abbreviation", null).order("name").limit(10);
  const noLogoSample = supabase.from("catalog_sets").select(SET_SAMPLE).is("logo", null).order("name").limit(10);
  const colNoLogoSample = supabase.from("catalog_collections").select("id, name, slug, description, logo, sort_order").is("logo", null).order("name").limit(10);
  const noImageSample = supabase.from("catalog_cards").select(CARD_SAMPLE).is("image", null).order("name").limit(10);
  const noNumberSample = supabase.from("catalog_cards").select(CARD_SAMPLE).eq("number", "").order("name").limit(10);
  const noRaritySample = supabase.from("catalog_cards").select(CARD_SAMPLE).is("rarity", null).order("name").limit(10);
  const allSets = supabase.from("catalog_sets").select("id,name,card_count,collection:catalog_collections(name)").order("name");
  const collectionOptions = supabase.from("catalog_collections").select("id,name").order("name");
  const setOptions = supabase
    .from("catalog_sets")
    .select("id,name,collection:catalog_collections(name)")
    .order("name");

  const [
    setsTotalRes,
    cardsTotalRes,
    colsTotalRes,
    noAbbrCountRes,
    noLogoCountRes,
    colNoLogoCountRes,
    noImageCountRes,
    noNumberCountRes,
    noRarityCountRes,
    noAbbrSampleRes,
    noLogoSampleRes,
    colNoLogoSampleRes,
    noImageSampleRes,
    noNumberSampleRes,
    noRaritySampleRes,
    collectionOptionsRes,
    setOptionsRes,
    allSetsRes,
  ] = await Promise.all([
    totalSets,
    totalCards,
    totalCols,
    noAbbrCount,
    noLogoCount,
    colNoLogoCount,
    noImageCount,
    noNumberCount,
    noRarityCount,
    noAbbrSample,
    noLogoSample,
    colNoLogoSample,
    noImageSample,
    noNumberSample,
    noRaritySample,
    collectionOptions,
    setOptions,
    allSets,
  ]);

  const cardSetIds = await fetchAllSetIds(supabase, cardsTotalRes.count ?? 0);
  const withCards = new Set<string>();
  const countBySet = new Map<string, number>();
  for (const id of cardSetIds) {
    withCards.add(id);
    countBySet.set(id, (countBySet.get(id) ?? 0) + 1);
  }

  const sets = (allSetsRes.data ?? []) as unknown as Array<{
    id: string;
    name: string;
    card_count: number | null;
    collection: { name: string } | null;
  }>;
  const emptySets = sets.filter((s) => !withCards.has(s.id));
  const mismatchSets = sets
    .filter((s) => s.card_count != null && (countBySet.get(s.id) ?? 0) !== s.card_count)
    .map((s) => ({ ...s, imported: countBySet.get(s.id) ?? 0 }));

  const toSetItem = (r: HealthSetRow): CatalogHealthItem => ({
    kind: "set",
    id: r.id,
    name: r.name,
    detail: r.collection?.name ?? null,
    edit: {
      id: r.id,
      collection_id: r.collection_id,
      name: r.name,
      abbreviation: r.abbreviation,
      original_name: r.original_name,
      external_id: r.external_id,
      symbol: r.symbol,
      logo: r.logo,
      release_date: r.release_date,
      card_count: r.card_count,
    },
  });
  const toCollectionItem = (r: HealthCollectionRow): CatalogHealthItem => ({
    kind: "collection",
    id: r.id,
    name: r.name,
    detail: null,
    edit: {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      logo: r.logo,
      sort_order: r.sort_order,
    },
  });
  const toCardItem = (r: HealthCardRow): CatalogHealthItem => ({
    kind: "card",
    id: r.id,
    name: r.name,
    detail: r.set?.name ?? null,
    edit: {
      id: r.id,
      set_id: r.set_id,
      name: r.name,
      number: r.number,
      external_id: r.external_id,
      image: r.image,
      rarity: r.rarity,
      pokemon_type: r.pokemon_type,
      illustrator: r.illustrator,
      description: r.description,
    },
  });
  const toNoneItem = (r: { id: string; name: string; detail: string | null }): CatalogHealthItem => ({
    kind: "none",
    id: r.id,
    name: r.name,
    detail: r.detail,
    edit: null,
  });
const checks: CatalogHealthCheck[] = [
    {
      key: "empty-sets",
      label: "Extensions sans cartes",
      description: "Extensions présentes au catalogue mais sans aucune carte importée.",
      severity: "error",
      count: emptySets.length,
      items: emptySets
        .slice(0, 10)
        .map((s) => toNoneItem({ id: s.id, name: s.name, detail: s.collection?.name ?? null })),
      href: catPath("tab=sets"),
    },
    {
      key: "no-abbr",
      label: "Extensions sans abréviation",
      description: "Le code officiel (SSP, PAR…) manque et n'est pas affiché.",
      severity: "warning",
      count: noAbbrCountRes.count ?? 0,
      items: ((noAbbrSampleRes.data ?? []) as unknown as HealthSetRow[]).map(toSetItem),
      href: catPath("tab=sets&issue=no-abbr"),
    },
    {
      key: "no-logo",
      label: "Extensions sans logo",
      description: "Aucun logo renseigné (affichage générique).",
      severity: "info",
      count: noLogoCountRes.count ?? 0,
      items: ((noLogoSampleRes.data ?? []) as unknown as HealthSetRow[]).map(toSetItem),
      href: catPath("tab=sets&issue=no-logo"),
    },
    {
      key: "col-no-logo",
      label: "Collections sans logo",
      description: "Aucun logo renseigné pour la collection.",
      severity: "info",
      count: colNoLogoCountRes.count ?? 0,
      items: ((colNoLogoSampleRes.data ?? []) as unknown as HealthCollectionRow[]).map(
        toCollectionItem,
      ),
      href: catPath("tab=collections&issue=col-no-logo"),
    },
    {
      key: "card-count-mismatch",
      label: "Écart nombre officiel / importé",
      description: "Le nombre de cartes importées diffère du total officiel TCGdex (import peut être incomplet).",
      severity: "info",
      count: mismatchSets.length,
      items: mismatchSets.slice(0, 10).map((s) =>
        toNoneItem({
          id: s.id,
          name: s.name,
          detail: `${s.card_count} officiel · ${s.imported} importé`,
        }),
      ),
      href: catPath("tab=sets"),
    },
    {
      key: "no-image",
      label: "Cartes sans illustration",
      description: "Aucune image renseignée pour la carte.",
      severity: "warning",
      count: noImageCountRes.count ?? 0,
      items: ((noImageSampleRes.data ?? []) as unknown as HealthCardRow[]).map(toCardItem),
      href: catPath("tab=cards&issue=no-image"),
    },
    {
      key: "no-number",
      label: "Cartes sans numéro",
      description: "Le numéro de collection est vide.",
      severity: "error",
      count: noNumberCountRes.count ?? 0,
      items: ((noNumberSampleRes.data ?? []) as unknown as HealthCardRow[]).map(toCardItem),
      href: catPath("tab=cards&issue=no-number"),
    },
    {
      key: "no-rarity",
      label: "Cartes sans rareté",
      description: "Aucune rareté renseignée.",
      severity: "info",
      count: noRarityCountRes.count ?? 0,
      items: ((noRaritySampleRes.data ?? []) as unknown as HealthCardRow[]).map(toCardItem),
      href: catPath("tab=cards&issue=no-rarity"),
    },
  ];

  const errors = checks.filter((c) => c.severity === "error").reduce((s, c) => s + c.count, 0);
  const warnings = checks.filter((c) => c.severity === "warning").reduce((s, c) => s + c.count, 0);
  const issuesTotal = checks.reduce((s, c) => s + c.count, 0);

  return {
    setsTotal: setsTotalRes.count ?? 0,
    cardsTotal: cardsTotalRes.count ?? 0,
    collectionsTotal: colsTotalRes.count ?? 0,
    issuesTotal,
    errors,
    warnings,
    checks,
    collectionOptions: (collectionOptionsRes.data ?? []) as unknown as {
      id: string;
      name: string;
    }[],
    setOptions: (
      (setOptionsRes.data ?? []) as unknown as Array<{
        id: string;
        name: string;
        collection: { name: string } | null;
      }>
    ).map((s) => ({
      id: s.id,
      label: s.collection ? `${s.name} — ${s.collection.name}` : s.name,
    })),
  };
}
