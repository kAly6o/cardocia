// Agrégations pour le tableau de bord et les statistiques.
// Toutes les valeurs proviennent des données réelles de l'utilisateur.

import { createClient } from "./supabase/server";
import { toNumber, round2 } from "./utils";
import type { MonthlyDatum, Datum } from "@/components/charts";

type Money = number | string | null | undefined;

function monthKey(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MovementWithCard {
  id: string;
  type: string;
  quantity: number;
  created_at: string;
  notes: string | null;
  card_name: string | null;
}

export interface DashboardStats {
  totalOwned: number;
  distinctCards: number;
  collectionCount: number;
  availableForSale: number;
  reservedCount: number;
  sealedCount: number;
  collectionValue: number;
  stockValue: number;
  totalPurchases: number;
  totalSales: number;
  profit: number;
  monthly: MonthlyDatum[];
  split: Datum[];
  rarity: Datum[];
  recentMovements: MovementWithCard[];
}

const RARITY_COLORS = [
  "#9ca3af",
  "#34d399",
  "#38bdf8",
  "#818cf8",
  "#22d3ee",
  "#e879f9",
  "#fbbf24",
  "#facc15",
  "#fb7185",
  "#fb923c",
  "#a78bfa",
];

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    collectionRes,
    stockRes,
    purchasesRes,
    salesRes,
    sealedRes,
    movementsRes,
  ] = await Promise.all([
    supabase
      .from("collection_items")
      .select("quantity, acquisition_cost, estimated_value, card_id, card:catalog_cards(rarity)")
      .eq("user_id", userId),
    supabase
      .from("stock_items")
      .select("quantity, status, estimated_value, acquisition_cost, card_id, card:catalog_cards(rarity)")
      .eq("user_id", userId),
    supabase.from("purchases").select("purchase_date, total, currency").eq("user_id", userId),
    supabase.from("sales").select("sale_date, amount_received, profit, currency").eq("user_id", userId),
    supabase.from("sealed_products").select("quantity").eq("user_id", userId),
    supabase
      .from("stock_movements")
      .select("id, type, quantity, created_at, notes, card:catalog_cards(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const collection = (collectionRes.data ?? []) as unknown as Array<{
    quantity: number;
    acquisition_cost: Money;
    estimated_value: Money;
    card_id: string;
    card: { rarity: string | null } | null;
  }>;
  const stock = (stockRes.data ?? []) as unknown as Array<{
    quantity: number;
    status: string;
    estimated_value: Money;
    acquisition_cost: Money;
    card_id: string | null;
    card: { rarity: string | null } | null;
  }>;
  const purchases = (purchasesRes.data ?? []) as Array<{
    purchase_date: string;
    total: Money;
    currency: string;
  }>;
  const sales = (salesRes.data ?? []) as Array<{
    sale_date: string;
    amount_received: Money;
    profit: Money;
    currency: string;
  }>;
  const sealed = (sealedRes.data ?? []) as Array<{ quantity: number }>;

  // --- Compteurs ---
  const collectionCount = collection.reduce((s, c) => s + (c.quantity ?? 0), 0);
  const stockCount = stock.reduce((s, c) => s + (c.quantity ?? 0), 0);
  const totalOwned = collectionCount + stockCount;
  const distinctCards = new Set(
    [
      ...collection.map((c) => c.card_id),
      ...stock.filter((s) => s.card_id).map((s) => s.card_id as string),
    ],
  ).size;
  const availableForSale = stock
    .filter((s) => s.status === "Disponible")
    .reduce((s, c) => s + (c.quantity ?? 0), 0);
  const reservedCount = stock
    .filter((s) => s.status === "Réservé")
    .reduce((s, c) => s + (c.quantity ?? 0), 0);
  const sealedCount = sealed.reduce((s, c) => s + (c.quantity ?? 0), 0);

  // --- Valorisation (valeur estimée, sinon coût d'acquisition) ---
  const collectionValue = round2(
    collection.reduce(
      (s, c) => s + (toNumber(c.estimated_value) ?? toNumber(c.acquisition_cost) ?? 0),
      0,
    ),
  );
  const stockValue = round2(
    stock.reduce(
      (s, c) => s + (toNumber(c.estimated_value) ?? toNumber(c.acquisition_cost) ?? 0),
      0,
    ),
  );

  // --- Totaux financiers ---
  const totalPurchases = round2(
    purchases.reduce((s, p) => s + (toNumber(p.total) ?? 0), 0),
  );
  const totalSales = round2(
    sales.reduce((s, p) => s + (toNumber(p.amount_received) ?? 0), 0),
  );
  const profit = round2(sales.reduce((s, p) => s + (toNumber(p.profit) ?? 0), 0));


  // --- Évolution mensuelle (12 derniers mois) ---
  const now = new Date();
  const monthKeys: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const monthlyMap = new Map<string, MonthlyDatum>(
    monthKeys.map((k) => {
      const [y, m] = k.split("-");
      const label = new Intl.DateTimeFormat("fr-FR", {
        month: "short",
        year: "2-digit",
      }).format(new Date(Number(y), Number(m) - 1, 1));
      return [k, { label, achats: 0, ventes: 0, profit: 0 }];
    }),
  );
  for (const p of purchases) {
    const k = monthKey(p.purchase_date);
    const e = monthlyMap.get(k);
    if (e) e.achats += toNumber(p.total) ?? 0;
  }
  for (const s of sales) {
    const k = monthKey(s.sale_date);
    const e = monthlyMap.get(k);
    if (e) {
      e.ventes += toNumber(s.amount_received) ?? 0;
      e.profit += toNumber(s.profit) ?? 0;
    }
  }
  const monthly = monthKeys.map((k) => monthlyMap.get(k)!);

  // --- Répartition collection / stock ---
  const split: Datum[] = [
    { label: "Collection", value: collectionCount, color: "#3b82f6" },
    { label: "Stock à vendre", value: stockCount, color: "#ef4444" },
  ];

  // --- Répartition par rareté ---
  const rarityMap = new Map<string, number>();
  for (const c of collection) {
    const r = c.card?.rarity ?? "Inconnue";
    rarityMap.set(r, (rarityMap.get(r) ?? 0) + (c.quantity ?? 0));
  }
  for (const s of stock) {
    const r = s.card?.rarity ?? "Inconnue";
    rarityMap.set(r, (rarityMap.get(r) ?? 0) + (s.quantity ?? 0));
  }
  const rarity: Datum[] = [...rarityMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value], i) => ({
      label,
      value,
      color: RARITY_COLORS[i % RARITY_COLORS.length],
    }));

  // --- Derniers mouvements ---
  const recentMovements: MovementWithCard[] = (
    (movementsRes.data ?? []) as unknown as Array<{
      id: string;
      type: string;
      quantity: number;
      created_at: string;
      notes: string | null;
      card: { name: string } | null;
    }>
  ).map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity,
    created_at: m.created_at,
    notes: m.notes,
    card_name: m.card?.name ?? null,
  }));

  return {
    totalOwned,
    distinctCards,
    collectionCount,
    availableForSale,
    reservedCount,
    sealedCount,
    collectionValue,
    stockValue,
    totalPurchases,
    totalSales,
    profit,
    monthly,
    split,
    rarity,
    recentMovements,
  };
}

