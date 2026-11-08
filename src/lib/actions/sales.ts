"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/get-user";
import { createClient } from "@/lib/supabase/server";
import { toNumber, round2 } from "@/lib/utils";
import type { ActionState } from "@/components/ui/Form";

interface SaleLineInput {
  product_type: string;
  name: string;
  card_id: string | null;
  stock_item_id: string | null;
  quantity: number;
  unit_price: number;
  unit_cost: number | null;
}

export async function saveSale(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  let lines: SaleLineInput[];
  try {
    lines = JSON.parse(String(formData.get("lines_json") ?? "[]"));
  } catch {
    return { error: "Données de lignes invalides." };
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { error: "Ajoutez au moins une ligne à la vente." };
  }

  const fees = toNumber(formData.get("fees")) ?? 0;
  const shipping = toNumber(formData.get("shipping_fees")) ?? 0;
  const gross = round2(
    lines.reduce((s, l) => s + (l.quantity || 0) * (toNumber(l.unit_price) ?? 0), 0),
  );
  const amountReceived = round2(gross - fees);
  const costOfGoods = round2(
    lines.reduce((s, l) => s + (l.quantity || 0) * (toNumber(l.unit_cost) ?? 0), 0),
  );
  const profit = round2(amountReceived - costOfGoods - shipping);

  const status = String(formData.get("status") ?? "Validée");
  const header = {
    user_id: user.id,
    sale_date: String(formData.get("sale_date") ?? new Date().toISOString().slice(0, 10)),
    platform: String(formData.get("platform") ?? "Vente directe"),
    reference: formData.get("reference") ? String(formData.get("reference")) : null,
    buyer: formData.get("buyer") ? String(formData.get("buyer")) : null,
    currency: String(formData.get("currency") ?? "EUR"),
    fees,
    shipping_fees: shipping,
    amount_received: amountReceived,
    cost_of_goods: costOfGoods,
    profit,
    status,
    notes: formData.get("notes") ? String(formData.get("notes")) : null,
  };

  const supabase = await createClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .insert(header)
    .select("id")
    .single();
  if (error || !sale) return { error: "Impossible d'enregistrer la vente." };

  const { error: linesError } = await supabase.from("sale_lines").insert(
    lines.map((l) => ({
      sale_id: sale.id,
      user_id: user.id,
      product_type: l.product_type ?? "Carte",
      name: l.name ?? "",
      card_id: l.card_id || null,
      stock_item_id: l.stock_item_id || null,
      quantity: Math.max(1, l.quantity || 1),
      unit_price: toNumber(l.unit_price) ?? 0,
      unit_cost: l.unit_cost !== null && l.unit_cost !== undefined ? toNumber(l.unit_cost) : null,
    })),
  );
  if (linesError) {
    await supabase.from("sales").delete().eq("id", sale.id);
    return { error: "Impossible d'enregistrer les lignes de la vente." };
  }

  // Une vente validée met à jour le stock et conserve l'historique.
  if (status === "Validée") {
    for (const l of lines) {
      if (!l.stock_item_id) continue;
      const qty = Math.max(1, l.quantity || 1);
      const { data: item } = await supabase
        .from("stock_items")
        .select("*")
        .eq("id", l.stock_item_id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!item) continue;
      const remaining = item.quantity - qty;
      await supabase
        .from("stock_items")
        .update({
          quantity: Math.max(0, remaining),
          status: remaining <= 0 ? "Vendu" : item.status,
        })
        .eq("id", l.stock_item_id);
      await supabase.from("stock_movements").insert({
        user_id: user.id,
        type: "Vente",
        card_id: l.card_id,
        stock_item_id: l.stock_item_id,
        quantity: qty,
        reference_type: "sale",
        reference_id: sale.id,
        notes: `Vente enregistrée (${header.platform})`,
      });
    }
  }

  revalidatePath("/ventes");
  revalidatePath("/stock");
  revalidatePath("/");
  return { success: "Vente enregistrée." };
}

export async function deleteSale(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("sales").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/ventes");
  revalidatePath("/");
}
