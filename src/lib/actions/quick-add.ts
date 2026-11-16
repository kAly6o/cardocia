// Helper partagé des ajouts « rapides » (collection & stock).

import { createClient } from "../supabase/server";

export async function quickAddOrIncrement(params: {
  table: "collection_items" | "stock_items";
  userId: string;
  cardId: string;
  finish: string;
  status?: string;
  extra?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();

  let query = supabase
    .from(params.table)
    .select("id, quantity")
    .eq("user_id", params.userId)
    .eq("card_id", params.cardId)
    .eq("language", "FR")
    .eq("condition", "Near Mint")
    .eq("finish", params.finish);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: existing } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from(params.table)
      .update({ quantity: (existing.quantity ?? 0) + 1 })
      .eq("id", existing.id);
    return;
  }

  await supabase.from(params.table).insert({
    user_id: params.userId,
    card_id: params.cardId,
    language: "FR",
    condition: "Near Mint",
    finish: params.finish,
    ...(params.status ? { status: params.status } : {}),
    ...(params.extra ?? {}),
    quantity: 1,
  });
}