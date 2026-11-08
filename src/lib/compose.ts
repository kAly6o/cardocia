// Composition automatique de lots / boosters depuis le stock disponible.
import { createClient } from "./supabase/server";

export interface RuleSlot {
  rarity: string | null;
  finish: string | null;
  count: number;
}

export interface CompositionRule {
  source: { type: "all" | "collection" | "set"; id: string | null };
  slots: RuleSlot[];
  allowDuplicates: boolean;
}

export interface ComposedLine {
  stock_item_id: string;
  card_id: string;
  quantity: number;
  unit_cost: number | null;
  language: string | null;
  condition: string | null;
  finish: string | null;
}

export function parseRule(raw: unknown): CompositionRule {
  if (!raw || typeof raw !== "object") {
    return { source: { type: "all", id: null }, slots: [], allowDuplicates: false };
  }
  const r = raw as {
    source?: { type?: string; id?: string | null };
    slots?: { rarity?: string | null; finish?: string | null; count?: unknown }[];
    allowDuplicates?: boolean;
  };
  const type =
    r.source?.type === "collection" || r.source?.type === "set"
      ? r.source.type
      : "all";
  const slots = Array.isArray(r.slots)
    ? r.slots
        .map((s) => ({
          rarity: s?.rarity ? String(s.rarity) : null,
          finish: s?.finish ? String(s.finish) : null,
          count: Math.max(0, Math.round(Number(s?.count) || 0)),
        }))
        .filter((s) => s.count > 0)
    : [];
  return {
    source: { type, id: type === "all" ? null : r.source?.id ?? null },
    slots,
    allowDuplicates: Boolean(r.allowDuplicates),
  };
}

interface StockRow {
  id: string;
  card_id: string;
  quantity: number;
  acquisition_cost: number | null;
  language: string;
  condition: string;
  finish: string;
  card: {
    id: string;
    rarity: string | null;
    set_id: string;
    set: { collection_id: string } | null;
  } | null;
}

export async function composeFromStock(
  userId: string,
  rule: CompositionRule,
): Promise<{ lines: ComposedLine[]; picked: number; requested: number }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stock_items")
    .select(
      "id, card_id, quantity, acquisition_cost, language, condition, finish, card:catalog_cards(id, rarity, set_id, set:catalog_sets(collection_id))",
    )
    .eq("user_id", userId)
    .eq("status", "Disponible")
    .gt("quantity", 0);

  let pool = (data ?? []) as unknown as StockRow[];
  if (rule.source.type === "collection") {
    pool = pool.filter((s) => s.card?.set?.collection_id === rule.source.id);
  } else if (rule.source.type === "set") {
    pool = pool.filter((s) => s.card?.set_id === rule.source.id);
  }

  const used = new Set<string>();
  const remaining = new Map<string, number>();
  for (const s of pool) remaining.set(s.id, s.quantity);

  let picked = 0;

  for (const slot of rule.slots) {
    let need = slot.count;
    while (need > 0) {
      const candidates = pool.filter((s) => {
        if (!s.card) return false;
        if ((remaining.get(s.id) ?? 0) <= 0) return false;
        if (slot.rarity && s.card.rarity !== slot.rarity) return false;
        if (slot.finish && s.finish !== slot.finish) return false;
        if (!rule.allowDuplicates && used.has(s.card_id)) return false;
        return true;
      });
      if (candidates.length === 0) break;
      const s = candidates[Math.floor(Math.random() * candidates.length)];
      remaining.set(s.id, (remaining.get(s.id) ?? 0) - 1);
      if (!rule.allowDuplicates) used.add(s.card_id);
      picked++;
      need--;
    }
  }

  // Applique les décréments et regroupe en lignes (par article de stock).
  const lines: ComposedLine[] = [];
  for (const s of pool) {
    const left = remaining.get(s.id) ?? s.quantity;
    const taken = s.quantity - left;
    if (taken <= 0) continue;
    if (left <= 0) {
      await supabase.from("stock_items").delete().eq("id", s.id);
    } else {
      await supabase
        .from("stock_items")
        .update({ quantity: left })
        .eq("id", s.id);
    }
    lines.push({
      stock_item_id: s.id,
      card_id: s.card_id,
      quantity: taken,
      unit_cost: s.acquisition_cost,
      language: s.language,
      condition: s.condition,
      finish: s.finish,
    });
  }

  return {
    lines,
    picked,
    requested: rule.slots.reduce((s, x) => s + x.count, 0),
  };
}

/**
 * Remet une ligne (lot/booster) en stock : ré-incrémente l'article d'origine
 * s'il existe encore, sinon recrée un article de stock.
 */
export async function releaseLine(
  userId: string,
  line: {
    stock_item_id: string | null;
    card_id: string | null;
    language: string | null;
    condition: string | null;
    finish: string | null;
    quantity: number;
    unit_cost: number | null;
  },
): Promise<void> {
  if (!line.card_id) return;
  const supabase = await createClient();
  const quantity = Math.max(1, line.quantity || 1);

  if (line.stock_item_id) {
    const { data: existing } = await supabase
      .from("stock_items")
      .select("id, quantity")
      .eq("id", line.stock_item_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("stock_items")
        .update({ quantity: (existing.quantity ?? 0) + quantity, status: "Disponible" })
        .eq("id", existing.id);
      return;
    }
  }

  await supabase.from("stock_items").insert({
    user_id: userId,
    card_id: line.card_id,
    language: line.language || "FR",
    condition: line.condition || "Near Mint",
    finish: line.finish || "Normale",
    quantity,
    acquisition_cost: line.unit_cost,
    status: "Disponible",
    entered_at: new Date().toISOString().slice(0, 10),
  });
}