const DIST_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#facc15",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#f43f5e",
];

export async function getDistributionStats(
  userId: string,
): Promise<{ language: Datum[]; extension: Datum[] }> {
  const supabase = await createClient();
  const [collectionRes, stockRes] = await Promise.all([
    supabase
      .from("collection_items")
      .select("quantity, language, card:catalog_cards(set:catalog_sets(name))")
      .eq("user_id", userId),
    supabase
      .from("stock_items")
      .select("quantity, language, card:catalog_cards(set:catalog_sets(name))")
      .eq("user_id", userId),
  ]);

  const items = [
    ...(collectionRes.data ?? []),
    ...(stockRes.data ?? []),
  ] as unknown as Array<{
    quantity: number;
    language: string;
    card: { set: { name: string } | null } | null;
  }>;

  const langMap = new Map<string, number>();
  const extMap = new Map<string, number>();
  for (const it of items) {
    const lang = it.language || "Inconnue";
    langMap.set(lang, (langMap.get(lang) ?? 0) + (it.quantity ?? 0));
    const ext = it.card?.set?.name ?? "Inconnue";
    extMap.set(ext, (extMap.get(ext) ?? 0) + (it.quantity ?? 0));
  }

  const toDatum = (map: Map<string, number>, limit = 10): Datum[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([label, value], i) => ({
        label,
        value,
        color: DIST_COLORS[i % DIST_COLORS.length],
      }));

  return { language: toDatum(langMap), extension: toDatum(extMap) };
}

